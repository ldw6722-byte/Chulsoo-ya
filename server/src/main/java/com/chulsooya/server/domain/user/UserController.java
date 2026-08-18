package com.chulsooya.server.domain.user;

import java.time.Instant;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** 개발용 계정 목록. 운영 화면은 관리자 전용 /api/admin/users를 사용한다. */
    @GetMapping
    public ApiResponse<List<UserResponse>> list() {
        return ApiResponse.of(userRepository.findAll().stream().map(UserResponse::from).toList());
    }

    @GetMapping("/me")
    public ApiResponse<MemberProfileResponse> mine(CurrentUser actor) {
        return ApiResponse.of(MemberProfileResponse.from(owned(actor)));
    }

    @PatchMapping("/me")
    @Transactional
    public ApiResponse<MemberProfileResponse> updateMine(CurrentUser actor,
            @Valid @RequestBody UpdateMemberProfileRequest request) {
        User user = owned(actor);
        user.updateMemberProfile(request.name(), request.phone());
        return ApiResponse.of(MemberProfileResponse.from(user));
    }

    private User owned(CurrentUser actor) {
        return userRepository.findById(actor.userId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));
    }

    public record UpdateMemberProfileRequest(
            @NotBlank @Size(max = 60) String name,
            @NotBlank @Size(max = 30) String phone) {
    }

    public record MemberProfileResponse(
            Long id,
            String email,
            String name,
            String phone,
            UserRole role,
            Instant createdAt) {
        static MemberProfileResponse from(User user) {
            return new MemberProfileResponse(user.getId(), user.getEmail(), user.getName(), user.getPhone(),
                    user.getRole(), user.getCreatedAt());
        }
    }

    public record UserResponse(Long id, String email, String name, UserRole role) {
        static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
        }
    }
}
