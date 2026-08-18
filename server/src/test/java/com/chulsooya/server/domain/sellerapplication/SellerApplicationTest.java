package com.chulsooya.server.domain.sellerapplication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;

import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRole;

class SellerApplicationTest {

    @Test
    void pending_application_can_be_approved_only_once() {
        User applicant = new User("seller@example.com", "신청자", "010-1234-5678", UserRole.CONSUMER);
        SellerApplication application = new SellerApplication(
                applicant,
                "철수 철물",
                "김철수",
                "123-45-67890",
                "서울특별시",
                "강남구",
                "GU_GANGNAM",
                "서울특별시 강남구 테헤란로 1",
                "010-1234-5678",
                "철물,공구");
        Instant reviewedAt = Instant.parse("2026-08-13T00:00:00Z");

        application.approve(99L, reviewedAt);

        assertThat(application.getStatus()).isEqualTo(SellerApplicationStatus.APPROVED);
        assertThat(application.getReviewedByUserId()).isEqualTo(99L);
        assertThat(application.getReviewedAt()).isEqualTo(reviewedAt);
        assertThatThrownBy(() -> application.approve(100L, reviewedAt.plusSeconds(1)))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void rejection_requires_a_reason_and_closes_the_application() {
        User applicant = new User("seller@example.com", "신청자", "010-1234-5678", UserRole.CONSUMER);
        SellerApplication application = new SellerApplication(
                applicant,
                "철수 철물",
                "김철수",
                "123-45-67890",
                "서울특별시",
                "강남구",
                "GU_GANGNAM",
                "서울특별시 강남구 테헤란로 1",
                "010-1234-5678",
                "철물,공구");

        assertThatThrownBy(() -> application.reject(99L, " ", Instant.now()))
                .isInstanceOf(IllegalArgumentException.class);

        application.reject(99L, "사업자등록증 재제출이 필요합니다.", Instant.parse("2026-08-13T00:00:00Z"));

        assertThat(application.getStatus()).isEqualTo(SellerApplicationStatus.REJECTED);
        assertThat(application.getRejectionReason()).isEqualTo("사업자등록증 재제출이 필요합니다.");
    }
    @Test
    void admin_response_includes_all_submitted_business_and_applicant_contact_information() {
        User applicant = new User("seller@example.com", "신청자", "010-1234-5678", UserRole.CONSUMER);
        SellerApplication application = new SellerApplication(
                applicant, "철수 철물", "김철수", "123-45-67890", "서울특별시", "강남구", "GU_GANGNAM",
                "서울특별시 강남구 테헤란로 1", "010-9999-8888", "철물,공구");
        application.setBusinessOpenedOn(LocalDate.of(2020, 2, 3));

        SellerApplicationDtos.AdminResponse response = SellerApplicationDtos.AdminResponse.from(application);

        assertThat(response.applicantPhone()).isEqualTo("010-1234-5678");
        assertThat(response.businessOpenedOn()).isEqualTo(LocalDate.of(2020, 2, 3));
        assertThat(response.address()).isEqualTo("서울특별시 강남구 테헤란로 1");
        assertThat(response.phone()).isEqualTo("010-9999-8888");
        assertThat(response.handledItems()).containsExactly("철물", "공구");
    }

}
