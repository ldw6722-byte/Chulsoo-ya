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
import com.chulsooya.server.domain.support.SupportDtos.AdminInquiryResponse;
import com.chulsooya.server.domain.support.SupportDtos.ChangeInquiryStatusRequest;
import com.chulsooya.server.domain.support.SupportDtos.ReplyInquiryRequest;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/admin/support")
public class AdminCustomerSupportController {
    private final CustomerSupportService service;
    public AdminCustomerSupportController(CustomerSupportService service) { this.service = service; }

    @GetMapping("/inquiries")
    public ApiResponse<List<AdminInquiryResponse>> inquiries(CurrentUser user, @RequestParam(required = false) SupportInquiryStatus status) {
        return ApiResponse.of(service.adminInquiries(user, status));
    }

    @PostMapping("/inquiries/{inquiryId}/reply")
    public ApiResponse<AdminInquiryResponse> reply(CurrentUser user, @PathVariable Long inquiryId, @Valid @RequestBody ReplyInquiryRequest request) {
        return ApiResponse.of(service.reply(user, inquiryId, request));
    }

    @PostMapping("/inquiries/{inquiryId}/status")
    public ApiResponse<AdminInquiryResponse> changeStatus(CurrentUser user, @PathVariable Long inquiryId, @Valid @RequestBody ChangeInquiryStatusRequest request) {
        return ApiResponse.of(service.changeStatus(user, inquiryId, request));
    }
}
