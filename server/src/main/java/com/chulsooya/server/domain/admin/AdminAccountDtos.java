package com.chulsooya.server.domain.admin;

import java.time.Instant;
import java.util.List;

import com.chulsooya.server.domain.user.AdminLevel;
import com.chulsooya.server.domain.user.AdminStatus;

public final class AdminAccountDtos {
    private AdminAccountDtos() { }

    public record AccountResponse(Long id, String email, String name, String roleLabel,
            String statusLabel, AdminLevel level, AdminStatus status, Instant statusUpdatedAt) { }

    public record InviteRequest(String email, String name) { }

    public record StatusUpdateRequest(AdminStatus status) { }

    public record AccountListResponse(List<AccountResponse> accounts) { }
}
