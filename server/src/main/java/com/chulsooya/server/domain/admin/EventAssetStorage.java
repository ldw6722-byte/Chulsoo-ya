package com.chulsooya.server.domain.admin;

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
import com.chulsooya.server.domain.catalog.EventAssetType;

@Component
public class EventAssetStorage {
    private static final String BUCKET = "event-assets";
    private final String supabaseUrl;
    private final String secretKey;
    private final RestClient restClient = RestClient.create();

    public EventAssetStorage(@Value("${app.supabase.url:}") String supabaseUrl,
            @Value("${app.supabase.secret-key:}") String secretKey) {
        this.supabaseUrl = supabaseUrl;
        this.secretKey = secretKey;
    }

    public String upload(EventAssetType type, MultipartFile file, String extension) {
        configured();
        String key = "admin/" + (type == EventAssetType.THEME ? "themes" : "icons") + "/" + UUID.randomUUID() + "." + extension;
        try {
            restClient.put().uri(supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + key)
                    .header("Authorization", "Bearer " + secretKey).header("apikey", secretKey)
                    .contentType(MediaType.parseMediaType(file.getContentType())).body(file.getBytes()).retrieve().toBodilessEntity();
            return key;
        } catch (IOException | RestClientException exception) {
            throw new DomainException(ErrorCode.INTERNAL_ERROR, "행사 자산 저장에 실패했습니다.");
        }
    }

    public void delete(String storageKey) {
        configured();
        try {
            restClient.delete().uri(supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + storageKey)
                    .header("Authorization", "Bearer " + secretKey).header("apikey", secretKey).retrieve().toBodilessEntity();
        } catch (RestClientException exception) {
            throw new DomainException(ErrorCode.INTERNAL_ERROR, "행사 자산 삭제에 실패했습니다.");
        }
    }

    public String publicUrl(String storageKey) { return supabaseUrl + "/storage/v1/object/public/" + BUCKET + "/" + storageKey; }
    private void configured() { if (supabaseUrl.isBlank() || secretKey.isBlank()) throw new DomainException(ErrorCode.INTERNAL_ERROR, "행사 자산 저장소가 아직 설정되지 않았습니다."); }
}
