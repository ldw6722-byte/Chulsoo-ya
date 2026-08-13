package com.chulsooya.server.domain.claim;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.chulsooya.server.common.DomainException;

class ClaimEvidenceValidatorTest {

    private final ClaimEvidenceValidator validator = new ClaimEvidenceValidator();

    @Test
    void accepts_jpeg_with_matching_file_signature() {
        MockMultipartFile file = new MockMultipartFile("file", "defect.jpg", "image/jpeg",
                new byte[] {(byte) 0xff, (byte) 0xd8, (byte) 0xff, 0x00, 0x01});

        assertThatCode(() -> validator.validate(file)).doesNotThrowAnyException();
    }

    @Test
    void rejects_spoofed_image_content_type() {
        MockMultipartFile file = new MockMultipartFile("file", "malware.png", "image/png",
                "not-an-image".getBytes());

        assertThatThrownBy(() -> validator.validate(file)).isInstanceOf(DomainException.class);
    }
}
