package com.chulsooya.server.domain.claim;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class ClaimEvidenceService {

    private final ClaimRepository claims;
    private final ClaimEvidenceRepository evidences;
    private final ClaimEventRepository events;
    private final ClaimEvidenceStorage storage;
    private final StoreRepository stores;
    private final Clock clock;
    private final ClaimEvidenceValidator validator = new ClaimEvidenceValidator();

    public ClaimEvidenceService(ClaimRepository claims, ClaimEvidenceRepository evidences,
            ClaimEventRepository events, ClaimEvidenceStorage storage, StoreRepository stores, Clock clock) {
        this.claims = claims;
        this.evidences = evidences;
        this.events = events;
        this.storage = storage;
        this.stores = stores;
        this.clock = clock;
    }

    @Transactional
    public ClaimEvidence upload(Long claimId, CurrentUser actor, MultipartFile file) {
        Claim claim = claims.findByIdForUpdate(claimId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "클레임을 찾을 수 없습니다."));
        if (!isAuthorized(claim, actor)) throw new DomainException(ErrorCode.FORBIDDEN);
        validator.validate(file);
        Instant now = clock.instant();
        String objectKey = storage.upload(claimId, file);
        ClaimEvidence evidence = evidences.save(new ClaimEvidence(claimId, objectKey, file.getContentType(),
                file.getSize(), now));
        events.save(new ClaimEvent(claimId, "EVIDENCE_UPLOADED", actor.userId(), actor.role(),
                "클레임 증빙 자료가 추가되었습니다.", now));
        return evidence;
    }

    private boolean isAuthorized(Claim claim, CurrentUser actor) {
        return actor.isAdmin() || claim.getConsumerId().equals(actor.userId()) ||
                (actor.role() == UserRole.SELLER && stores.findByOwnerId(actor.userId())
                        .map(store -> store.getId().equals(claim.getStoreId())).orElse(false));
    }
}
