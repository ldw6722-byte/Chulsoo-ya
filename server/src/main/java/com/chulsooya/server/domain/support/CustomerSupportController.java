package com.chulsooya.server.domain.support;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.support.SupportDtos.*;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/support")
public class CustomerSupportController {
    private final CustomerSupportService service;
    public CustomerSupportController(CustomerSupportService service) { this.service = service; }

    @GetMapping("/faqs")
    public ApiResponse<List<FaqItem>> faqs() { return ApiResponse.of(service.faqs()); }

    @GetMapping("/center")
    public ApiResponse<CustomerCenterResponse> center(CurrentUser user) { return ApiResponse.of(service.customerCenter(user)); }

    @PostMapping("/inquiries")
    public ApiResponse<InquiryResponse> create(CurrentUser user, @Valid @RequestBody CreateInquiryRequest request) {
        return ApiResponse.of(service.createInquiry(user, request));
    }

    @PostMapping("/notifications/{notificationId}/read")
    public ApiResponse<Void> read(CurrentUser user, @PathVariable Long notificationId) {
        service.markNotificationRead(user, notificationId);
        return ApiResponse.of(null);
    }
}

