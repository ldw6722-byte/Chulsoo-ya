package com.chulsooya.server.domain.matching;

import com.chulsooya.server.domain.store.SubscriptionTier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 동일 지역·등급 안에서 다음 수신 판매자를 회전시키는 영속 커서. */
@Entity
@Getter
@Table(name = "dispatch_cursors", uniqueConstraints = @UniqueConstraint(columnNames = { "gu_code", "tier" }))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DispatchCursor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gu_code", nullable = false, length = 20)
    private String guCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionTier tier;

    @Column(nullable = false)
    private int nextPosition = 0;

    public DispatchCursor(String guCode, SubscriptionTier tier) {
        this.guCode = guCode;
        this.tier = tier;
    }

    /** 현재 위치를 반환한 뒤 다음 호출을 위해 한 칸 전진한다. */
    public int nextIndex(int candidateCount) {
        if (candidateCount <= 0) throw new IllegalArgumentException("판매자 후보가 없습니다.");
        int current = Math.floorMod(nextPosition, candidateCount);
        nextPosition = Math.floorMod(current + 1, candidateCount);
        return current;
    }
}
