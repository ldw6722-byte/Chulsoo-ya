package com.chulsooya.server.domain.claim;

import java.time.Clock;
import java.time.Instant;
import java.util.Set;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.domain.order.OrderStatus;
import com.chulsooya.server.domain.order.Payment;
import com.chulsooya.server.domain.order.PaymentRepository;
import com.chulsooya.server.domain.order.PaymentRefundService;
import com.chulsooya.server.domain.user.UserRole;

@Service
@Transactional(readOnly = true)
public class ClaimService {

    private static final Set<OrderStatus> CLAIMABLE_ORDER_STATUSES = Set.of(
            OrderStatus.PREPARING, OrderStatus.DELIVERY_IN_PROGRESS, OrderStatus.PICKUP_READY, OrderStatus.COMPLETED);

    private final OrderRepository orders;
    private final PaymentRepository payments;
    private final ClaimRepository claims;
    private final SettlementRepository settlements;
    private final ClaimEventRepository events;
    private final ClaimEvidenceRepository evidences;
    private final PaymentRefundService paymentRefundService;
    private final ClaimNotificationService notificationService;
    private final Clock clock;

    public ClaimService(OrderRepository orders, PaymentRepository payments, ClaimRepository claims,
            SettlementRepository settlements, ClaimEventRepository events, ClaimEvidenceRepository evidences,
            PaymentRefundService paymentRefundService, ClaimNotificationService notificationService, Clock clock) {
        this.orders = orders;
        this.payments = payments;
        this.claims = claims;
        this.settlements = settlements;
        this.events = events;
        this.evidences = evidences;
        this.paymentRefundService = paymentRefundService;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    /** 주문자 요청·정산 HOLD·불변 이벤트가 함께 성공하거나 함께 롤백된다. */
    @Transactional
    public Claim createByConsumer(Long orderId, Long consumerId, ClaimType type, String reasonCode,
            String description) {
        Instant now = clock.instant();
        Order order = orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));
        if (!order.getConsumerId().equals(consumerId)) throw new DomainException(ErrorCode.FORBIDDEN);
        if (!CLAIMABLE_ORDER_STATUSES.contains(order.getStatus()) || order.getWinningStoreId() == null) {
            throw new DomainException(ErrorCode.REFUND_NOT_ALLOWED, "거래 진행 또는 완료 주문만 클레임을 요청할 수 있습니다.");
        }
        if (claims.existsActiveByOrderId(orderId)) {
            throw new DomainException(ErrorCode.DUPLICATE_IDEMPOTENCY_KEY, "처리 중인 클레임이 이미 있습니다.");
        }

