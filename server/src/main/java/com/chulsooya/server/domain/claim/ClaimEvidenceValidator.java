package com.chulsooya.server.domain.claim;

import java.io.IOException;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

/** 브라우저 MIME만 신뢰하지 않고 헤더 시그니처와 크기를 함께 검사한다. */
public class ClaimEvidenceValidator {

    private static final Map<String, Long> MAX_BYTES = Map.of(
            "image/jpeg", 10L * 1024 * 1024,
            "image/png", 10L * 1024 * 1024,
            "image/webp", 10L * 1024 * 1024,
            "video/mp4", 30L * 1024 * 1024);

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getContentType() == null) invalid();
        String contentType = file.getContentType().toLowerCase();
        Long maxBytes = MAX_BYTES.get(contentType);
        if (maxBytes == null || file.getSize() > maxBytes) invalid();
        try {
            if (!hasExpectedSignature(contentType, file.getBytes())) invalid();
        } catch (IOException exception) {
            invalid();
        }
    }

    private boolean hasExpectedSignature(String contentType, byte[] bytes) {
        if (bytes.length < 4) return false;
        return switch (contentType) {
            case "image/jpeg" -> (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
            case "image/png" -> (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47;
            case "image/webp" -> bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                    && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
            case "video/mp4" -> bytes.length >= 8 && bytes[4] == 'f' && bytes[5] == 't' && bytes[6] == 'y' && bytes[7] == 'p';
            default -> false;
        };
    }

    private void invalid() {
        throw new DomainException(ErrorCode.INVALID_EVIDENCE_FILE);
    }
}
