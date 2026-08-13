package com.chulsooya.server.domain.penalty;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.domain.store.Store;

@Service
public class PenaltyService {

    private final PenaltyRepository penalties;

    public PenaltyService(PenaltyRepository penalties) {
        this.penalties = penalties;
    }

    /**
     * DB의 주문별 위반 유형 유니크 제약과 선행 조회로 같은 만료 건을 한 번만 제재한다.
     */
    @Transactional
    public boolean applySellerConfirmationTimeout(Long orderId, Long storeId, Store store, Instant now) {
        if (penalties.existsByOrderIdAndViolationType(orderId, PenaltyViolationType.SELLER_CONFIRMATION_TIMEOUT)) {
            return false;
        }
        Penalty penalty = Penalty.sellerConfirmationTimeout(storeId, orderId, now);
        penalties.save(penalty);
        store.restrictUntil(penalty.getRestrictionUntil());
        store.adjustTrustScore(penalty.getTrustScoreDelta());
        return true;
    }
}
