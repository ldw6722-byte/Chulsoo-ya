package com.chulsooya.server.domain.address;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.address.DeliveryAddressDtos.DeliveryAddressRequest;
import com.chulsooya.server.domain.address.DeliveryAddressDtos.DeliveryAddressResponse;
import com.chulsooya.server.support.CurrentUser;

@Service
public class DeliveryAddressService {
    private final DeliveryAddressRepository addresses;

    public DeliveryAddressService(DeliveryAddressRepository addresses) {
        this.addresses = addresses;
    }

    @Transactional(readOnly = true)
    public List<DeliveryAddressResponse> list(CurrentUser user) {
        return addresses.findByConsumerIdOrderByDefaultAddressDescUpdatedAtDesc(user.userId()).stream()
                .map(DeliveryAddressResponse::from).toList();
    }

    @Transactional
    public DeliveryAddressResponse create(CurrentUser user, DeliveryAddressRequest request) {
        validateDistrict(request);
        boolean makeDefault = request.defaultAddress() || addresses.countByConsumerId(user.userId()) == 0;
        if (makeDefault) addresses.clearDefaultByConsumerId(user.userId());
        DeliveryAddress address = addresses.save(new DeliveryAddress(user.userId(), trim(request.label()), trim(request.recipientName()),
                trim(request.recipientPhone()), trim(request.cityName()), trim(request.districtName()), trim(request.roadAddress()),
                request.addressDetail(), makeDefault));
        return DeliveryAddressResponse.from(address);
    }

    @Transactional
    public DeliveryAddressResponse update(CurrentUser user, Long addressId, DeliveryAddressRequest request) {
        validateDistrict(request);
        DeliveryAddress address = owned(user, addressId);
        address.update(trim(request.label()), trim(request.recipientName()), trim(request.recipientPhone()), trim(request.cityName()),
                trim(request.districtName()), trim(request.roadAddress()), request.addressDetail());
        if (request.defaultAddress()) {
            addresses.clearDefaultExcept(user.userId(), addressId);
            address.markDefault();
        }
        return DeliveryAddressResponse.from(address);
    }

    @Transactional
    public DeliveryAddressResponse setDefault(CurrentUser user, Long addressId) {
        DeliveryAddress address = owned(user, addressId);
        addresses.clearDefaultExcept(user.userId(), addressId);
        address.markDefault();
        return DeliveryAddressResponse.from(address);
    }

    @Transactional
    public void delete(CurrentUser user, Long addressId) {
        DeliveryAddress address = owned(user, addressId);
        boolean wasDefault = address.isDefaultAddress();
        addresses.delete(address);
        if (wasDefault) {
            addresses.flush();
            addresses.findFirstByConsumerIdAndIdNotOrderByUpdatedAtDesc(user.userId(), addressId)
                    .ifPresent(DeliveryAddress::markDefault);
        }
    }

    private DeliveryAddress owned(CurrentUser user, Long addressId) {
        DeliveryAddress address = addresses.findById(addressId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "배송지를 찾을 수 없습니다."));
        if (!address.getConsumerId().equals(user.userId())) {
            throw new DomainException(ErrorCode.FORBIDDEN, "다른 회원의 배송지는 변경할 수 없습니다.");
        }
        return address;
    }

    private void validateDistrict(DeliveryAddressRequest request) {
        if (!"서울특별시".equals(request.cityName().trim()) || !request.districtName().trim().endsWith("구")) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "서울특별시와 구를 선택해 주세요.");
        }
    }

    private String trim(String value) {
        return value.trim();
    }
}
