package com.chulsooya.server.domain.paymentmethod;

import java.time.Instant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "payment_methods", indexes = {
        @Index(name = "idx_payment_methods_user_created", columnList = "user_id,created_at")
})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentMethod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long userId;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMethodType methodType;
    @Column(nullable = false, length = 60)
    private String providerName;
    @Column(nullable = false, length = 4)
    private String lastFour;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private PaymentMethod(Long userId, PaymentMethodType methodType, String providerName, String lastFour) {
        this.userId = userId;
        this.methodType = methodType;
        this.providerName = providerName.trim();
        this.lastFour = lastFour;
    }

    public static PaymentMethod create(Long userId, PaymentMethodType methodType, String providerName, String lastFour) {
        return new PaymentMethod(userId, methodType, providerName, lastFour);
    }

    public String maskedLabel() {
        return providerName + (methodType == PaymentMethodType.CARD ? " 카드 **** " : " 계좌 **** ") + lastFour;
    }
}
