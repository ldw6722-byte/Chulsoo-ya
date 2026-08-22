package com.chulsooya.server.domain.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class SupportInquiryTest {
    @Test
    void inquiryMovesInOneDirectionFromOpenToProcessingToAnsweredToClosed() {
        SupportInquiry inquiry = new SupportInquiry(1L, "ONE_TO_ONE", "배송 문의", "언제 받을 수 있나요?");

        inquiry.startProcessing();
        inquiry.answer(2L, "판매점 확인 후 안내드리겠습니다.");
        inquiry.complete();

        assertThat(inquiry.getStatus()).isEqualTo(SupportInquiryStatus.CLOSED);
        assertThat(inquiry.getAdminReply()).isEqualTo("판매점 확인 후 안내드리겠습니다.");
        assertThat(inquiry.getReplyAdminId()).isEqualTo(2L);
        assertThat(inquiry.getAnsweredAt()).isNotNull();
    }

    @Test
    void inquiryCannotBeCompletedBeforeAnAdministratorReply() {
        SupportInquiry inquiry = new SupportInquiry(1L, "ONE_TO_ONE", "배송 문의", "언제 받을 수 있나요?");
        inquiry.startProcessing();

        assertThatThrownBy(inquiry::complete)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("답변");
    }

    @Test
    void closedInquiryCannotBeRestartedOrEdited() {
        SupportInquiry inquiry = new SupportInquiry(1L, "ONE_TO_ONE", "배송 문의", "언제 받을 수 있나요?");
        inquiry.startProcessing();
        inquiry.answer(2L, "판매점 확인 후 안내드리겠습니다.");
        inquiry.complete();

        assertThatThrownBy(inquiry::startProcessing)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("완료");
        assertThatThrownBy(() -> inquiry.answer(2L, "다시 답변합니다."))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("완료");
    }
}
