package com.chulsooya.server.domain.subscription;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.AdminChangeRequest;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.AdminMembershipResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.HistoryResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.ProductRequest;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.ProductResponse;

@Service
public class AdminSubscriptionService {
    private final StoreRepository stores; private final SubscriptionProductRepository products; private final StoreSubscriptionHistoryRepository history; private final Clock clock;
    public AdminSubscriptionService(StoreRepository stores, SubscriptionProductRepository products, StoreSubscriptionHistoryRepository history, Clock clock) { this.stores = stores; this.products = products; this.history = history; this.clock = clock; }
    @Transactional(readOnly = true)
    public List<ProductResponse> products() { return products.findAllByOrderByDisplayOrderAscIdAsc().stream().map(ProductResponse::from).toList(); }
    @Transactional
    public ProductResponse create(ProductRequest request) { validateProduct(request); Instant now = clock.instant(); return ProductResponse.from(products.save(new SubscriptionProduct(request.name(), request.tier(), request.price(), request.durationMonths(), request.description(), request.active(), request.displayOrder(), now))); }
    @Transactional
    public ProductResponse update(Long id, ProductRequest request) { validateProduct(request); SubscriptionProduct product = products.findById(id).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "구독 상품을 찾을 수 없습니다.")); product.change(request.name(), request.tier(), request.price(), request.durationMonths(), request.description(), request.active(), request.displayOrder(), clock.instant()); return ProductResponse.from(product); }
    @Transactional
    public void remove(Long id) {
        SubscriptionProduct product = products.findById(id).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "구독 상품을 찾을 수 없습니다."));
        if (history.countByProductId(id) > 0) {
            product.change(product.getName(), product.getTier(), product.getPrice(), product.getDurationMonths(), product.getDescription(), false, product.getDisplayOrder(), clock.instant());
            return;
        }
        products.delete(product);
    }
    @Transactional(readOnly = true)
    public List<AdminMembershipResponse> memberships() { Instant now = clock.instant(); return stores.findAll().stream().map(store -> toMembership(store, now)).toList(); }
    @Transactional
    public AdminMembershipResponse changeMembership(Long storeId, Long adminId, AdminChangeRequest request) { Instant now = clock.instant(); Store store = stores.findByIdForUpdate(storeId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매점을 찾을 수 없습니다.")); SubscriptionTier before = store.getTier(); Instant beforeExpiry = store.getSubscriptionExpiresAt(); Instant expiresAt = request.tier() == SubscriptionTier.SILVER ? null : request.expiresAt(); if (request.tier() != SubscriptionTier.SILVER && (expiresAt == null || !expiresAt.isAfter(now))) throw new DomainException(ErrorCode.VALIDATION_FAILED, "유료 등급은 미래의 만료일이 필요합니다."); store.activateMembership(request.tier(), expiresAt); history.save(new StoreSubscriptionHistory(storeId, null, before, request.tier(), beforeExpiry, expiresAt, SubscriptionHistoryEvent.ADMIN_CHANGED, adminId, request.reason() == null || request.reason().isBlank() ? "관리자 등급 조절" : request.reason().trim(), now)); return toMembership(store, now); }
    @Transactional(readOnly = true)
    public List<HistoryResponse> history(Long storeId) { if (!stores.existsById(storeId)) throw new DomainException(ErrorCode.NOT_FOUND, "판매점을 찾을 수 없습니다."); return history.findTop100ByStoreIdOrderByCreatedAtDesc(storeId).stream().map(HistoryResponse::from).toList(); }
    private AdminMembershipResponse toMembership(Store store, Instant now) { return new AdminMembershipResponse(store.getId(), store.getName(), store.getOwner().getEmail(), store.getTier(), store.getSubscriptionExpiresAt(), store.hasActivePaidMembership(now), store.getConfiguredSlots(), store.getTierSlotCap()); }
    private void validateProduct(ProductRequest request) { if (request.tier() == SubscriptionTier.SILVER) throw new DomainException(ErrorCode.VALIDATION_FAILED, "실버는 무료 기본 등급이라 구독 상품으로 만들 수 없습니다."); }
}

