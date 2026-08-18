package com.chulsooya.server.domain.paymentmethod;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.paymentmethod.PaymentMethodDtos.PaymentMethodResponse;
import com.chulsooya.server.domain.paymentmethod.PaymentMethodDtos.RegisterPaymentMethodRequest;
import com.chulsooya.server.support.CurrentUser;

@Service
public class PaymentMethodService {
    private final PaymentMethodRepository methods;

    public PaymentMethodService(PaymentMethodRepository methods) {
        this.methods = methods;
    }

    @Transactional(readOnly = true)
    public List<PaymentMethodResponse> list(CurrentUser user) {
        return methods.findByUserIdOrderByCreatedAtDesc(user.userId()).stream().map(PaymentMethodResponse::from).toList();
    }

    @Transactional
    public PaymentMethodResponse register(CurrentUser user, RegisterPaymentMethodRequest request) {
        PaymentMethod method = PaymentMethod.create(user.userId(), request.methodType(), request.providerName(), request.lastFour());
        return PaymentMethodResponse.from(methods.save(method));
    }

    @Transactional
    public void delete(CurrentUser user, Long paymentMethodId) {
        PaymentMethod method = methods.findById(paymentMethodId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "결제수단을 찾을 수 없습니다."));
        if (!method.getUserId().equals(user.userId())) {
            throw new DomainException(ErrorCode.FORBIDDEN, "다른 회원의 결제수단은 삭제할 수 없습니다.");
        }
        methods.delete(method);
    }
}
