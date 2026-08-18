package com.chulsooya.server.domain.admin;

import java.io.IOException;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

final class EventAssetValidator {
    private static final long MAX_BYTES = 8L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp");

    void validate(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getContentType() == null || file.getSize() > MAX_BYTES) invalid();
        String type = file.getContentType().toLowerCase();
        if (!EXTENSIONS.containsKey(type)) invalid();
        try {
            if (!hasExpectedSignature(type, file.getBytes())) invalid();
        } catch (IOException exception) {
            invalid();
        }
    }

    String extension(MultipartFile file) { return EXTENSIONS.get(file.getContentType().toLowerCase()); }

    private boolean hasExpectedSignature(String type, byte[] bytes) {
        if (bytes.length < 4) return false;
        return switch (type) {
            case "image/jpeg" -> (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
            case "image/png" -> (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47;
            case "image/webp" -> bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                    && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
            default -> false;
        };
    }

    private void invalid() { throw new DomainException(ErrorCode.INVALID_EVIDENCE_FILE); }
}
