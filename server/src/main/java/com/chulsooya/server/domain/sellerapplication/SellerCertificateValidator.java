package com.chulsooya.server.domain.sellerapplication;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;

import org.springframework.web.multipart.MultipartFile;

/**
 * 사업자등록증은 비공개 증빙 자료다. Content-Type만 신뢰하지 않고 최소 파일 시그니처도 확인한다.
 */
public class SellerCertificateValidator {

    public static final long MIN_SIZE_BYTES = 100 * 1024L;
    public static final long MAX_SIZE_BYTES = 5 * 1024 * 1024L;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "application/pdf");

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("사업자등록증 파일을 선택해 주세요.");
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("JPG, PNG, PDF 파일만 업로드할 수 있습니다.");
        }
        if (file.getSize() < MIN_SIZE_BYTES || file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("파일 용량은 100KB 이상 5MB 이하만 가능합니다.");
        }
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(8);
            if (!hasValidSignature(file.getContentType(), header)) {
                throw new IllegalArgumentException("파일 형식이 올바르지 않습니다.");
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("업로드 파일을 읽을 수 없습니다.", exception);
        }
    }

    private boolean hasValidSignature(String contentType, byte[] header) {
        return switch (contentType) {
            case "image/jpeg" -> startsWith(header, 0xFF, 0xD8, 0xFF);
            case "image/png" -> startsWith(header, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
            case "application/pdf" -> startsWith(header, 0x25, 0x50, 0x44, 0x46, 0x2D);
            default -> false;
        };
    }

    private boolean startsWith(byte[] content, int... expected) {
        if (content.length < expected.length) return false;
        for (int index = 0; index < expected.length; index++) {
            if (Byte.toUnsignedInt(content[index]) != expected[index]) return false;
        }
        return true;
    }
}
