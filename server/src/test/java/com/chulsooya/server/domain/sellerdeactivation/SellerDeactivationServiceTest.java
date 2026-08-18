package com.chulsooya.server.domain.sellerdeactivation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;

class SellerDeactivationServiceTest {
    @Test
    void 관리자_승인시_판매자는_일반회원으로_전환되고_판매점은_비활성화된다() {
        UserRepository users = mock(UserRepository.class);
        StoreRepository stores = mock(StoreRepository.class);
        SellerDeactivationRequestRepository requests = mock(SellerDeactivationRequestRepository.class);
        User seller = mock(User.class);
        Store store = mock(Store.class);
        SellerDeactivationRequest request = new SellerDeactivationRequest(seller, "사업 종료");
        when(seller.getId()).thenReturn(107L);
        when(requests.findById(11L)).thenReturn(Optional.of(request));
        when(stores.findByOwnerId(107L)).thenReturn(Optional.of(store));
        SellerDeactivationService service = new SellerDeactivationService(users, stores, requests);

        SellerDeactivationRequest approved = service.approve(11L, 109L);

        assertEquals(SellerDeactivationStatus.APPROVED, approved.getStatus());
        verify(seller).changeRole(UserRole.CONSUMER);
        verify(store).changeOperatingStatus(false, false);
    }
}
