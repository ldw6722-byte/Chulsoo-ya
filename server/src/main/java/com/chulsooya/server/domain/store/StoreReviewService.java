package com.chulsooya.server.domain.store;

import static com.chulsooya.server.domain.store.StoreReviewDtos.*;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.domain.order.OrderStatus;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class StoreReviewService {
    private static final Duration REVIEW_WINDOW = Duration.ofDays(20);
    private final StoreRepository stores;
    private final OrderRepository orders;
    private final StoreReviewRepository reviews;
    private final UserRepository users;
    private final AdminStoreReviewNoteRepository notes;

    public StoreReviewService(StoreRepository stores, OrderRepository orders, StoreReviewRepository reviews, UserRepository users, AdminStoreReviewNoteRepository notes) {
        this.stores = stores;
        this.orders = orders;
        this.reviews = reviews;
        this.users = users;
        this.notes = notes;
    }

    public StoreDetailResponse detail(Long storeId, CurrentUser actor) {
        Store store = requireStore(storeId);
        if (!store.isVerified() || !store.isDirectoryVisible()) {
            throw new DomainException(ErrorCode.NOT_FOUND, "판매점을 찾을 수 없습니다.");
        }
        List<StoreReview> published = reviews.findByStoreIdAndVisibilityOrderByCreatedAtDesc(storeId, StoreReview.ReviewVisibility.PUBLISHED);
        return new StoreDetailResponse(StoreDirectoryDtos.StoreResponse.from(store, Instant.now()), toResponses(published),
                published.size(), average(published), actor == null ? new ReviewEligibility(false, "로그인 후 거래 후기를 작성할 수 있습니다.", null, null) : eligibility(storeId, actor));
    }

    public ReviewEligibility eligibility(Long storeId, CurrentUser actor) {
        Instant now = Instant.now();
        Order order = orders.findByConsumerIdOrderByIdDesc(actor.userId()).stream()
                .filter(candidate -> storeId.equals(candidate.getWinningStoreId()))
                .filter(candidate -> candidate.getStatus() == OrderStatus.COMPLETED && candidate.getCompletedAt() != null)
                .filter(candidate -> !candidate.getCompletedAt().plus(REVIEW_WINDOW).isBefore(now))
                .findFirst().orElse(null);
        if (order == null) return new ReviewEligibility(false, "거래 완료 후 20일 이내에만 후기를 작성할 수 있습니다.", null, null);
        if (reviews.existsByOrderId(order.getId())) return new ReviewEligibility(false, "해당 거래의 후기는 이미 작성했습니다.", order.getId(), order.getCompletedAt().plus(REVIEW_WINDOW));
        return new ReviewEligibility(true, "거래 완료 후기를 작성할 수 있습니다.", order.getId(), order.getCompletedAt().plus(REVIEW_WINDOW));
    }

    @Transactional
    public ReviewResponse create(Long storeId, CurrentUser actor, CreateReviewRequest request) {
        Store store = requireStore(storeId);
        ReviewEligibility eligibility = eligibility(storeId, actor);
        if (!eligibility.eligible()) throw new DomainException(ErrorCode.FORBIDDEN, eligibility.reason());
        if (!eligibility.orderId().equals(request.orderId())) throw new DomainException(ErrorCode.FORBIDDEN, "후기 작성 가능한 거래가 아닙니다.");
        double trustDelta = trustDelta(request.rating());
        StoreReview review = reviews.save(new StoreReview(storeId, request.orderId(), actor.userId(), request.rating(), request.comment(), trustDelta));
        store.adjustTrustScore(trustDelta);
        refreshRating(store);
        return ReviewResponse.from(review, consumerName(actor.userId()));
    }

    public List<ReviewResponse> adminList(CurrentUser actor) {
        requireAdmin(actor);
        return toResponses(reviews.findAllByOrderByCreatedAtDesc());
    }
    public List<ReviewResponse> adminListForStore(Long storeId, CurrentUser actor) {
        requireAdmin(actor);
        requireStore(storeId);
        return toResponses(reviews.findByStoreIdOrderByCreatedAtDesc(storeId));
    }
    public List<ReviewResponse> sellerList(CurrentUser actor) {
        Store store = requireSellerStore(actor);
        return toResponses(reviews.findByStoreIdOrderByCreatedAtDesc(store.getId()));
    }
    @Transactional
    public ReviewResponse reply(Long reviewId, CurrentUser actor, ReplyRequest request, boolean sellerOnly) {
        StoreReview review = reviews.findById(reviewId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Review not found"));
        if (sellerOnly) {
            Store store = requireSellerStore(actor);
            if (!store.getId().equals(review.getStoreId())) throw new DomainException(ErrorCode.FORBIDDEN, "Not your store review");
        } else {
            requireAdmin(actor);
        }
        review.reply(request.reply(), actor.userId(), Instant.now());
        return ReviewResponse.from(review, consumerName(review.getConsumerId()));
    }

    @Transactional
    public ReviewResponse updateComment(Long reviewId, CurrentUser actor, UpdateReviewRequest request) {
        requireAdmin(actor);
        StoreReview review = reviews.findById(reviewId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "후기를 찾을 수 없습니다."));
        review.updateComment(request.comment());
        return ReviewResponse.from(review, consumerName(review.getConsumerId()));
    }
    public List<AdminStoreNoteResponse> adminNotesForStore(Long storeId, CurrentUser actor) {
        requireAdmin(actor);
        requireStore(storeId);
        return notes.findByStoreIdOrderByCreatedAtDesc(storeId).stream().map(AdminStoreNoteResponse::from).toList();
    }
    @Transactional
    public AdminStoreNoteResponse createAdminNote(Long storeId, CurrentUser actor, AdminStoreNoteRequest request) {
        requireAdmin(actor);
        requireStore(storeId);
        return AdminStoreNoteResponse.from(notes.save(new AdminStoreReviewNote(storeId, actor.userId(), request.content())));
    }
    @Transactional
    public AdminStoreNoteResponse updateAdminNote(Long noteId, CurrentUser actor, AdminStoreNoteRequest request) {
        requireAdmin(actor);
        AdminStoreReviewNote note = notes.findById(noteId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "관리자 메모를 찾을 수 없습니다."));
        note.updateContent(request.content(), Instant.now());
        return AdminStoreNoteResponse.from(note);
    }
    @Transactional
    public void deleteAdminNote(Long noteId, CurrentUser actor) {
        requireAdmin(actor);
        AdminStoreReviewNote note = notes.findById(noteId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "관리자 메모를 찾을 수 없습니다."));
        notes.delete(note);
    }
    @Transactional
    public void clearReply(Long reviewId, CurrentUser actor) {
        requireAdmin(actor);
        StoreReview review = reviews.findById(reviewId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Review not found"));
        review.clearReply();
    }
    @Transactional
    public void delete(Long reviewId, CurrentUser actor) {
        requireAdmin(actor);
        StoreReview review = reviews.findById(reviewId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Review not found"));
        Store store = requireStore(review.getStoreId());
        if (review.getVisibility() == StoreReview.ReviewVisibility.PUBLISHED) store.adjustTrustScore(-review.getTrustDelta());
        reviews.delete(review);
        refreshRating(store);
    }
    @Transactional
    public ReviewResponse moderate(Long reviewId, CurrentUser actor, ModerationRequest request) {
        requireAdmin(actor);
        StoreReview review = reviews.findById(reviewId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "후기를 찾을 수 없습니다."));
        Store store = requireStore(review.getStoreId());
        if (review.getVisibility() == StoreReview.ReviewVisibility.PUBLISHED && !request.visible()) store.adjustTrustScore(-review.getTrustDelta());
        if (review.getVisibility() == StoreReview.ReviewVisibility.HIDDEN && request.visible()) store.adjustTrustScore(review.getTrustDelta());
        review.moderate(request.visible(), request.reason(), actor.userId(), Instant.now());
        refreshRating(store);
        return ReviewResponse.from(review, consumerName(review.getConsumerId()));
    }

    private void refreshRating(Store store) {
        List<StoreReview> published = reviews.findByStoreIdAndVisibilityOrderByCreatedAtDesc(store.getId(), StoreReview.ReviewVisibility.PUBLISHED);
        store.changeRating(average(published));
    }

    private double average(List<StoreReview> values) {
        return values.isEmpty() ? 0 : Math.round(values.stream().mapToInt(StoreReview::getRating).average().orElse(0) * 10.0) / 10.0;
    }

    private List<ReviewResponse> toResponses(List<StoreReview> values) {
        Map<Long, String> names = users.findAllById(values.stream().map(StoreReview::getConsumerId).toList()).stream()
                .collect(Collectors.toMap(User::getId, User::getName));
        return values.stream().map(review -> ReviewResponse.from(review, names.getOrDefault(review.getConsumerId(), "구매자"))).toList();
    }

    private String consumerName(Long userId) { return users.findById(userId).map(User::getName).orElse("구매자"); }
    private Store requireStore(Long id) { return stores.findById(id).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매점을 찾을 수 없습니다.")); }
    private Store requireSellerStore(CurrentUser actor) {
        if (!actor.isSeller()) throw new DomainException(ErrorCode.FORBIDDEN, "Seller role required");
        return stores.findByOwnerId(actor.userId()).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Seller store not found"));
    }
    private void requireAdmin(CurrentUser actor) { if (!actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다."); }
    private double trustDelta(int rating) { return switch (rating) { case 5 -> 1.0; case 4 -> 0.5; case 3 -> 0.0; case 2 -> -0.5; default -> -1.0; }; }
}
