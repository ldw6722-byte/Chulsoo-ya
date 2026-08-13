package com.chulsooya.server.domain.claim;

import java.io.IOException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

@Component
public class ClaimEvidenceStorage {

    private static final String BUCKET = "claim-evidences";
    private final String supabaseUrl;
    private final String secretKey;
    private final RestClient restClient = RestClient.create();

    public ClaimEvidenceStorage(@Value("${app.supabase.url:}") String supabaseUrl,
            @Value("${app.supabase.secret-key:}") String secretKey) {
        this.supabaseUrl = supabaseUrl;
        this.secretKey = secretKey;
    }

    public String upload(Long claimId, MultipartFile file) {
        if (supabaseUrl.isBlank() || secretKey.isBlank()) {
            throw new DomainException(ErrorCode.INTERNAL_ERROR, "클레임 증빙 저장소가 아직 설정되지 않았습니다.");
        }
        String objectKey = "claims/%d/%s".formatted(claimId, UUID.randomUUID());
        try {
            restClient.put()
                    .uri(supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + objectKey)
                    .header("Authorization", "Bearer " + secretKey)
                    .header("apikey", secretKey)
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .body(file.getBytes())
                    .retrieve()
                    .toBodilessEntity();
            return objectKey;
        } catch (IOException | RestClientException exception) {
            throw new DomainException(ErrorCode.INTERNAL_ERROR, "클레임 증빙 저장에 실패했습니다.");
        }
    }
}
