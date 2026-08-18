package com.chulsooya.server.domain.matching;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.chulsooya.server.config.AppProperties;
import com.chulsooya.server.domain.catalog.Category;
import com.chulsooya.server.domain.catalog.CategoryRepository;
import com.chulsooya.server.domain.catalog.Product;
import com.chulsooya.server.domain.catalog.ProductRepository;
import com.chulsooya.server.domain.order.FulfillmentMethod;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderItem;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.domain.order.OrderStatus;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;

import java.time.Clock;

@SpringBootTest
class ConcurrentBidTest {

	@Autowired
	private OrderRepository orderRepository;
	@Autowired
	private StoreRepository storeRepository;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private CategoryRepository categoryRepository;
	@Autowired
	private ProductRepository productRepository;
	@Autowired
	private OfferDispatchService offerDispatchService;
	@Autowired
	private BidService bidService;
	@Autowired
	private BidRepository bidRepository;
	@Autowired
	private TransactionTemplate transactionTemplate;
	@Autowired
	private AppProperties properties;
	@Autowired
	private Clock clock;

	@Test
	@DisplayName("여러 판매자가 동시에 응찰해도 낙찰자는 정확히 한 명이다")
	void onlyOneWinnerUnderConcurrency() throws Exception {
		String gu = "GU_CONCURRENT";
		List<Long> storeIds = transactionTemplate.execute(status -> {
			Category category = categoryRepository.save(new Category("t-" + gu, "테스트", null, 99));
			Product product = productRepository.save(
					new Product(category, "테스트 상품", "규격", 10000, "개", null));

			List<Long> ids = List.of(
					createStore(gu, "매장A", SubscriptionTier.PREMIUM),
					createStore(gu, "매장B", SubscriptionTier.PREMIUM),
					createStore(gu, "매장C", SubscriptionTier.PREMIUM),
					createStore(gu, "매장D", SubscriptionTier.PREMIUM),
					createStore(gu, "매장E", SubscriptionTier.PREMIUM));

			Order order = new Order(1L, gu, FulfillmentMethod.DELIVERY, "서울 강남구 1", null, null, 3000);
			order.addItem(new OrderItem(product.getId(), product.getName(), null, "개", 1, product.getPrice()));
			order.submitForMatching(clock.instant(), properties.matching().matchWindowSeconds());
			Order saved = orderRepository.save(order);
			offerDispatchService.dispatch(saved);
			orderIdHolder.set(saved.getId());
			return ids;
		});

		Long orderId = orderIdHolder.get();
		int threads = storeIds.size();
		CountDownLatch ready = new CountDownLatch(threads);
		CountDownLatch go = new CountDownLatch(1);
		AtomicInteger success = new AtomicInteger();
		AtomicInteger failure = new AtomicInteger();

		try (ExecutorService pool = Executors.newFixedThreadPool(threads)) {
			for (Long storeId : storeIds) {
				pool.submit(() -> {
					ready.countDown();
					try {
						go.await();
						transactionTemplate.executeWithoutResult(s -> bidService.placeBid(orderId, storeId));
						success.incrementAndGet();
					} catch (Exception e) {
						failure.incrementAndGet();
					}
				});
			}
			ready.await(5, TimeUnit.SECONDS);
			go.countDown();
			pool.shutdown();
			assertThat(pool.awaitTermination(20, TimeUnit.SECONDS)).isTrue();
		}

		assertThat(success.get()).isEqualTo(1);
		assertThat(failure.get()).isEqualTo(threads - 1);

		transactionTemplate.executeWithoutResult(s -> {
			assertThat(bidRepository.findByOrderId(orderId).stream().filter(b -> b.isWinner()).count())
					.isEqualTo(1);
			Order reloaded = orderRepository.findById(orderId).orElseThrow();
			assertThat(reloaded.getStatus()).isEqualTo(OrderStatus.SELLER_CONFIRMING);
			assertThat(reloaded.getWinningStoreId()).isNotNull();
		});
	}

	@Test
	@Transactional
	@DisplayName("낙찰 후 다른 판매자의 예약 슬롯이 모두 해제된다")
	void reservedSlotsReleasedAfterWin() {
		String gu = "GU_RELEASE";
		Category category = categoryRepository.save(new Category("t-" + gu, "테스트2", null, 98));
		Product product = productRepository.save(new Product(category, "상품2", "규격", 5000, "개", null));

		Long a = createStore(gu, "R매장A", SubscriptionTier.PREMIUM);
		Long b = createStore(gu, "R매장B", SubscriptionTier.PREMIUM);

		Order order = new Order(1L, gu, FulfillmentMethod.PICKUP, null, null, null, 3000);
		order.addItem(new OrderItem(product.getId(), product.getName(), null, "개", 2, product.getPrice()));
		order.submitForMatching(clock.instant(), properties.matching().matchWindowSeconds());
		Order saved = orderRepository.save(order);

		int dispatched = offerDispatchService.dispatch(saved);
		assertThat(dispatched).isEqualTo(2);
		assertThat(storeRepository.findById(a).orElseThrow().getReservedSlots()).isEqualTo(1);
		assertThat(storeRepository.findById(b).orElseThrow().getReservedSlots()).isEqualTo(1);

		bidService.placeBid(saved.getId(), a);

		Store winner = storeRepository.findById(a).orElseThrow();
		Store loser = storeRepository.findById(b).orElseThrow();
		assertThat(winner.getReservedSlots()).isZero();
		assertThat(winner.getActiveSlots()).isEqualTo(1);
		assertThat(loser.getReservedSlots()).isZero();
		assertThat(loser.getActiveSlots()).isZero();
	}

	private final ThreadLocal<Long> orderIdHolderInternal = new ThreadLocal<>();
	private static final java.util.concurrent.atomic.AtomicLong ORDER_ID = new java.util.concurrent.atomic.AtomicLong();
	private final OrderIdHolder orderIdHolder = new OrderIdHolder();

	private static final class OrderIdHolder {
		void set(Long id) {
			ORDER_ID.set(id);
		}

		Long get() {
			return ORDER_ID.get();
		}
	}

	private Long createStore(String gu, String name, SubscriptionTier tier) {
		User owner = userRepository.save(
				new User(name + "@test.dev", name + " 사장", "010", UserRole.SELLER));
		Store store = new Store(owner, name, gu, "서울 강남구 " + name, "02", tier);
		store.verify();
		store.changeConfiguredSlots(3);
		return storeRepository.save(store).getId();
	}
}
