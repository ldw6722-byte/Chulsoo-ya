package com.chulsooya.server.domain.sellerapplication;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    private final RestClient restClient = RestClient.create();
    public SellerCertificateStorage(@Value("${app.supabase.url:}") String supabaseUrl, @Value("${app.supabase.secret-key:}") String secretKey) { this.supabaseUrl=supabaseUrl; this.secretKey=secretKey; }
    public String upload(Long applicationId, SellerApplicationDocumentType type, MultipartFile file) {
        requireConfigured();
        String objectKey = "seller-applications/%d/%s/%s".formatted(applicationId, type.pathSegment(), UUID.randomUUID());
        try {
            restClient.put().uri(supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + objectKey).header("Authorization", "Bearer " + secretKey).header("apikey", secretKey).contentType(MediaType.parseMediaType(file.getContentType())).body(file.getBytes()).retrieve().toBodilessEntity();
            return objectKey;
        } catch (IOException | RestClientException exception) { throw new DomainException(ErrorCode.INTERNAL_ERROR, type.label() + " 저장에 실패했습니다."); }
    }
    public String signedUrl(String objectKey) {
        requireConfigured();
        try {
            SignedUrlPayload response = restClient.post().uri(supabaseUrl + "/storage/v1/object/sign/" + BUCKET + "/" + objectKey).header("Authorization", "Bearer " + secretKey).header("apikey", secretKey).contentType(MediaType.APPLICATION_JSON).body(Map.of("expiresIn", 600)).retrieve().body(SignedUrlPayload.class);
            if (response == null || response.signedUrl() == null || response.signedUrl().isBlank()) throw new IllegalStateException("서명 URL이 비어 있습니다.");
            return supabaseUrl + "/storage/v1" + response.signedUrl();
        } catch (RestClientException exception) { throw new DomainException(ErrorCode.INTERNAL_ERROR, "증빙 문서 URL 생성에 실패했습니다."); }
    }
    public void deleteQuietly(String objectKey) { if (objectKey == null || objectKey.isBlank() || supabaseUrl.isBlank() || secretKey.isBlank()) return; try { restClient.delete().uri(supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + objectKey).header("Authorization", "Bearer " + secretKey).header("apikey", secretKey).retrieve().toBodilessEntity(); } catch (RestClientException ignored) {} }
    private void requireConfigured() { if (supabaseUrl.isBlank() || secretKey.isBlank()) throw new DomainException(ErrorCode.INTERNAL_ERROR, "증빙 저장소가 아직 설정되지 않았습니다."); }
    private record SignedUrlPayload(@JsonProperty("signedURL") String signedUrl) {}
}
