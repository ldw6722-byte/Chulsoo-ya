package com.chulsooya.server.domain.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class EventAssetTest {
    @Test
    @DisplayName("행사 자산은 테마 또는 아이콘으로 생성되고 수정·비활성화할 수 있다")
    void createsUpdatesAndDeactivatesAsset() {
        EventAsset asset = new EventAsset(EventAssetType.THEME, "가을 목공", "event-assets/themes/autumn-wood.jpg",
                "https://example.supabase.co/storage/v1/object/public/event-assets/themes/autumn-wood.jpg", "ADMIN_UPLOAD", 4);

        assertThat(asset.isTheme()).isTrue();
        assertThat(asset.isIcon()).isFalse();
        assertThat(asset.isActive()).isTrue();
        assertThat(asset.getPublicUrl()).contains("event-assets/themes/");

        asset.update("가을 목공 배너", 2, false);

        assertThat(asset.getName()).isEqualTo("가을 목공 배너");
        assertThat(asset.getSortOrder()).isEqualTo(2);
        assertThat(asset.isActive()).isFalse();
    }
}
