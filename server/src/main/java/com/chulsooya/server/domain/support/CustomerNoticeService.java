package com.chulsooya.server.domain.support;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.maintenance.MaintenanceNotice;
import com.chulsooya.server.domain.maintenance.MaintenanceNoticeRepository;
import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class CustomerNoticeService {

    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");
    private static final int MAX_NOTICE_TITLE_LENGTH = 120;
    private static final DateTimeFormatter REGISTRATION_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm", Locale.KOREAN);
    private static final Pattern REGISTRATION_TIME_TITLE_SUFFIX = Pattern.compile(" \\[(?:공지 등록 시간: |공지개시 |등록 ).*\\]\\z");

    private final CustomerNoticeRepository notices;
    private final MaintenanceNoticeRepository maintenanceNotices;
    private final UserRepository users;
    private final FeaturePermissionService permissions;

    public CustomerNoticeService(CustomerNoticeRepository notices, MaintenanceNoticeRepository maintenanceNotices,
            UserRepository users, FeaturePermissionService permissions) {
        this.notices = notices;
        this.maintenanceNotices = maintenanceNotices;
        this.users = users;
        this.permissions = permissions;
    }

    public List<CustomerNoticeView> publicNotices() {
        List<CustomerNoticeView> general = notices.findAllByOrderByUpdatedAtDesc().stream()
                .filter(CustomerNotice::isActive)
                .map(this::generalView)
                .toList();
        List<CustomerNoticeView> maintenance = maintenanceNotices.findAllByOrderByUpdatedAtDesc().stream()
                .filter(MaintenanceNotice::isActive)
                .map(this::maintenanceView)
                .toList();
        return java.util.stream.Stream.concat(general.stream(), maintenance.stream())
                .sorted(Comparator.comparing(CustomerNoticeView::updatedAt).reversed())
                .toList();
    }

    public List<CustomerNoticeView> list(CurrentUser actor) {
        requireNoticeManager(actor);
        return notices.findAllByOrderByUpdatedAtDesc().stream().map(this::generalView).toList();
    }

    @Transactional
    public CustomerNoticeView create(CurrentUser actor, CustomerNoticeCommand command) {
        User administrator = requireNoticeManager(actor);
        validate(command);
        CustomerNotice notice = notices.save(new CustomerNotice(command.title().trim(), command.content().trim(),
                command.displayStartAt(), command.displayEndAt(), administrator));
        return generalView(notice);
    }

    @Transactional
    public CustomerNoticeView update(CurrentUser actor, long noticeId, CustomerNoticeCommand command) {
        User administrator = requireNoticeManager(actor);
        validate(command);
        CustomerNotice notice = noticeById(noticeId);
        notice.update(command.title().trim(), command.content().trim(), command.displayStartAt(), command.displayEndAt(), administrator);
        return generalView(notices.save(notice));
    }

    @Transactional
    public CustomerNoticeView setActive(CurrentUser actor, long noticeId, boolean active, boolean appendRegistrationTime) {
        User administrator = requireNoticeManager(actor);
        CustomerNotice notice = noticeById(noticeId);
        if (active) notice.updateTitle(withRegistrationTimeTitle(notice.getTitle(), appendRegistrationTime), administrator);
        notice.setActive(active, administrator);
        return generalView(notices.save(notice));
    }

    private String withRegistrationTimeTitle(String title, boolean appendRegistrationTime) {
        String withoutRegistrationTime = REGISTRATION_TIME_TITLE_SUFFIX.matcher(title).replaceFirst("");
        if (!appendRegistrationTime) return withoutRegistrationTime;
        String suffix = " [등록 " + REGISTRATION_TIME_FORMAT.format(Instant.now().atZone(KOREA_ZONE)) + "]";
        return withoutRegistrationTime.substring(0, Math.min(withoutRegistrationTime.length(), MAX_NOTICE_TITLE_LENGTH - suffix.length())) + suffix;
    }

    @Transactional
    public void delete(CurrentUser actor, long noticeId) {
        requireNoticeManager(actor);
        notices.delete(noticeById(noticeId));
    }

    private User requireNoticeManager(CurrentUser actor) {
        if (actor == null || !actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
        permissions.require(actor, FeaturePermission.ADMIN_MANAGE_CUSTOMER_NOTICES);
        return users.findById(actor.userId()).orElseThrow(() -> new DomainException(ErrorCode.FORBIDDEN));
    }

    private CustomerNotice noticeById(long noticeId) {
        return notices.findById(noticeId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "고객센터 공지를 찾을 수 없습니다."));
    }

    private void validate(CustomerNoticeCommand command) {
        if (command == null || command.title() == null || command.title().isBlank() || command.content() == null || command.content().isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "공지 제목과 내용을 입력해 주세요.");
        }
        if (command.displayStartAt() != null && command.displayEndAt() != null && !command.displayEndAt().isAfter(command.displayStartAt())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "공지 종료 시간은 시작 시간보다 늦어야 합니다.");
        }
    }

    private CustomerNoticeView generalView(CustomerNotice notice) {
        return new CustomerNoticeView(notice.getId(), CustomerNoticeSource.GENERAL, notice.getTitle(), notice.getContent(),
                notice.isActive(), notice.getDisplayStartAt(), notice.getDisplayEndAt(), notice.getActivatedAt(), notice.getUpdatedAt());
    }

    private CustomerNoticeView maintenanceView(MaintenanceNotice notice) {
        return new CustomerNoticeView(notice.getId(), CustomerNoticeSource.MAINTENANCE, notice.getTitle(), notice.getContent(),
                notice.isActive(), notice.getDisplayStartAt(), notice.getDisplayEndAt(), notice.getActivatedAt(), notice.getUpdatedAt());
    }

    public record CustomerNoticeCommand(String title, String content, Instant displayStartAt, Instant displayEndAt) {
    }

    public record CustomerNoticeView(Long id, CustomerNoticeSource source, String title, String content, boolean active,
            Instant displayStartAt, Instant displayEndAt, Instant activatedAt, Instant updatedAt) {
    }
}
