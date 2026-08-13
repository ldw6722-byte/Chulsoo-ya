package com.chulsooya.server.domain.support;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SupportInquiryTest {
    @Test
    void administratorReplyChangesInquiryToAnswered() {
        SupportInquiry inquiry = new SupportInquiry(1L, "ONE_TO_ONE", "배송 문의", "언제 받을 수 있나요?");

        inquiry.answer(2L, "판매점 확인 후 안내드리겠습니다.");

        assertThat(inquiry.getStatus()).isEqualTo(SupportInquiryStatus.ANSWERED);
        assertThat(inquiry.getAdminReply()).isEqualTo("판매점 확인 후 안내드리겠습니다.");
        assertThat(inquiry.getReplyAdminId()).isEqualTo(2L);
        assertThat(inquiry.getAnsweredAt()).isNotNull();
    }
}
