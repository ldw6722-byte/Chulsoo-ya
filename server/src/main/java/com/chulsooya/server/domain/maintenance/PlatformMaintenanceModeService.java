package com.chulsooya.server.domain.maintenance;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.support.BusinessNotificationService;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class PlatformMaintenanceModeService {

    private static final long SINGLETON_ID = 1L;
    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");
    private static final int MAX_NOTICE_TITLE_LENGTH = 120;
    private static final DateTimeFormatter REGISTRATION_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm", Locale.KOREAN);
    private static final Pattern REGISTRATION_TIME_CONTENT_SUFFIX = Pattern.compile("\\n{2}공지 등록 시간: .*\\z");
    private static final Pattern REGISTRATION_TIME_TITLE_SUFFIX = Pattern.compile(" \\[(?:공지 등록 시간: |공지개시 |등록 ).*\\]\\z");

    private final PlatformMaintenanceModeRepository modes;
    private final MaintenanceNoticeRepository notices;
    private final UserRepository users;
    private final BusinessNotificationService notifications;

    public PlatformMaintenanceModeService(PlatformMaintenanceModeRepository modes, MaintenanceNoticeRepository notices,
            UserRepository users, BusinessNotificationService notifications) {
        this.modes = modes;
        this.notices = notices;
        this.users = users;
        this.notifications = notifications;
    }

    public MaintenanceStatus status() {
        return response(maintenanceMode());
    }

    public boolean isEnabled() {
        return maintenanceMode().isEnabled();
    }

    public boolean isHighestAdministrator(CurrentUser actor) {
        if (actor == null || !actor.isAdmin()) return false;
        return users.findById(actor.userId()).map(User::isHighestAdministrator).orElse(false);
    }

    @Transactional
    public MaintenanceStatus update(CurrentUser actor, boolean enabled) {
        return update(actor, enabled ? MaintenancePhase.MAINTENANCE : MaintenancePhase.NORMAL, null, null);
    }

    @Transactional
    public MaintenanceStatus update(CurrentUser actor, MaintenancePhase phase, Instant plannedStartAt, Instant plannedEndAt) {
        User administrator = requireHighestAdministrator(actor);
        if (phase == null) throw new DomainException(ErrorCode.VALIDATION_FAILED, "점검 단계를 선택해 주세요.");
        if (plannedStartAt != null && plannedEndAt != null && !plannedEndAt.isAfter(plannedStartAt)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "점검 종료 시간은 시작 시간보다 늦어야 합니다.");
        }
        PlatformMaintenanceMode mode = maintenanceMode();
        boolean changed = mode.getPhase() != phase || !same(mode.getPlannedStartAt(), plannedStartAt) || !same(mode.getPlannedEndAt(), plannedEndAt);
        if (changed) {
            mode.update(phase, plannedStartAt, plannedEndAt, administrator);
            modes.save(mode);
            notifications.notifyHighestAdmins("MAINTENANCE_MODE_CHANGED", "서비스 점검 단계가 변경되었습니다",
                    administrator.getName() + " 최고관리자가 점검 단계를 " + phaseLabel(phase) + "로 변경했습니다.",
                    "/admin?view=maintenance");
        }
        return response(mode);
    }

    public List<MaintenanceNoticeView> listNotices(CurrentUser actor) {
        requireHighestAdministrator(actor);
        return notices.findAllByOrderByUpdatedAtDesc().stream().map(this::noticeResponse).toList();
    }

    @Transactional
    public MaintenanceNoticeView createNotice(CurrentUser actor, NoticeCommand command) {
        User administrator = requireHighestAdministrator(actor);
        validateNotice(command);
        MaintenanceNotice notice = new MaintenanceNotice(command.title().trim(), command.content().trim(), command.popupEnabled(),
                command.displayStartAt(), command.displayEndAt(), administrator);
        return noticeResponse(notices.save(notice));
    }

    @Transactional
    public MaintenanceNoticeView updateNotice(CurrentUser actor, long noticeId, NoticeCommand command) {
        User administrator = requireHighestAdministrator(actor);
        validateNotice(command);
        MaintenanceNotice notice = noticeById(noticeId);
        notice.update(command.title().trim(), command.content().trim(), command.popupEnabled(), command.displayStartAt(), command.displayEndAt(), administrator);
        return noticeResponse(notices.save(notice));
    }

    @Transactional
    public MaintenanceNoticeView setNoticeActive(CurrentUser actor, long noticeId, boolean active, boolean appendRegistrationTime) {
        User administrator = requireHighestAdministrator(actor);
        MaintenanceNotice target = noticeById(noticeId);
        if (active) {
            notices.findAllByOrderByUpdatedAtDesc().stream().filter(MaintenanceNotice::isActive).forEach(notice -> notice.setActive(false, administrator));
            target.updateTitle(withRegistrationTimeTitle(target.getTitle(), appendRegistrationTime), administrator);
            target.updateContent(withoutRegistrationTimeContent(target.getContent()), administrator);
        }
        target.setActive(active, administrator);
        return noticeResponse(notices.save(target));
    }

    private String withRegistrationTimeTitle(String title, boolean appendRegistrationTime) {
        String withoutRegistrationTime = REGISTRATION_TIME_TITLE_SUFFIX.matcher(title).replaceFirst("");
        if (!appendRegistrationTime) return withoutRegistrationTime;
        String suffix = " [등록 " + REGISTRATION_TIME_FORMAT.format(Instant.now().atZone(KOREA_ZONE)) + "]";
        return withoutRegistrationTime.substring(0, Math.min(withoutRegistrationTime.length(), MAX_NOTICE_TITLE_LENGTH - suffix.length())) + suffix;
    }

    private String withoutRegistrationTimeContent(String content) {
        return REGISTRATION_TIME_CONTENT_SUFFIX.matcher(content).replaceFirst("");
    }

    @Transactional
    public void deleteNotice(CurrentUser actor, long noticeId) {
        requireHighestAdministrator(actor);
        notices.delete(noticeById(noticeId));
    }

    private PlatformMaintenanceMode maintenanceMode() {
        return modes.findById(SINGLETON_ID).orElseGet(() -> modes.save(new PlatformMaintenanceMode(false)));
    }

    private MaintenanceNotice noticeById(long noticeId) {
        return notices.findById(noticeId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "점검 공지를 찾을 수 없습니다."));
    }

    private User requireHighestAdministrator(CurrentUser actor) {
        if (actor == null || !actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "최고 관리자 권한이 필요합니다.");
        User account = users.findById(actor.userId()).orElseThrow(() -> new DomainException(ErrorCode.FORBIDDEN));
        if (account.getRole() != UserRole.ADMIN || !account.isHighestAdministrator()) {
            throw new DomainException(ErrorCode.FORBIDDEN, "최고 관리자만 점검 모드와 공지를 변경할 수 있습니다.");
        }
        return account;
    }

    private void validateNotice(NoticeCommand command) {
        if (command == null || command.title() == null || command.title().isBlank() || command.content() == null || command.content().isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "공지 제목과 내용을 입력해 주세요.");
        }
        if (command.displayStartAt() != null && command.displayEndAt() != null && !command.displayEndAt().isAfter(command.displayStartAt())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "공지 종료 시간은 시작 시간보다 늦어야 합니다.");
        }
    }

    private MaintenanceStatus response(PlatformMaintenanceMode mode) {
        MaintenanceNoticeView activeNotice = notices.findAllByOrderByUpdatedAtDesc().stream()
                .filter(notice -> notice.isVisibleAt(Instant.now()))
                .findFirst().map(this::noticeResponse).orElse(null);
        return new MaintenanceStatus(mode.isEnabled(), mode.getPhase(), mode.getPlannedStartAt(), mode.getPlannedEndAt(),
                mode.getUpdatedAt(), mode.getUpdatedBy() == null ? null : mode.getUpdatedBy().getName(), activeNotice);
    }

    private MaintenanceNoticeView noticeResponse(MaintenanceNotice notice) {
        return new MaintenanceNoticeView(notice.getId(), notice.getTitle(), notice.getContent(), notice.isActive(), notice.isPopupEnabled(),
                notice.getDisplayStartAt(), notice.getDisplayEndAt(), notice.getActivatedAt(), notice.getUpdatedAt());
    }

    private static boolean same(Object first, Object second) {
        return first == null ? second == null : first.equals(second);
    }

    private static String phaseLabel(MaintenancePhase phase) {
        return switch (phase) {
            case NORMAL -> "정상 운영";
            case PREPARING -> "점검 준비";
            case MAINTENANCE -> "전면 점검";
        };
    }

    public record MaintenanceStatus(boolean enabled, MaintenancePhase phase, Instant plannedStartAt, Instant plannedEndAt,
            Instant updatedAt, String updatedByName, MaintenanceNoticeView notice) {
    }

    public record MaintenanceNoticeView(Long id, String title, String content, boolean active, boolean popupEnabled,
            Instant displayStartAt, Instant displayEndAt, Instant activatedAt, Instant updatedAt) {
    }

    public record NoticeCommand(String title, String content, boolean popupEnabled, Instant displayStartAt, Instant displayEndAt) {
    }
}
