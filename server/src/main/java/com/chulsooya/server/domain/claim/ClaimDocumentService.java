package com.chulsooya.server.domain.claim;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderRepository;

/** 법정·분쟁 문구를 AI로 생성하지 않고 확정 DB 값만 템플릿에 주입한다. */
@Service
@Transactional(readOnly = true)
public class ClaimDocumentService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'")
            .withZone(ZoneOffset.UTC);

    private final ClaimRepository claims;
    private final SettlementRepository settlements;
    private final OrderRepository orders;

    public ClaimDocumentService(ClaimRepository claims, SettlementRepository settlements, OrderRepository orders) {
        this.claims = claims;
        this.settlements = settlements;
        this.orders = orders;
    }

    public ClaimDecisionDocument render(Long claimId) {
        Claim claim = claims.findById(claimId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "클레임을 찾을 수 없습니다."));
        Settlement settlement = settlements.findByOrderId(claim.getOrderId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "정산 정보를 찾을 수 없습니다."));
        Order order = orders.findById(claim.getOrderId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));
        String body = """
                철수야 클레임 처리 확인서
                문서 번호: CLAIM-%s
                주문 번호: %s
                요청 유형: %s
                요청 사유 코드: %s
                클레임 상태: %s
                접수 시각: %s
                종결 시각: %s
                주문 금액: %d원
                정산 상태: %s
                정산 보류 사유: %s

                본 문서는 철수야 시스템에 확정 저장된 주문·클레임·정산 정보를 기준으로 생성되었습니다.
                """.formatted(claim.getId(), order.getId(), claim.getClaimType(), claim.getReasonCode(),
                claim.getStatus(), DATE.format(claim.getCreatedAt()),
                claim.getResolvedAt() == null ? "미종결" : DATE.format(claim.getResolvedAt()),
                order.getTotalAmount(), settlement.getStatus(),
                settlement.getHoldReason() == null ? "해당 없음" : settlement.getHoldReason());
        return new ClaimDecisionDocument("CLAIM-" + claim.getId(), body);
    }

    public record ClaimDecisionDocument(String documentNumber, String content) {}
}
