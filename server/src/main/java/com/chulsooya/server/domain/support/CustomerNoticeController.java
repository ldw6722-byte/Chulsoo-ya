package com.chulsooya.server.domain.support;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.support.CustomerNoticeService.CustomerNoticeCommand;
import com.chulsooya.server.domain.support.CustomerNoticeService.CustomerNoticeView;
import com.chulsooya.server.domain.support.SupportDtos.CustomerNoticeActiveRequest;
import com.chulsooya.server.domain.support.SupportDtos.CustomerNoticeRequest;
import com.chulsooya.server.support.CurrentUser;

@RestController
public class CustomerNoticeController {

    private final CustomerNoticeService notices;

    public CustomerNoticeController(CustomerNoticeService notices) {
        this.notices = notices;
    }

    @GetMapping("/api/support/notices")
    public ApiResponse<List<CustomerNoticeView>> publicNotices() {
        return ApiResponse.of(notices.publicNotices());
    }

    @GetMapping("/api/admin/customer-notices")
    public ApiResponse<List<CustomerNoticeView>> list(CurrentUser actor) {
        return ApiResponse.of(notices.list(actor));
    }

    @PostMapping("/api/admin/customer-notices")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CustomerNoticeView> create(CurrentUser actor, @Valid @RequestBody CustomerNoticeRequest request) {
        return ApiResponse.of(notices.create(actor, command(request)));
    }

    @PutMapping("/api/admin/customer-notices/{noticeId}")
    public ApiResponse<CustomerNoticeView> update(CurrentUser actor, @PathVariable long noticeId,
            @Valid @RequestBody CustomerNoticeRequest request) {
        return ApiResponse.of(notices.update(actor, noticeId, command(request)));
    }

    @PostMapping("/api/admin/customer-notices/{noticeId}/active")
    public ApiResponse<CustomerNoticeView> setActive(CurrentUser actor, @PathVariable long noticeId,
            @Valid @RequestBody CustomerNoticeActiveRequest request) {
        return ApiResponse.of(notices.setActive(actor, noticeId, request.active(), request.appendRegistrationTime()));
    }

    @DeleteMapping("/api/admin/customer-notices/{noticeId}")
    public ApiResponse<Void> delete(CurrentUser actor, @PathVariable long noticeId) {
        notices.delete(actor, noticeId);
        return ApiResponse.of(null);
    }

    private CustomerNoticeCommand command(CustomerNoticeRequest request) {
        return new CustomerNoticeCommand(request.title(), request.content(), request.displayStartAt(), request.displayEndAt());
    }
}
