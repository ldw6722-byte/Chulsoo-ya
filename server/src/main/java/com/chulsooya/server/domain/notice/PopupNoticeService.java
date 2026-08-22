package com.chulsooya.server.domain.notice;

import java.time.Instant;
import java.util.List;

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
public class PopupNoticeService {

    private final PopupNoticeRepository notices;
    private final UserRepository users;
    private final BusinessNotificationService notifications;

    public PopupNoticeService(PopupNoticeRepository notices, UserRepository users, BusinessNotificationService notifications) {
        this.notices = notices;
        this.users = users;
        this.notifications = notifications;
    }

    public PopupNoticeView activeNotice() {
        return notices.findAllByOrderByUpdatedAtDesc().stream().filter(notice -> notice.isVisibleAt(Instant.now())).findFirst().map(this::view).orElse(null);
    }

    public List<PopupNoticeView> list(CurrentUser actor) {
        requireHighestAdministrator(actor);
        return notices.findAllByOrderByUpdatedAtDesc().stream().map(this::view).toList();
    }

    @Transactional
    public PopupNoticeView create(CurrentUser actor, PopupNoticeCommand command) {
        User administrator = requireHighestAdministrator(actor);
        validate(command);
        PopupNotice saved = notices.save(new PopupNotice(command.title().trim(), command.content().trim(), command.displayStartAt(), command.displayEndAt(), administrator));
        notifyChange(administrator, "팝업 광고를 새로 등록했습니다.");
        return view(saved);
    }

    @Transactional
    public PopupNoticeView update(CurrentUser actor, long noticeId, PopupNoticeCommand command) {
        User administrator = requireHighestAdministrator(actor);
        validate(command);
        PopupNotice notice = noticeById(noticeId);
        notice.update(command.title().trim(), command.content().trim(), command.displayStartAt(), command.displayEndAt(), administrator);
        PopupNotice saved = notices.save(notice);
        notifyChange(administrator, "팝업 광고를 수정했습니다.");
        return view(saved);
    }

    @Transactional
    public PopupNoticeView setActive(CurrentUser actor, long noticeId, boolean active) {
        User administrator = requireHighestAdministrator(actor);
        PopupNotice target = noticeById(noticeId);
        if (active) {
            notices.findAllByOrderByUpdatedAtDesc().stream().filter(PopupNotice::isActive).forEach(notice -> notice.setActive(false, administrator));
        }
        target.setActive(active, administrator);
        PopupNotice saved = notices.save(target);
        notifyChange(administrator, active ? "팝업 광고를 활성화했습니다." : "팝업 광고를 비활성화했습니다.");
        return view(saved);
    }

    @Transactional
    public void delete(CurrentUser actor, long noticeId) {
        User administrator = requireHighestAdministrator(actor);
        notices.delete(noticeById(noticeId));
        notifyChange(administrator, "팝업 광고를 삭제했습니다.");
    }

    private PopupNotice noticeById(long noticeId) {
        return notices.findById(noticeId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "팝업 광고를 찾을 수 없습니다."));
    }

    private User requireHighestAdministrator(CurrentUser actor) {
        if (actor == null || !actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "최고 관리자 권한이 필요합니다.");
        User account = users.findById(actor.userId()).orElseThrow(() -> new DomainException(ErrorCode.FORBIDDEN));
        if (account.getRole() != UserRole.ADMIN || !account.isHighestAdministrator()) {
            throw new DomainException(ErrorCode.FORBIDDEN, "최고 관리자만 팝업 광고를 관리할 수 있습니다.");
        }
        return account;
    }

    private void validate(PopupNoticeCommand command) {
        if (command == null || command.title() == null || command.title().isBlank() || command.content() == null || command.content().isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "팝업 제목과 내용을 입력해 주세요.");
        }
        if (command.displayStartAt() != null && command.displayEndAt() != null && !command.displayEndAt().isAfter(command.displayStartAt())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "팝업 종료 시간은 시작 시간보다 늦어야 합니다.");
        }
    }

    private void notifyChange(User administrator, String message) {
        notifications.notifyHighestAdmins("POPUP_NOTICE_CHANGED", "메인 팝업 광고가 변경되었습니다", administrator.getName() + " 최고관리자가 " + message, "/admin?view=popupAds");
    }

    private PopupNoticeView view(PopupNotice notice) {
        return new PopupNoticeView(notice.getId(), notice.getTitle(), notice.getContent(), notice.isActive(), notice.getDisplayStartAt(), notice.getDisplayEndAt(), notice.getUpdatedAt());
    }

    public record PopupNoticeCommand(String title, String content, Instant displayStartAt, Instant displayEndAt) { }
    public record PopupNoticeView(Long id, String title, String content, boolean active, Instant displayStartAt, Instant displayEndAt, Instant updatedAt) { }
}