        Payment payment = payments.findByOrderId(orderId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "결제 정보를 찾을 수 없습니다."));
        Settlement settlement = settlements.findByOrderIdForUpdate(orderId)
                .orElseGet(() -> new Settlement(orderId, order.getWinningStoreId(), payment.getId(),
                        payment.getAmount(), now));
        settlement.hold("클레임 접수: " + reasonCode, now);
        settlements.save(settlement);

        Claim claim = new Claim(orderId, consumerId, order.getWinningStoreId(), type, reasonCode, description, now);
        claims.save(claim);
        events.save(new ClaimEvent(claim.getId(), "CLAIM_REQUESTED", consumerId, UserRole.CONSUMER,
                "클레임이 접수되어 정산이 보류되었습니다.", now));
        notificationService.requested(claim);
        return claim;
	}

	@Transactional
	public Claim applySellerAction(Long claimId, Long storeId, SellerClaimAction action, String note,
			String trackingNumber) {
		Instant now = clock.instant();
		Claim claim = claims.findByIdForUpdate(claimId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "클레임을 찾을 수 없습니다."));
		if (!claim.getStoreId().equals(storeId)) {
			throw new DomainException(ErrorCode.FORBIDDEN, "해당 클레임의 낙찰 판매자만 처리할 수 있습니다.");
		}
		ClaimStatus next = switch (action) {
			case ACKNOWLEDGE -> ClaimStatus.SELLER_REVIEWING;
			case SCHEDULE_PICKUP -> ClaimStatus.PICKUP_SCHEDULED;
			case SHIP_REPLACEMENT -> ClaimStatus.REPLACEMENT_SHIPPING;
			case ESCALATE -> ClaimStatus.ESCALATED;
		};
		claim.transitionTo(next, now);
		String detail = action == SellerClaimAction.SHIP_REPLACEMENT && trackingNumber != null && !trackingNumber.isBlank()
				? required(note) + " (운송장: " + trackingNumber.trim() + ")"
				: required(note);
		events.save(new ClaimEvent(claim.getId(), action.name(), storeId, UserRole.SELLER, detail, now));
		notificationService.updated(claim, "판매자가 클레임 처리 상태를 변경했습니다: " + next.name());
		return claim;
	}

	@Transactional
	public Claim resolveByAdmin(com.chulsooya.server.support.CurrentUser actor, Long claimId,
			AdminClaimDecision decision, String note, Integer refundAmount) {
		if (!actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
		Instant now = clock.instant();
		Claim claim = claims.findByIdForUpdate(claimId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "클레임을 찾을 수 없습니다."));
		Settlement settlement = settlements.findByOrderIdForUpdate(claim.getOrderId())
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "정산 정보를 찾을 수 없습니다."));
		String detail = required(note);
		switch (decision) {
			case REJECT -> {
				claim.transitionTo(ClaimStatus.REJECTED, now);
				settlement.markReleasable(now);
			}
			case RESOLVE_NO_REFUND -> {
				claim.transitionTo(ClaimStatus.RESOLVED, now);
				settlement.markReleasable(now);
			}
			case FULL_REFUND -> {
				Payment payment = payments.findByOrderId(claim.getOrderId())
						.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "결제 정보를 찾을 수 없습니다."));
				int amount = refundAmount == null ? payment.getRemainingAmount() : refundAmount;
				if (amount != payment.getRemainingAmount()) {
					throw new DomainException(ErrorCode.REFUND_AMOUNT_EXCEEDED, "클레임 전액 환불은 남은 결제 금액 전체만 가능합니다.");
				}
				paymentRefundService.refundForApprovedClaim(actor, payment.getId(), amount,
						"클레임 전액 환불: " + detail, "claim-full-refund-" + claimId);
				claim.transitionTo(ClaimStatus.RESOLVED, now);
				settlement.cancelForFullRefund(now);
			}
		}
		events.save(new ClaimEvent(claim.getId(), "ADMIN_" + decision.name(), actor.userId(), UserRole.ADMIN,
				detail, now));
		notificationService.updated(claim, "관리자 결정이 반영되었습니다: " + decision.name());
		return claim;
	}

	@Transactional(readOnly = true)
	public List<ClaimDtos.ClaimResponse> listByConsumer(Long consumerId) {
		return claims.findByConsumerIdOrderByCreatedAtDesc(consumerId).stream().map(ClaimDtos.ClaimResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public List<ClaimDtos.ClaimResponse> listByStore(Long storeId) {
		return claims.findByStoreIdOrderByCreatedAtDesc(storeId).stream().map(ClaimDtos.ClaimResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public List<ClaimDtos.ClaimResponse> listByStatus(ClaimStatus status) {
		return claims.findByStatusOrderByCreatedAtDesc(status).stream().map(ClaimDtos.ClaimResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public ClaimDtos.ClaimDetailResponse detailForConsumer(Long claimId, Long consumerId) {
		Claim claim = requireClaim(claimId);
		if (!claim.getConsumerId().equals(consumerId)) throw new DomainException(ErrorCode.FORBIDDEN);
		return detail(claim);
	}

	@Transactional(readOnly = true)
	public ClaimDtos.ClaimDetailResponse detailForStore(Long claimId, Long storeId) {
		Claim claim = requireClaim(claimId);
		if (!claim.getStoreId().equals(storeId)) throw new DomainException(ErrorCode.FORBIDDEN);
		return detail(claim);
	}

	@Transactional(readOnly = true)
	public ClaimDtos.ClaimDetailResponse detailForAdmin(Long claimId) {
		return detail(requireClaim(claimId));
	}

	private ClaimDtos.ClaimDetailResponse detail(Claim claim) {
		Settlement settlement = settlements.findByOrderId(claim.getOrderId())
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "정산 정보를 찾을 수 없습니다."));
		return new ClaimDtos.ClaimDetailResponse(ClaimDtos.ClaimResponse.from(claim), settlement.getStatus(),
				settlement.getHoldReason(), evidences.findByClaimIdOrderByCreatedAtAsc(claim.getId()).stream()
						.map(ClaimDtos.EvidenceResponse::from).toList(),
				events.findByClaimIdOrderByCreatedAtAsc(claim.getId()).stream().map(ClaimDtos.EventResponse::from).toList());
	}

	private Claim requireClaim(Long claimId) {
		return claims.findById(claimId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "클레임을 찾을 수 없습니다."));
	}

	private String required(String value) {
		if (value == null || value.isBlank()) throw new DomainException(ErrorCode.INVALID_ORDER_STATUS, "처리 사유를 입력해 주세요.");
		return value.trim();
	}
}
