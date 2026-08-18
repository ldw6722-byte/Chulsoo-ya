package com.chulsooya.server.domain.sellerapplication;
public enum SellerApplicationDocumentType {
    BUSINESS_LICENSE("business-license", "사업자등록증"),
    BANK_ACCOUNT_COPY("bank-account-copy", "통장사본");
    private final String pathSegment;
    private final String label;
    SellerApplicationDocumentType(String pathSegment, String label) { this.pathSegment = pathSegment; this.label = label; }
    public String pathSegment() { return pathSegment; }
    public String label() { return label; }
}
