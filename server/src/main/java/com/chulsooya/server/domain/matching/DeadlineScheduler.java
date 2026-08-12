package com.chulsooya.server.domain.matching;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.config.AppProperties;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;

/**
 * 마감 집행 안전망. 트랜잭션 규칙을 대체하지 않고 누락된 마감 전이만 복구한다.
 * README.ko.md 7 기준 주기: 제안 만료 10초, 매칭 마감 30초, 물품 확인 마감 10초.
 */
@Component
public class DeadlineScheduler {

	private static final Logger log = LoggerFactory.getLogger(DeadlineScheduler.class);

	private final OrderRepository orderRepository;
	private final MatchOfferRepository offerRepository;
	private final StoreRepository storeRepository;
	private final OfferDispatchService offerDispatchService;
	private final AppProperties properties;
	private final Clock clock;

	public DeadlineScheduler(OrderRepository orderRepository,
			MatchOfferRepository offerRepository,
			StoreRepository storeRepository,
			OfferDispatchService offerDispatchService,
			AppProperties properties,
			Clock clock) {
		this.orderRepository = orderRepository;
		this.offerRepository = offerRepository;
		this.storeRepository = storeRepository;
		this.offerDispatchService = offerDispatchService;
		this.properties = properties;
		this.clock = clock;
	}

	/** 만료된 제안을 종료하고 해당 예약 슬롯만 해제한다. */
	@Scheduled(fixedDelay = 10_000)
	@Transactional
	public void expireOffers() {
		Instant now = clock.instant();
		List<MatchOffer> expired = offerRepository.findExpired(now);
		for (MatchOffer offer : expired) {
			offer.close(OfferStatus.EXPIRED, now);
			storeRepository.findByIdForUpdate(offer.getStoreId()).ifPresent(Store::releaseReservedSlot);
		}
		if (!expired.isEmpty()) {
			log.debug("만료 제안 {}건 정리", expired.size());
		}
	}

	/** 5분 매칭 마감. 응찰이 없으면 MATCH_FAILED 로 전이한다. */
	@Scheduled(fixedDelay = 30_000)
	@Transactional
	public void failStaleMatching() {
		Instant now = clock.instant();
		for (Order order : orderRepository.findExpiredWaitingMatch(now)) {
			offerRepository.findOpenByOrder(order.getId()).forEach(offer -> {
				offer.close(OfferStatus.EXPIRED, now);
				storeRepository.findByIdForUpdate(offer.getStoreId()).ifPresent(Store::releaseReservedSlot);
			});
			order.markMatchFailed(now);
			log.info("주문 {} 매칭 실패 처리", order.getId());
		}
	}

	/** 2분 물품 확인 마감. 진행 슬롯 해제 + 패널티 + 가속 재입찰. */
	@Scheduled(fixedDelay = 10_000)
	@Transactional
	public void recoverStaleConfirmation() {
		Instant now = clock.instant();
		for (Order order : orderRepository.findExpiredSellerConfirming(now)) {
			Long storeId = order.getWinningStoreId();
			if (storeId != null) {
				storeRepository.findByIdForUpdate(storeId).ifPresent(store -> {
					store.releaseActiveSlot();
					// 낙찰 후 2분 경과 미확인: 24시간 응찰 차단 + 신뢰 점수 차감
					store.restrictUntil(now.plus(Duration.ofHours(24)));
					store.adjustTrustScore(-10);
				});
			}
			order.restartMatching(now, properties.matching().matchWindowSeconds());
			offerDispatchService.dispatch(order);
			log.info("주문 {} 물품 확인 만료 -> 가속 재입찰 (retry={})", order.getId(), order.getRetryCount());
		}
	}

	/** 지연 발송 제안이 도달 시각을 넘긴 주문에 대해 추가 확산을 시도한다. */
	@Scheduled(fixedDelay = 15_000)
	@Transactional
	public void spreadPendingOrders() {
		Instant now = clock.instant();
		orderRepository.findExpiredWaitingMatch(now.minusSeconds(properties.matching().matchWindowSeconds()));
		// 아직 대기 중인 주문에 대해 신규 가용 슬롯이 생긴 매장으로 확산
		orderRepository.findAll().stream()
				.filter(o -> o.getStatus() == com.chulsooya.server.domain.order.OrderStatus.WAITING_MATCH)
				.filter(o -> !o.isMatchDeadlinePassed(now))
				.forEach(offerDispatchService::dispatch);
	}
}
