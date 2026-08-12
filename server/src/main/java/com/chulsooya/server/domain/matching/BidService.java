package com.chulsooya.server.domain.matching;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.config.AppProperties;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.domain.order.OrderStatus;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;

/**
 * 낙찰 동시성 제어.
 * 절차: 주문 행 비관적 락 획득 -> 상태 WAITING_MATCH 확인 -> 낙찰자 생성 ->
 * 주문/판매자 가용량 원자적 갱신. 실패 시 ORDER_NOT_WAITING_MATCH 반환.
 */
@Service
public class BidService {

	private final OrderRepository orderRepository;
	private final StoreRepository storeRepository;
	private final MatchOfferRepository offerRepository;
	private final BidRepository bidRepository;
	private final AppProperties properties;
	private final Clock clock;

	public BidService(OrderRepository orderRepository,
			StoreRepository storeRepository,
			MatchOfferRepository offerRepository,
			BidRepository bidRepository,
			AppProperties properties,
			Clock clock) {
		this.orderRepository = orderRepository;
		this.storeRepository = storeRepository;
		this.offerRepository = offerRepository;
		this.bidRepository = bidRepository;
		this.properties = properties;
		this.clock = clock;
	}

	/** 판매자 응찰. 성공 시 낙찰(단일 판매자 책임 납품, 부분 응찰 없음). */
	@Transactional
	public Bid placeBid(Long orderId, Long storeId) {
		Instant now = clock.instant();

		Order order = orderRepository.findByIdForUpdate(orderId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));

		if (order.getStatus() != OrderStatus.WAITING_MATCH) {
			throw new DomainException(ErrorCode.ORDER_NOT_WAITING_MATCH);
		}
		if (bidRepository.findByOrderIdAndWinnerTrue(orderId).isPresent()) {
			throw new DomainException(ErrorCode.ALREADY_HAS_WINNER);
		}

		Store store = storeRepository.findByIdForUpdate(storeId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "매장을 찾을 수 없습니다."));
		if (store.isRestricted(now)) {
			throw new DomainException(ErrorCode.STORE_RESTRICTED);
		}

		MatchOffer offer = offerRepository
				.findByOrderIdAndStoreIdAndAttempt(orderId, storeId, order.getRetryCount())
				.orElseThrow(() -> new DomainException(ErrorCode.FORBIDDEN, "이 주문에 대한 제안이 없습니다."));
		if (offer.isExpired(now)) {
			offer.close(OfferStatus.EXPIRED, now);
			store.releaseReservedSlot();
			throw new DomainException(ErrorCode.OFFER_EXPIRED);
		}
		if (!offer.isOpen(now)) {
			throw new DomainException(ErrorCode.OFFER_ALREADY_CLOSED);
		}

		// 낙찰 확정: 주문 상태 전이 + 슬롯 예약->진행 전환
		order.assignWinner(storeId, now, properties.matching().sellerConfirmWindowSeconds());
		offer.close(OfferStatus.BID_SUBMITTED, now);
		store.convertReservedToActive();

		// 같은 회차의 다른 열린 제안은 종료하고 예약 슬롯을 즉시 해제한다.
		closeRemainingOffers(orderId, order.getRetryCount(), storeId, now);

		return bidRepository.save(new Bid(orderId, storeId, true, now));
	}

	/** 판매자 제안 거절. 예약 슬롯을 즉시 해제한다. */
	@Transactional
	public void declineOffer(Long orderId, Long storeId) {
		Instant now = clock.instant();
		Order order = orderRepository.findById(orderId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));
		MatchOffer offer = offerRepository
				.findByOrderIdAndStoreIdAndAttempt(orderId, storeId, order.getRetryCount())
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문 제안을 찾을 수 없습니다."));
		if (offer.getStatus() != OfferStatus.SENT) {
			throw new DomainException(ErrorCode.OFFER_ALREADY_CLOSED);
		}
		offer.close(OfferStatus.DECLINED, now);
		storeRepository.findByIdForUpdate(storeId).ifPresent(Store::releaseReservedSlot);
	}

	/** 낙찰 판매자의 2분 내 물품 확인 완료. 이후 결제 진행이 가능해진다. */
	@Transactional
	public Order confirmStock(Long orderId, Long storeId) {
		Instant now = clock.instant();
		Order order = orderRepository.findByIdForUpdate(orderId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));
		if (order.getWinningStoreId() == null || !order.getWinningStoreId().equals(storeId)) {
			throw new DomainException(ErrorCode.FORBIDDEN, "낙찰 판매자만 물품 확인이 가능합니다.");
		}
		order.confirmStock(now);
		bidRepository.findByOrderIdAndWinnerTrue(orderId).ifPresent(bid -> bid.markConfirmed(now));
		return order;
	}

	private void closeRemainingOffers(Long orderId, int attempt, Long winnerStoreId, Instant now) {
		offerRepository.findByOrderIdAndAttempt(orderId, attempt).stream()
				.filter(o -> !o.getStoreId().equals(winnerStoreId))
				.filter(o -> o.getStatus() == OfferStatus.SENT)
				.forEach(o -> {
					o.close(OfferStatus.EXPIRED, now);
					storeRepository.findByIdForUpdate(o.getStoreId()).ifPresent(Store::releaseReservedSlot);
				});
	}
}
