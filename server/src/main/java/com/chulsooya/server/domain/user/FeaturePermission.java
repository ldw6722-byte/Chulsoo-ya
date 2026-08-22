package com.chulsooya.server.domain.user;

public enum FeaturePermission {
    CONSUMER_PURCHASE(PermissionGroup.CONSUMER, "주문·결제"),
    CONSUMER_REVIEW(PermissionGroup.CONSUMER, "거래 후기"),
    CONSUMER_SUPPORT(PermissionGroup.CONSUMER, "고객 문의"),
    CONSUMER_SELLER_APPLICATION(PermissionGroup.CONSUMER, "판매자 신청"),
    SELLER_STORE_OPERATIONS(PermissionGroup.SELLER, "판매점 운영 설정"),
    SELLER_CATALOG(PermissionGroup.SELLER, "상품 관리"),
    SELLER_BID_AND_FULFILLMENT(PermissionGroup.SELLER, "응찰·이행"),
    SELLER_SUBSCRIPTION(PermissionGroup.SELLER, "구독 관리"),
    SELLER_CLAIM_RESPONSE(PermissionGroup.SELLER, "클레임 처리"),
    ADMIN_MANAGE_CONSUMERS(PermissionGroup.ADMIN, "일반사용자 관리"),
    ADMIN_MANAGE_SELLERS(PermissionGroup.ADMIN, "판매자 관리"),
    ADMIN_MANAGE_STORES(PermissionGroup.ADMIN, "판매점 관리"),
    ADMIN_REVIEW_SELLER_APPLICATIONS(PermissionGroup.ADMIN, "판매자 신청 심사"),
    ADMIN_MANAGE_CATALOG(PermissionGroup.ADMIN, "상품·카테고리 관리"),
    ADMIN_MANAGE_EVENTS_AND_COUPONS(PermissionGroup.ADMIN, "행사·쿠폰 관리"),
    ADMIN_MANAGE_SUBSCRIPTIONS(PermissionGroup.ADMIN, "구독상품 관리"),
    ADMIN_VIEW_MATCHING(PermissionGroup.ADMIN, "주문 응찰 모니터링"),
    ADMIN_MANAGE_SETTLEMENTS(PermissionGroup.ADMIN, "정산·환불 관리"),
    ADMIN_MANAGE_SUPPORT(PermissionGroup.ADMIN, "고객 문의 관리"),
    ADMIN_MANAGE_CUSTOMER_NOTICES(PermissionGroup.ADMIN, "고객센터 공지 관리"),
    ADMIN_APPROVE_DEVELOPMENT_PAYMENTS(PermissionGroup.ADMIN, "개발 결제 승인");

    private final PermissionGroup group;
    private final String label;

    FeaturePermission(PermissionGroup group, String label) {
        this.group = group;
        this.label = label;
    }

    public PermissionGroup getGroup() { return group; }
    public String getLabel() { return label; }

    public enum PermissionGroup { CONSUMER, SELLER, ADMIN }
}
