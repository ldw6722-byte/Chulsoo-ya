package com.chulsooya.server.domain.store;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class StoreReviewAdminMutationTest {
    @Test
    void admin_can_correct_review_comment_without_changing_the_original_rating() {
        StoreReview review = new StoreReview(10L, 20L, 30L, 4, "기존 후기", 0.5);

        review.updateComment("관리자 검토 후 수정된 후기");

        assertThat(review.getComment()).isEqualTo("관리자 검토 후 수정된 후기");
        assertThat(review.getRating()).isEqualTo(4);
    }
}
