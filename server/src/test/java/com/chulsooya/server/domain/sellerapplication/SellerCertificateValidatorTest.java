package com.chulsooya.server.domain.sellerapplication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Arrays;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class SellerCertificateValidatorTest {

    @Test
    void accepts_a_jpeg_with_allowed_size_and_matching_signature() throws Exception {
        byte[] content = imageBytes(1200, 900);
        MockMultipartFile file = new MockMultipartFile("file", "license.png", "image/png", content);

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

    @Test
    void permits_documents_up_to_ten_megabytes_and_rejects_larger_files() {
        long max = 10L * 1024 * 1024;
        assertThat(SellerCertificateValidator.MAX_SIZE_BYTES).isEqualTo(max);
        MockMultipartFile oversized = new MockMultipartFile("file", "license.jpg", "image/jpeg",
                bytes((int) max + 1, (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0));

        assertThatThrownBy(() -> new SellerCertificateValidator().validate(oversized))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("10MB");
    }

    private byte[] imageBytes(int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) image.setRGB(x, y, ((x * 31 + y * 17) & 0xFF) << 16 | ((x * 13 + y * 29) & 0xFF) << 8 | ((x * 7 + y * 11) & 0xFF));
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        byte[] encoded = output.toByteArray();
        if (encoded.length < 100_000) throw new IllegalStateException("테스트 이미지가 최소 용량에 미달합니다.");
        return encoded;
    }
    private byte[] bytes(int size, byte... header) {
        byte[] content = new byte[size];
        Arrays.fill(content, (byte) 0x1A);
        System.arraycopy(header, 0, content, 0, header.length);
        return content;
    }
}
