package com.chulsooya.server.domain.store;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.util.Set;
import org.junit.jupiter.api.Test;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRole;

class StoreOperatingStatusTest {

    private Store store() {
        Store store = new Store(new User("seller@example.com", "판매자", "010-0000-0000", UserRole.SELLER),
                "테스트 철물점", "GU_TEST", "서울특별시 강남구", "02-0000-0000", SubscriptionTier.SILVER);
        store.changeBusinessOperations("지하철 2번 출구에서 200m", LocalTime.of(10, 0), LocalTime.of(22, 0),
                Set.of(DayOfWeek.SUNDAY), false);
        return store;
    }

    @Test
    void serverTimeCalculatesPreparingOpenClosedAndHolidayWithoutChangingOrderReceiving() {
        Store store = store();

        assertEquals(StoreOperatingStatus.PREPARING, store.operatingStatus(Instant.parse("2026-08-21T00:30:00Z")));
        assertEquals(StoreOperatingStatus.OPEN, store.operatingStatus(Instant.parse("2026-08-21T02:00:00Z")));
        assertEquals(StoreOperatingStatus.CLOSED, store.operatingStatus(Instant.parse("2026-08-21T14:00:00Z")));
        assertEquals(StoreOperatingStatus.HOLIDAY, store.operatingStatus(Instant.parse("2026-08-23T02:00:00Z")));
        assertEquals(true, store.isReceivingOrders());
    }

    @Test
    void temporaryClosureTakesPrecedenceOverBusinessHours() {
        Store store = store();
        store.changeBusinessOperations("안내", LocalTime.of(10, 0), LocalTime.of(22, 0), Set.of(), true);

        assertEquals(StoreOperatingStatus.HOLIDAY, store.operatingStatus(Instant.parse("2026-08-21T02:00:00Z")));
    }
}
