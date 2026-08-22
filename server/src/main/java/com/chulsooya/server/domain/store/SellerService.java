package com.chulsooya.server.domain.store;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.matching.BidRepository;
import com.chulsooya.server.domain.matching.MatchOffer;
import com.chulsooya.server.domain.matching.MatchOfferRepository;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderItem;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.domain.order.OrderStatus;
import com.chulsooya.server.domain.penalty.PenaltyRepository;
import com.chulsooya.server.domain.store.SellerDtos.AssignedOrderResponse;
import com.chulsooya.server.domain.store.SellerDtos.CompletedTradeDocumentResponse;

import com.chulsooya.server.domain.store.SellerDtos.MetricsResponse;
import com.chulsooya.server.domain.store.SellerDtos.OfferItemLine;
import com.chulsooya.server.domain.store.SellerDtos.OfferResponse;
import com.chulsooya.server.domain.store.SellerDtos.PenaltyHistoryResponse;
import com.chulsooya.server.domain.store.SellerDtos.SlotLogResponse;
import com.chulsooya.server.domain.store.SellerDtos.StoreResponse;

@Service
public class SellerService {

	private final StoreRepository storeRepository;
	private final MatchOfferRepository offerRepository;
	private final OrderRepository orderRepository;
	private final BidRepository bidRepository;
	private final SlotSettingsLogRepository slotLogRepository;
	private final MissedOrderLogRepository missedOrderLogRepository;
	private final PenaltyRepository penaltyRepository;
	private final Clock clock;

