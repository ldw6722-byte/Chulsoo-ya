package com.chulsooya.server.domain.sellerapplication;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.Set;
import javax.imageio.ImageIO;
import org.springframework.web.multipart.MultipartFile;
/** 비공개 판매자 증빙은 실제 JPEG/PNG 디코딩·용량·치수를 모두 검증한다. */
public class SellerCertificateValidator {
    public static final long MIN_SIZE_BYTES = 100 * 1024L;
    public static final long MAX_SIZE_BYTES = 5 * 1024 * 1024L;
    public static final int MIN_EDGE_PIXELS = 800;
    public static final int MAX_EDGE_PIXELS = 6000;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png");
    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("첨부할 이미지를 선택해 주세요.");
        if (!ALLOWED_TYPES.contains(file.getContentType())) throw new IllegalArgumentException("JPG 또는 PNG 이미지만 업로드할 수 있습니다.");
        if (file.getSize() < MIN_SIZE_BYTES || file.getSize() > MAX_SIZE_BYTES) throw new IllegalArgumentException("파일 용량은 100KB 이상 5MB 이하만 가능합니다.");
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(8);
            if (!hasValidSignature(file.getContentType(), header)) throw new IllegalArgumentException("파일 형식이 올바르지 않습니다.");
        } catch (IOException exception) { throw new IllegalArgumentException("업로드 파일을 읽을 수 없습니다.", exception); }
        try (InputStream input = file.getInputStream()) {
            BufferedImage image = ImageIO.read(input);
            if (image == null) throw new IllegalArgumentException("이미지를 해석할 수 없습니다.");
            int shorter = Math.min(image.getWidth(), image.getHeight());
            int longer = Math.max(image.getWidth(), image.getHeight());
            if (shorter < MIN_EDGE_PIXELS || longer > MAX_EDGE_PIXELS) throw new IllegalArgumentException("이미지 해상도는 짧은 변 800px 이상, 긴 변 6000px 이하여야 합니다.");
        } catch (IOException exception) { throw new IllegalArgumentException("이미지 해상도를 확인할 수 없습니다.", exception); }
    }
    private boolean hasValidSignature(String type, byte[] header) { return switch (type) {
        case "image/jpeg" -> startsWith(header, 0xFF, 0xD8, 0xFF);
        case "image/png" -> startsWith(header, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
        default -> false;
    }; }
    private boolean startsWith(byte[] content, int... expected) { if (content.length < expected.length) return false; for (int i=0;i<expected.length;i++) if (Byte.toUnsignedInt(content[i]) != expected[i]) return false; return true; }
}
