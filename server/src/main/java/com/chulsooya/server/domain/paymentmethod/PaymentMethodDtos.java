package com.chulsooya.server.domain.paymentmethod;

import java.time.Instant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class PaymentMethodDtos {
    private PaymentMethodDtos() {
    }

    public record RegisterPaymentMethodRequest(
            @NotNull PaymentMethodType methodType,
            @NotBlank @Size(max = 60) String providerName,
            @NotBlank @Pattern(regexp = "\\d{4}") String lastFour) {
    }

    public record PaymentMethodResponse(
            Long id,
            PaymentMethodType methodType,
            String providerName,
            String maskedLabel,
            Instant createdAt) {
        public static PaymentMethodResponse from(PaymentMethod method) {
            return new PaymentMethodResponse(method.getId(), method.getMethodType(), method.getProviderName(),
                    method.maskedLabel(), method.getCreatedAt());
        }
    }
}