	public SellerService(StoreRepository storeRepository,
			MatchOfferRepository offerRepository,
			OrderRepository orderRepository,
			BidRepository bidRepository,
			SlotSettingsLogRepository slotLogRepository,
			MissedOrderLogRepository missedOrderLogRepository,
			PenaltyRepository penaltyRepository,
			Clock clock) {
		this.storeRepository = storeRepository;
		this.offerRepository = offerRepository;
		this.orderRepository = orderRepository;
		this.bidRepository = bidRepository;
		this.slotLogRepository = slotLogRepository;
		this.missedOrderLogRepository = missedOrderLogRepository;
		this.penaltyRepository = penaltyRepository;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public Store requireStoreByOwner(Long ownerId) {
		return storeRepository.findByOwnerId(ownerId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매자 매장을 찾을 수 없습니다."));
	}

	@Transactional(readOnly = true)
	public StoreResponse myStore(Long ownerId) {
		return toResponse(requireStoreByOwner(ownerId));
	}

	/** 슬롯 설정 변경. 모든 변경은 감사 로그를 남긴다. */
	@Transactional
	public StoreResponse updateSlots(Long ownerId, int configuredSlots, String reason, String changedBy) {
		Store store = requireStoreByOwner(ownerId);
		int old = store.getConfiguredSlots();
		store.changeConfiguredSlots(configuredSlots);
		if (configuredSlots > 0) {
			store.resumeReceiving(configuredSlots);
		}
		slotLogRepository.save(new StoreSlotSettingsLog(store.getId(), old, configuredSlots, changedBy, reason));
		return toResponse(store);
	}

    /** 회원 기본 주소와 분리된 판매점 운영 정보만 저장한다. */
    @Transactional
    public StoreResponse updateOperations(Long ownerId, SellerDtos.UpdateStoreOperationsRequest request) {
        Store store = requireStoreByOwner(ownerId);
        store.changeBusinessOperations(request.directions(), request.businessOpenTime(), request.businessCloseTime(),
                request.weeklyClosedDays(), request.temporaryClosed());
        return toResponse(store);
    }

	/** 원터치 바쁨 모드. 설정 슬롯을 0으로 만들고 주문 수신을 중지한다. */
	@Transactional
	public StoreResponse enterBusyMode(Long ownerId) {
		Store store = requireStoreByOwner(ownerId);
		int old = store.getConfiguredSlots();
		store.enterBusyMode();
		slotLogRepository.save(new StoreSlotSettingsLog(store.getId(), old, 0, "SELLER", "BUSY_MODE"));
		return toResponse(store);
	}

	/** 실시간 주문 제안 큐. 발송 예정 시각이 지난 열린 제안만 노출한다. */
	@Transactional(readOnly = true)
	public List<OfferResponse> offerQueue(Long ownerId) {
		Instant now = clock.instant();
		Store store = requireStoreByOwner(ownerId);

		List<MatchOffer> offers = offerRepository.findOpenByStore(store.getId(), now).stream()
				.filter(o -> !o.getOfferedAt().isAfter(now))
				.toList();
		if (offers.isEmpty()) {
			return List.of();
		}
		Map<Long, Order> orders = orderRepository
				.findAllById(offers.stream().map(MatchOffer::getOrderId).toList())
				.stream()
				.collect(Collectors.toMap(Order::getId, Function.identity()));

		return offers.stream()
				.filter(o -> {
					Order order = orders.get(o.getOrderId());
					return order != null && order.getStatus() == OrderStatus.WAITING_MATCH;
				})
				.map(o -> {
					Order order = orders.get(o.getOrderId());
					return new OfferResponse(
							o.getId(),
							order.getId(),
							order.getStatus(),
							order.getFulfillmentMethod(),
							order.getGuCode(),
							maskAddress(order.getAddress()),
							order.getItemsAmount(),
							order.getDeliveryFee(),
							order.getTotalAmount(),
							countItems(order),
							toLines(order),
							o.getOfferedAt(),
							o.getExpiresAt(),
							now);
				})
				.toList();
	}

	/** 물품 확인 작업 영역 + 진행 중 이행 목록. */
	@Transactional(readOnly = true)
	public List<AssignedOrderResponse> assignedOrders(Long ownerId) {
		Instant now = clock.instant();
		Store store = requireStoreByOwner(ownerId);
		return orderRepository.findByWinningStoreIdOrderByIdDesc(store.getId()).stream()
				.filter(o -> !o.getStatus().isTerminal())
				.map(o -> new AssignedOrderResponse(
						o.getId(),
						o.getStatus(),
						o.getFulfillmentMethod(),
						maskAddress(o.getAddress()),
						o.getTotalAmount(),
						countItems(o),
						toLines(o),
						o.getSellerConfirmationDeadlineAt(),
						o.getMatchedAt(),
						now))
				.toList();
	}

		/** 거래 완료된 낙찰 주문만 판매자 문서함에 노출한다. */
	@Transactional(readOnly = true)
	public List<CompletedTradeDocumentResponse> completedTradeDocuments(Long ownerId) {
		Store store = requireStoreByOwner(ownerId);
		return orderRepository.findByWinningStoreIdOrderByIdDesc(store.getId()).stream()
				.filter(order -> order.getStatus() == OrderStatus.COMPLETED)
				.limit(30)
				.map(order -> new CompletedTradeDocumentResponse(order.getId(), order.getFulfillmentMethod(),
						order.getTotalAmount(), countItems(order), order.getCompletedAt()))
				.toList();
	}

	@Transactional(readOnly = true)
	public MetricsResponse metrics(Long ownerId) {

		Store store = requireStoreByOwner(ownerId);
		long received = bidRepository.countByStoreId(store.getId());
		long won = bidRepository.countByStoreIdAndWinnerTrue(store.getId());
		long missed = missedOrderLogRepository.countByStoreId(store.getId());
		double rate = received == 0 ? 0.0 : (double) won / received * 100.0;
		return new MetricsResponse(received, won, missed, Math.round(rate * 10) / 10.0, store.getTrustScore());
	}

	@Transactional(readOnly = true)
	public List<PenaltyHistoryResponse> penaltyHistory(Long ownerId) {
		Store store = requireStoreByOwner(ownerId);
		return penaltyRepository.findTop50ByStoreIdOrderByAppliedAtDesc(store.getId()).stream()
				.map(penalty -> new PenaltyHistoryResponse(penalty.getId(), penalty.getOrderId(),
						penalty.getViolationType().name(), penalty.getLevel(), penalty.getTrustScoreDelta(),
						penalty.getRestrictionUntil(), penalty.getReason(), penalty.getAppliedAt()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<SlotLogResponse> slotLogs(Long ownerId) {
		Store store = requireStoreByOwner(ownerId);
		return slotLogRepository.findTop50ByStoreIdOrderByCreatedAtDesc(store.getId()).stream()
				.map(l -> new SlotLogResponse(l.getId(), l.getOldConfiguredSlots(), l.getNewConfiguredSlots(),
						l.getChangedBy(), l.getReason(), l.getCreatedAt()))
				.toList();
	}

	public StoreResponse toResponse(Store store) {
		return new StoreResponse(
				store.getId(),
				store.getName(),
				store.getGuCode(),
				store.getAddress(),
				store.getPhone(),
				store.getTier(),
				store.getTierSlotCap(),
				store.getConfiguredSlots(),
				store.getReservedSlots(),
				store.getActiveSlots(),
				store.getAvailableSlots(),
				store.isReceivingOrders(),
				store.isVerified(),
									store.getRestrictedUntil(),
					store.getTrustScore(),
					clock.instant(),
                    store.getDirections(),
                    store.getBusinessOpenTime(),
                    store.getBusinessCloseTime(),
                    store.weeklyClosedDaySet(),
                    store.isTemporaryClosed(),
                    store.operatingStatus(clock.instant()));

	}

	private List<OfferItemLine> toLines(Order order) {
		return order.getItems().stream()
				.map(i -> new OfferItemLine(i.getProductName(), i.getSpecSummary(), i.getQuantity(), i.getUnit()))
				.toList();
	}

	private int countItems(Order order) {
		return order.getItems().stream().mapToInt(OrderItem::getQuantity).sum();
	}

	/** 낙찰 전에는 상세 주소를 노출하지 않는다(개인정보 마스킹). */
	private String maskAddress(String address) {
		if (address == null || address.isBlank()) {
			return null;
		}
		String[] tokens = address.trim().split("\\s+");
		if (tokens.length <= 3) {
			return address;
		}
		return String.join(" ", tokens[0], tokens[1], tokens[2]) + " ***";
	}
}
