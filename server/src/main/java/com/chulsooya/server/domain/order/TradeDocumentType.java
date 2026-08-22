package com.chulsooya.server.domain.order;

/** DB 주문 스냅샷으로 즉시 생성하는 거래 확인 문서. 전자세금계산서는 포함하지 않는다. */
public enum TradeDocumentType {
    RECEIPT("영수증", "receipt"),
    ORDER_STATEMENT("주문 내역서", "order-statement"),
    TRANSACTION_STATEMENT("거래명세서", "transaction-statement");

    private final String label;
    private final String fileStem;

    TradeDocumentType(String label, String fileStem) {
        this.label = label;
        this.fileStem = fileStem;
    }

    public String label() {
        return label;
    }

    public String fileStem() {
        return fileStem;
    }
}
