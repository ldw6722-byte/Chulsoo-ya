package com.chulsooya.server.domain.sellerdeactivation;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;

@Service
public class SellerDeactivationService {
    private final UserRepository users;
    private final StoreRepository stores;
    private final SellerDeactivationRequestRepository requests;
    public SellerDeactivationService(UserRepository users, StoreRepository stores, SellerDeactivationRequestRepository requests) { this.users = users; this.stores = stores; this.requests = requests; }

    @Transactional
    public SellerDeactivationRequest request(Long sellerId, String reason) {
        User seller = users.findById(sellerId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));
        if (seller.getRole() != UserRole.SELLER) throw new DomainException(ErrorCode.VALIDATION_FAILED, "활성 판매자만 등록 해지를 신청할 수 있습니다.");
        if (requests.existsBySellerIdAndStatus(sellerId, SellerDeactivationStatus.PENDING)) throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 검토 중인 판매자 등록 해지 신청이 있습니다.");
        Store store = stores.findByOwnerId(sellerId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "연결된 판매점을 찾을 수 없습니다."));
        if (store.getReservedSlots() > 0 || store.getActiveSlots() > 0) throw new DomainException(ErrorCode.VALIDATION_FAILED, "진행 중인 매칭 또는 주문을 완료한 뒤 등록 해지를 신청할 수 있습니다.");
        return requests.save(new SellerDeactivationRequest(seller, reason));
    }

    @Transactional
    public SellerDeactivationRequest approve(Long requestId, Long reviewerId) {
        SellerDeactivationRequest request = requests.findById(requestId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매자 등록 해지 신청을 찾을 수 없습니다."));
        if (request.getStatus() != SellerDeactivationStatus.PENDING) throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 처리된 판매자 등록 해지 신청입니다.");
        User seller = request.getSeller();
        Store store = stores.findByOwnerId(seller.getId()).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "연결된 판매점을 찾을 수 없습니다."));
        if (store.getReservedSlots() > 0 || store.getActiveSlots() > 0) throw new DomainException(ErrorCode.VALIDATION_FAILED, "진행 중인 매칭 또는 주문이 있어 일반 회원으로 전환할 수 없습니다.");
        seller.changeRole(UserRole.CONSUMER);
        store.changeOperatingStatus(false, false);
        users.save(seller);
        stores.save(store);
        request.approve(reviewerId);
        return request;
    }

    @Transactional
    public SellerDeactivationRequest reject(Long requestId, Long reviewerId, String reason) {
        SellerDeactivationRequest request = requests.findById(requestId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매자 등록 해지 신청을 찾을 수 없습니다."));
        if (request.getStatus() != SellerDeactivationStatus.PENDING) throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 처리된 판매자 등록 해지 신청입니다.");
        request.reject(reviewerId, reason);
        return request;
    }
    @Transactional(readOnly = true) public Optional<SellerDeactivationRequest> mine(Long sellerId) { return requests.findFirstBySellerIdOrderByRequestedAtDesc(sellerId); }
    @Transactional(readOnly = true) public List<SellerDeactivationRequest> pending() { return requests.findByStatusOrderByRequestedAtAsc(SellerDeactivationStatus.PENDING); }
}
