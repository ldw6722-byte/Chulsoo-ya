package com.chulsooya.server.domain.sellerapplication;

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
public class SellerCertificateStorage {

    private static final String BUCKET = "seller-verification-documents";
    private final String supabaseUrl;
    private final String secretKey;
    private final RestClient restClient;

    public SellerCertificateStorage(@Value("${app.supabase.url:}") String supabaseUrl,
            @Value("${app.supabase.secret-key:}") String secretKey) {
        this.supabaseUrl = supabaseUrl;
        this.secretKey = secretKey;
        this.restClient = RestClient.create();
    }

    public String upload(Long applicationId, MultipartFile file) {
        if (supabaseUrl.isBlank() || secretKey.isBlank()) {
            throw new DomainException(ErrorCode.INTERNAL_ERROR, "증빙 저장소가 아직 설정되지 않았습니다.");
        }
        String objectKey = "seller-applications/%d/%s".formatted(applicationId, UUID.randomUUID());
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
            throw new DomainException(ErrorCode.INTERNAL_ERROR, "사업자등록증 저장에 실패했습니다.");
        }
    }
}
