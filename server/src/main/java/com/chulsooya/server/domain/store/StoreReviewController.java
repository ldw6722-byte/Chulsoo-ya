package com.chulsooya.server.domain.store;

import java.util.List;

import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.store.StoreReviewDtos.CreateReviewRequest;
import com.chulsooya.server.domain.store.StoreReviewDtos.ModerationRequest;
import com.chulsooya.server.domain.store.StoreReviewDtos.UpdateReviewRequest;
import com.chulsooya.server.domain.store.StoreReviewDtos.AdminStoreNoteRequest;
import com.chulsooya.server.domain.store.StoreReviewDtos.AdminStoreNoteResponse;
import com.chulsooya.server.domain.store.StoreReviewDtos.ReviewResponse;
import com.chulsooya.server.domain.store.StoreReviewDtos.ReplyRequest;
import com.chulsooya.server.domain.store.StoreReviewDtos.StoreDetailResponse;
import com.chulsooya.server.support.CurrentUser;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class StoreReviewController {
    private final StoreReviewService reviews;

    public StoreReviewController(StoreReviewService reviews) { this.reviews = reviews; }

    @GetMapping("/stores/{storeId}")
    public ApiResponse<StoreDetailResponse> detail(@PathVariable Long storeId, @Nullable CurrentUser actor) {
        return ApiResponse.of(reviews.detail(storeId, actor));
    }

    @PostMapping("/stores/{storeId}/reviews")
    public ApiResponse<ReviewResponse> create(@PathVariable Long storeId, CurrentUser actor, @Valid @RequestBody CreateReviewRequest request) {
        return ApiResponse.of(reviews.create(storeId, actor, request));
    }

    @GetMapping("/admin/store-reviews")
    public ApiResponse<List<ReviewResponse>> adminList(CurrentUser actor) { return ApiResponse.of(reviews.adminList(actor)); }
    @GetMapping("/admin/stores/{storeId}/reviews")
    public ApiResponse<List<ReviewResponse>> adminListForStore(@PathVariable Long storeId, CurrentUser actor) { return ApiResponse.of(reviews.adminListForStore(storeId, actor)); }

    @PatchMapping("/admin/store-reviews/{reviewId}")
    public ApiResponse<ReviewResponse> updateReview(@PathVariable Long reviewId, CurrentUser actor, @Valid @RequestBody UpdateReviewRequest request) {
        return ApiResponse.of(reviews.updateComment(reviewId, actor, request));
    }
    @GetMapping("/admin/stores/{storeId}/review-notes")
    public ApiResponse<List<AdminStoreNoteResponse>> adminNotes(@PathVariable Long storeId, CurrentUser actor) {
        return ApiResponse.of(reviews.adminNotesForStore(storeId, actor));
    }
    @PostMapping("/admin/stores/{storeId}/review-notes")
    public ApiResponse<AdminStoreNoteResponse> createAdminNote(@PathVariable Long storeId, CurrentUser actor, @Valid @RequestBody AdminStoreNoteRequest request) {
        return ApiResponse.of(reviews.createAdminNote(storeId, actor, request));
    }
    @PatchMapping("/admin/store-review-notes/{noteId}")
    public ApiResponse<AdminStoreNoteResponse> updateAdminNote(@PathVariable Long noteId, CurrentUser actor, @Valid @RequestBody AdminStoreNoteRequest request) {
        return ApiResponse.of(reviews.updateAdminNote(noteId, actor, request));
    }
    @DeleteMapping("/admin/store-review-notes/{noteId}")
    public ApiResponse<Void> deleteAdminNote(@PathVariable Long noteId, CurrentUser actor) {
        reviews.deleteAdminNote(noteId, actor);
        return ApiResponse.of(null);
    }
    @PostMapping("/admin/store-reviews/{reviewId}/reply")
    public ApiResponse<ReviewResponse> adminReply(@PathVariable Long reviewId, CurrentUser actor, @Valid @RequestBody ReplyRequest request) { return ApiResponse.of(reviews.reply(reviewId, actor, request, false)); }
    @DeleteMapping("/admin/store-reviews/{reviewId}/reply")
    public ApiResponse<Void> clearReply(@PathVariable Long reviewId, CurrentUser actor) { reviews.clearReply(reviewId, actor); return ApiResponse.of(null); }
    @DeleteMapping("/admin/store-reviews/{reviewId}")
    public ApiResponse<Void> delete(@PathVariable Long reviewId, CurrentUser actor) { reviews.delete(reviewId, actor); return ApiResponse.of(null); }
    @GetMapping("/seller/reviews")
    public ApiResponse<List<ReviewResponse>> sellerList(CurrentUser actor) { return ApiResponse.of(reviews.sellerList(actor)); }
    @PostMapping("/seller/store-reviews/{reviewId}/reply")
    public ApiResponse<ReviewResponse> sellerReply(@PathVariable Long reviewId, CurrentUser actor, @Valid @RequestBody ReplyRequest request) { return ApiResponse.of(reviews.reply(reviewId, actor, request, true)); }
    @PostMapping("/admin/store-reviews/{reviewId}/moderation")
    public ApiResponse<ReviewResponse> moderate(@PathVariable Long reviewId, CurrentUser actor, @Valid @RequestBody ModerationRequest request) {
        return ApiResponse.of(reviews.moderate(reviewId, actor, request));
    }
}
