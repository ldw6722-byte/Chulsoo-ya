package com.chulsooya.server.domain.sellerapplication;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

@Component
public class SellerCertificateStorage {
    private static final Logger log = LoggerFactory.getLogger(SellerCertificateStorage.class);
    private static final String BUCKET = "seller-verification-documents";
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final List<String> ALLOWED_MIME_TYPES = List.of(MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE);
    private final String supabaseUrl;
    private final String secretKey;
    private final RestClient restClient;

    @Autowired
    public SellerCertificateStorage(@Value("${app.supabase.url:}") String supabaseUrl,
            @Value("${app.supabase.secret-key:}") String secretKey) {
        this(supabaseUrl, secretKey, RestClient.create());
    }

    SellerCertificateStorage(String supabaseUrl, String secretKey, RestClient restClient) {
        this.supabaseUrl = supabaseUrl;
        this.secretKey = secretKey;
        this.restClient = restClient;
    }

    public String upload(Long applicationId, SellerApplicationDocumentType type, MultipartFile file) {
        requireConfigured();
        ensurePrivateBucket();
        String objectKey = "seller-applications/%d/%s/%s".formatted(applicationId, type.pathSegment(), UUID.randomUUID());
        try {
            restClient.put().uri(supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + objectKey)
                    .header("Authorization", "Bearer " + secretKey).header("apikey", secretKey)
                    .contentType(MediaType.parseMediaType(file.getContentType())).body(file.getBytes()).retrieve().toBodilessEntity();
            return objectKey;
        } catch (IOException | RestClientException exception) {
            log.warn("판매자 증빙 Storage 업로드 실패: type={}, file={}, reason={}", type, file.getOriginalFilename(), exception.getMessage());
            throw new DomainException(ErrorCode.INTERNAL_ERROR, type.label() + " 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }
    }

    public String signedUrl(String objectKey) {
        requireConfigured();
        try {
            SignedUrlPayload response = restClient.post().uri(supabaseUrl + "/storage/v1/object/sign/" + BUCKET + "/" + objectKey)
                    .header("Authorization", "Bearer " + secretKey).header("apikey", secretKey).contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("expiresIn", 600)).retrieve().body(SignedUrlPayload.class);
            if (response == null || response.signedUrl() == null || response.signedUrl().isBlank()) throw new IllegalStateException("서명 URL이 비어 있습니다.");
            return supabaseUrl + "/storage/v1" + response.signedUrl();
        } catch (RestClientException exception) {
            log.warn("판매자 증빙 Storage 서명 URL 생성 실패: reason={}", exception.getMessage());
            throw new DomainException(ErrorCode.INTERNAL_ERROR, "증빙 문서 URL 생성에 실패했습니다.");
        }
    }

    public void deleteQuietly(String objectKey) {
        if (objectKey == null || objectKey.isBlank() || supabaseUrl.isBlank() || secretKey.isBlank()) return;
        try {
            restClient.delete().uri(supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + objectKey)
                    .header("Authorization", "Bearer " + secretKey).header("apikey", secretKey).retrieve().toBodilessEntity();
        } catch (RestClientException exception) {
            log.warn("판매자 증빙 Storage 이전 파일 삭제 실패: reason={}", exception.getMessage());
        }
    }

    private void ensurePrivateBucket() {
        try {
            restClient.get().uri(supabaseUrl + "/storage/v1/bucket/" + BUCKET)
                    .header("Authorization", "Bearer " + secretKey).header("apikey", secretKey).retrieve().toBodilessEntity();
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 404) {
                createPrivateBucket();
                return;
            }
            bucketPreparationFailed(exception);
        } catch (RestClientException exception) {
            bucketPreparationFailed(exception);
        }
    }

    private void createPrivateBucket() {
        try {
            restClient.post().uri(supabaseUrl + "/storage/v1/bucket")
                    .header("Authorization", "Bearer " + secretKey).header("apikey", secretKey).contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("id", BUCKET, "name", BUCKET, "public", false, "file_size_limit", MAX_FILE_SIZE_BYTES, "allowed_mime_types", ALLOWED_MIME_TYPES))
                    .retrieve().toBodilessEntity();
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 409) return;
            bucketPreparationFailed(exception);
        } catch (RestClientException exception) {
            bucketPreparationFailed(exception);
        }
    }

    private void bucketPreparationFailed(Exception exception) {
        String status = exception instanceof RestClientResponseException responseException ? String.valueOf(responseException.getStatusCode().value()) : "no-http-response";
        log.warn("판매자 증빙 Storage 버킷 준비 실패: status={}, reason={}", status, exception.getMessage());
        throw new DomainException(ErrorCode.INTERNAL_ERROR, "증빙 저장소를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }

    private void requireConfigured() {
        if (supabaseUrl.isBlank() || secretKey.isBlank()) throw new DomainException(ErrorCode.INTERNAL_ERROR, "증빙 저장소가 아직 설정되지 않았습니다.");
    }

    private record SignedUrlPayload(@JsonProperty("signedURL") String signedUrl) {
    }
}
