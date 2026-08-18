package com.chulsooya.server.domain.paymentmethod;

import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.paymentmethod.PaymentMethodDtos.PaymentMethodResponse;
import com.chulsooya.server.domain.paymentmethod.PaymentMethodDtos.RegisterPaymentMethodRequest;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {
    private final PaymentMethodService service;

    public PaymentMethodController(PaymentMethodService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<PaymentMethodResponse>> list(CurrentUser user) {
        return ApiResponse.of(service.list(user));
    }

    @PostMapping
    public ApiResponse<PaymentMethodResponse> register(CurrentUser user,
            @Valid @RequestBody RegisterPaymentMethodRequest request) {
        return ApiResponse.of(service.register(user, request));
    }

    @DeleteMapping("/{paymentMethodId}")
    public ApiResponse<Void> delete(CurrentUser user, @PathVariable Long paymentMethodId) {
        service.delete(user, paymentMethodId);
        return ApiResponse.of(null);
    }
}
