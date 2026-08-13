package com.chulsooya.server.domain.sellerapplication;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Arrays;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class SellerCertificateValidatorTest {

    @Test
    void accepts_a_jpeg_with_allowed_size_and_matching_signature() {
        byte[] content = bytes(120_000, (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0);
        MockMultipartFile file = new MockMultipartFile("file", "license.jpg", "image/jpeg", content);

        assertThatCode(() -> new SellerCertificateValidator().validate(file)).doesNotThrowAnyException();
    }

    @Test
    void rejects_a_declared_pdf_when_its_content_is_not_pdf() {
        byte[] content = bytes(120_000, (byte) 0x4D, (byte) 0x5A, (byte) 0x90, (byte) 0x00);
        MockMultipartFile file = new MockMultipartFile("file", "license.pdf", "application/pdf", content);

        assertThatThrownBy(() -> new SellerCertificateValidator().validate(file))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejects_files_outside_the_permitted_size_range() {
        MockMultipartFile file = new MockMultipartFile("file", "license.jpg", "image/jpeg",
                bytes(99_999, (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0));

        assertThatThrownBy(() -> new SellerCertificateValidator().validate(file))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private byte[] bytes(int size, byte... header) {
        byte[] content = new byte[size];
        Arrays.fill(content, (byte) 0x1A);
        System.arraycopy(header, 0, content, 0, header.length);
        return content;
    }
}
