package com.chulsooya.server.domain.notice;

import java.time.Instant;
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

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.support.CurrentUser;

@RestController
public class PopupNoticeController {

    private final PopupNoticeService service;

    public PopupNoticeController(PopupNoticeService service) {
        this.service = service;
    }

    @GetMapping("/api/notices/popup")
    public ApiResponse<PopupNoticeService.PopupNoticeView> activeNotice() {
        return ApiResponse.of(service.activeNotice());
    }

    @GetMapping("/api/admin/popup-notices")
    public ApiResponse<List<PopupNoticeService.PopupNoticeView>> list(CurrentUser actor) {
        return ApiResponse.of(service.list(actor));
    }

    @PostMapping("/api/admin/popup-notices")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PopupNoticeService.PopupNoticeView> create(CurrentUser actor, @RequestBody PopupNoticeRequest request) {
        return ApiResponse.of(service.create(actor, command(request)));
    }

    @PutMapping("/api/admin/popup-notices/{noticeId}")
    public ApiResponse<PopupNoticeService.PopupNoticeView> update(CurrentUser actor, @PathVariable long noticeId,
            @RequestBody PopupNoticeRequest request) {
        return ApiResponse.of(service.update(actor, noticeId, command(request)));
    }

    @PostMapping("/api/admin/popup-notices/{noticeId}/active")
    public ApiResponse<PopupNoticeService.PopupNoticeView> setActive(CurrentUser actor, @PathVariable long noticeId,
            @RequestBody PopupNoticeActiveRequest request) {
        if (request == null) throw new DomainException(ErrorCode.VALIDATION_FAILED, "팝업 활성 상태를 선택해 주세요.");
        return ApiResponse.of(service.setActive(actor, noticeId, request.active()));
    }

    @DeleteMapping("/api/admin/popup-notices/{noticeId}")
    public ApiResponse<Void> delete(CurrentUser actor, @PathVariable long noticeId) {
        service.delete(actor, noticeId);
        return ApiResponse.of(null);
    }

    private PopupNoticeService.PopupNoticeCommand command(PopupNoticeRequest request) {
        if (request == null) throw new DomainException(ErrorCode.VALIDATION_FAILED, "팝업 내용을 입력해 주세요.");
        return new PopupNoticeService.PopupNoticeCommand(request.title(), request.content(), request.displayStartAt(), request.displayEndAt());
    }

    public record PopupNoticeRequest(String title, String content, Instant displayStartAt, Instant displayEndAt) {
    }

    public record PopupNoticeActiveRequest(boolean active) {
    }
}
