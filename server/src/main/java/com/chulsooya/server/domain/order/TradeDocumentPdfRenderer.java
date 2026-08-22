package com.chulsooya.server.domain.order;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.user.User;

/**
 * AI·Storage 없이 주문 DB 스냅샷을 고정 템플릿에 주입하는 거래 서류 PDF 생성기.
 * ponytail: 서류 파일 보관·문서 이력 테이블은 사용하지 않는다. upgrade path: 전자세금계산서 연동 시 별도 발행 이력 도입.
 */
@Component
public class TradeDocumentPdfRenderer {
    private static final ZoneId KOREA = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm").withZone(KOREA);
    private static final DateTimeFormatter DATE_ONLY = DateTimeFormatter.ofPattern("yyyy.MM.dd").withZone(KOREA);
    private static final Locale KOREAN = Locale.KOREA;

    public byte[] render(TradeDocumentData data) {
        try (PDDocument document = new PDDocument(); InputStream fontStream = new ClassPathResource("fonts/NotoSansKR-Regular.ttf").getInputStream()) {
            PDType0Font font = PDType0Font.load(document, fontStream, true);
            PdfWriter writer = new PdfWriter(document, font);
            writer.title(data.type().label());
            writer.line("문서 번호  " + data.type().fileStem().toUpperCase(KOREAN) + "-" + data.order().getId());
            writer.line("생성 시각  " + DATE_TIME.format(data.generatedAt()));
            writer.divider();

            writer.section("거래 기본 정보");
            writer.line("주문 번호  " + data.order().getId());
            writer.line("거래 완료  " + DATE_TIME.format(data.order().getCompletedAt()));
            writer.line("이행 방식  " + (data.order().getFulfillmentMethod() == FulfillmentMethod.DELIVERY ? "배달" : "매장 픽업"));
            writer.line("구매자  " + value(data.buyer().getName()));
            writer.line("판매점  " + value(data.store().getName()));
            writer.line("판매점 연락처  " + value(data.store().getPhone()));
            if (data.type() != TradeDocumentType.RECEIPT) {
                writer.line("거래 주소  " + fullAddress(data.order().getAddress(), data.order().getAddressDetail()));
            }
            writer.divider();

            writer.section("주문 품목");
            writer.line("품목 / 규격 / 수량 / 단가 / 금액");
            for (OrderItem item : data.order().getItems()) {
                writer.line("• " + value(item.getProductName()) + " | " + value(item.getSpecSummary()) + " | "
                        + item.getQuantity() + value(item.getUnit()) + " | " + won(item.getPriceAtOrder()) + " | " + won(item.getLineAmount()));
            }
            writer.divider();

            writer.section("결제 금액");
            writer.line("상품 금액  " + won(data.order().getItemsAmount()));
            writer.line("배달비  " + won(data.order().getDeliveryFee()));
            writer.line("할인 금액  -" + won(data.order().getDiscountAmount()));
            writer.emphasis("최종 결제 금액  " + won(data.order().getTotalAmount()));
            if (data.payment() != null) {
                writer.line("결제 수단  " + value(data.payment().getMethod()));
                writer.line("결제 승인 시각  " + (data.payment().getPaidAt() == null ? "-" : DATE_TIME.format(data.payment().getPaidAt())));
            }

            if (data.type() == TradeDocumentType.RECEIPT) {
                writer.divider();
                writer.line("본 문서는 철수야 주문 DB를 기준으로 생성한 거래 확인용 영수증입니다.");
            } else if (data.type() == TradeDocumentType.ORDER_STATEMENT) {
                writer.divider();
                writer.line("본 문서는 주문 당시 확정된 품목·금액·이행 정보를 표시한 주문 내역서입니다.");
            } else {
                writer.divider();
                writer.line("본 문서는 거래 확인용 거래명세서이며 전자세금계산서가 아닙니다.");
            }

            writer.finish();
            try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                document.save(output);
                return output.toByteArray();
            }
        } catch (IOException exception) {
            throw new DomainException(ErrorCode.INTERNAL_ERROR, "거래 서류 PDF 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }
    }

    private static String won(int amount) {
        return String.format(KOREAN, "%,d원", Math.max(0, amount));
    }

    private static String fullAddress(String address, String detail) {
        String first = value(address);
        return detail == null || detail.isBlank() ? first : first + " " + detail.trim();
    }

    private static String value(String value) {
        return value == null || value.isBlank() ? "-" : value.trim();
    }

    private static final class PdfWriter {
        private final PDDocument document;
        private final PDType0Font font;
        private PDPageContentStream stream;
        private float y;

        private PdfWriter(PDDocument document, PDType0Font font) throws IOException {
            this.document = document;
            this.font = font;
            nextPage();
        }

        private void finish() throws IOException {
            if (stream != null) {
                stream.close();
                stream = null;
            }
        }

        private void nextPage() throws IOException {
            if (stream != null) stream.close();
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            y = page.getMediaBox().getHeight() - 54;
        }

        private void title(String value) throws IOException {
            text(value, 20, 25);
            y -= 12;
        }

        private void section(String value) throws IOException {
            text(value, 13, 18);
        }

        private void emphasis(String value) throws IOException {
            text(value, 11, 16);
        }

        private void line(String value) throws IOException {
            for (String segment : wrap(value, 48)) text(segment, 10, 15);
        }

        private void divider() throws IOException {
            ensureSpace(16);
            stream.setStrokingColor(155f / 255f, 155f / 255f, 155f / 255f);
            stream.moveTo(50, y);
            stream.lineTo(PDRectangle.A4.getWidth() - 50, y);
            stream.stroke();
            y -= 14;
        }

        private void text(String value, float size, float spacing) throws IOException {
            ensureSpace(spacing + 2);
            stream.beginText();
            stream.setFont(font, size);
            stream.newLineAtOffset(50, y);
            stream.showText(value.replace("\n", " "));
            stream.endText();
            y -= spacing;
        }

        private void ensureSpace(float needed) throws IOException {
            if (y < 55 + needed) nextPage();
        }

        private static java.util.List<String> wrap(String source, int maxLength) {
            if (source == null || source.length() <= maxLength) return java.util.List.of(source == null ? "-" : source);
            java.util.List<String> lines = new java.util.ArrayList<>();
            for (int start = 0; start < source.length(); start += maxLength) {
                lines.add(source.substring(start, Math.min(start + maxLength, source.length())));
            }
            return lines;
        }
    }
}

record TradeDocumentData(
        TradeDocumentType type,
        Order order,
        User buyer,
        Store store,
        Payment payment,
        Instant generatedAt) {
}
