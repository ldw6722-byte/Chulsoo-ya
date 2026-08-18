package com.chulsooya.server.domain.address;

import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.address.DeliveryAddressDtos.DeliveryAddressRequest;
import com.chulsooya.server.domain.address.DeliveryAddressDtos.DeliveryAddressResponse;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/delivery-addresses")
public class DeliveryAddressController {
    private final DeliveryAddressService service;

    public DeliveryAddressController(DeliveryAddressService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<DeliveryAddressResponse>> list(CurrentUser user) {
        return ApiResponse.of(service.list(user));
    }

    @PostMapping
    public ApiResponse<DeliveryAddressResponse> create(CurrentUser user, @Valid @RequestBody DeliveryAddressRequest request) {
        return ApiResponse.of(service.create(user, request));
    }

    @PatchMapping("/{addressId}")
    public ApiResponse<DeliveryAddressResponse> update(CurrentUser user, @PathVariable Long addressId,
            @Valid @RequestBody DeliveryAddressRequest request) {
        return ApiResponse.of(service.update(user, addressId, request));
    }

    @PatchMapping("/{addressId}/default")
    public ApiResponse<DeliveryAddressResponse> setDefault(CurrentUser user, @PathVariable Long addressId) {
        return ApiResponse.of(service.setDefault(user, addressId));
    }

    @DeleteMapping("/{addressId}")
    public ApiResponse<Void> delete(CurrentUser user, @PathVariable Long addressId) {
        service.delete(user, addressId);
        return ApiResponse.of(null);
    }
}
