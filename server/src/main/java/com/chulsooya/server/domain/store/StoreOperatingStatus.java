package com.chulsooya.server.domain.store;

public enum StoreOperatingStatus {
    OPEN("영업중"),
    PREPARING("준비중"),
    CLOSED("영업종료"),
    HOLIDAY("휴무");

    private final String label;

    StoreOperatingStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
