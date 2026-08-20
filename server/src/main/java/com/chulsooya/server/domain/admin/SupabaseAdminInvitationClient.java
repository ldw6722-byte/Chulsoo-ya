package com.chulsooya.server.domain.admin;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

@Component
public class SupabaseAdminInvitationClient {
    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public SupabaseAdminInvitationClient(@Value("${app.supabase.url:}") String supabaseUrl,
            @Value("${app.supabase.secret-key:}") String serviceRoleKey) {
        this.supabaseUrl = stripTrailingSlash(supabaseUrl);
        this.serviceRoleKey = serviceRoleKey == null ? "" : serviceRoleKey.trim();
    }

    public void invite(String email, String name) {
        if (supabaseUrl.isBlank() || serviceRoleKey.isBlank()) {
            throw new DomainException(ErrorCode.INTERNAL_ERROR, "Supabase 관리자 초대 설정이 준비되지 않았습니다.");
        }
        String body = "{\"email\":\"" + escapeJson(email) + "\",\"data\":{\"name\":\"" + escapeJson(name) + "\"}}";
        HttpRequest request = HttpRequest.newBuilder(URI.create(supabaseUrl + "/auth/v1/invite"))
                .header("apikey", serviceRoleKey)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new DomainException(ErrorCode.INTERNAL_ERROR, "관리자 초대 이메일 발송에 실패했습니다.");
            }
        } catch (IOException exception) {
            throw new DomainException(ErrorCode.INTERNAL_ERROR, "관리자 초대 서비스를 연결하지 못했습니다.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new DomainException(ErrorCode.INTERNAL_ERROR, "관리자 초대가 중단되었습니다.");
        }
    }

    private static String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) return "";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
