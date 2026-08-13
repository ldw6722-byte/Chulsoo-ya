package com.chulsooya.server.domain.store;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.store.StoreReviewDtos.CreateReviewRequest;
import com.chulsooya.server.domain.store.StoreReviewDtos.ModerationRequest;
import com.chulsooya.server.domain.store.StoreReviewDtos.ReviewResponse;
import com.chulsooya.server.domain.store.StoreReviewDtos.StoreDetailResponse;
import com.chulsooya.server.support.CurrentUser;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class StoreReviewController {
    private final StoreReviewService reviews;

    public StoreReviewController(StoreReviewService reviews) { this.reviews = reviews; }

    @GetMapping("/stores/{storeId}")
    public ApiResponse<StoreDetailResponse> detail(@PathVariable Long storeId, CurrentUser actor) {
        return ApiResponse.of(reviews.detail(storeId, actor));
    }

    @PostMapping("/stores/{storeId}/reviews")
    public ApiResponse<ReviewResponse> create(@PathVariable Long storeId, CurrentUser actor, @Valid @RequestBody CreateReviewRequest request) {
        return ApiResponse.of(reviews.create(storeId, actor, request));
    }

    @GetMapping("/admin/store-reviews")
    public ApiResponse<List<ReviewResponse>> adminList(CurrentUser actor) { return ApiResponse.of(reviews.adminList(actor)); }

    @PostMapping("/admin/store-reviews/{reviewId}/moderation")
    public ApiResponse<ReviewResponse> moderate(@PathVariable Long reviewId, CurrentUser actor, @Valid @RequestBody ModerationRequest request) {
        return ApiResponse.of(reviews.moderate(reviewId, actor, request));
    }
}
