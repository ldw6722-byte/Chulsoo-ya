package com.chulsooya.server.domain.maintenance;

import java.time.Instant;
import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.support.CurrentUser;

@RestController
public class PlatformMaintenanceModeController {

    private final PlatformMaintenanceModeService maintenance;

    public PlatformMaintenanceModeController(PlatformMaintenanceModeService maintenance) {
        this.maintenance = maintenance;
    }

    @GetMapping("/api/maintenance/status")
    public ApiResponse<PlatformMaintenanceModeService.MaintenanceStatus> status() {
        return ApiResponse.of(maintenance.status());
    }

    @PatchMapping("/api/admin/maintenance")
    public ApiResponse<PlatformMaintenanceModeService.MaintenanceStatus> update(CurrentUser actor,
            @RequestBody MaintenanceUpdateRequest request) {
        if (request == null || request.phase() == null) throw new DomainException(ErrorCode.VALIDATION_FAILED, "점검 단계를 선택해 주세요.");
        return ApiResponse.of(maintenance.update(actor, request.phase(), request.plannedStartAt(), request.plannedEndAt()));
    }

    @GetMapping("/api/admin/maintenance/notices")
    public ApiResponse<List<PlatformMaintenanceModeService.MaintenanceNoticeView>> notices(CurrentUser actor) {
        return ApiResponse.of(maintenance.listNotices(actor));
    }

    @PostMapping("/api/admin/maintenance/notices")
    public ApiResponse<PlatformMaintenanceModeService.MaintenanceNoticeView> createNotice(CurrentUser actor,
            @RequestBody NoticeRequest request) {
        return ApiResponse.of(maintenance.createNotice(actor, noticeCommand(request)));
    }

    @PatchMapping("/api/admin/maintenance/notices/{noticeId}")
    public ApiResponse<PlatformMaintenanceModeService.MaintenanceNoticeView> updateNotice(CurrentUser actor,
            @PathVariable long noticeId, @RequestBody NoticeRequest request) {
        return ApiResponse.of(maintenance.updateNotice(actor, noticeId, noticeCommand(request)));
    }

    @PatchMapping("/api/admin/maintenance/notices/{noticeId}/active")
    public ApiResponse<PlatformMaintenanceModeService.MaintenanceNoticeView> setNoticeActive(CurrentUser actor,
            @PathVariable long noticeId, @RequestBody NoticeActiveRequest request) {
        if (request == null) throw new DomainException(ErrorCode.VALIDATION_FAILED, "공지 활성 상태를 선택해 주세요.");
        return ApiResponse.of(maintenance.setNoticeActive(actor, noticeId, request.active(), request.appendRegistrationTime()));
    }

    @DeleteMapping("/api/admin/maintenance/notices/{noticeId}")
    public ApiResponse<Void> deleteNotice(CurrentUser actor, @PathVariable long noticeId) {
        maintenance.deleteNotice(actor, noticeId);
        return ApiResponse.of(null);
    }

    private PlatformMaintenanceModeService.NoticeCommand noticeCommand(NoticeRequest request) {
        if (request == null) throw new DomainException(ErrorCode.VALIDATION_FAILED, "공지 내용을 입력해 주세요.");
        return new PlatformMaintenanceModeService.NoticeCommand(request.title(), request.content(), request.popupEnabled(),
                request.displayStartAt(), request.displayEndAt());
    }

    public record MaintenanceUpdateRequest(MaintenancePhase phase, Instant plannedStartAt, Instant plannedEndAt) {
    }

    public record NoticeRequest(String title, String content, boolean popupEnabled, Instant displayStartAt, Instant displayEndAt) {
    }

    public record NoticeActiveRequest(boolean active, boolean appendRegistrationTime) {
    }
}
