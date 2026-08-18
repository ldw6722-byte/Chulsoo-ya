package com.chulsooya.server.domain.sellerapplication;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
public final class SellerApplicationDtos {
    private SellerApplicationDtos() {}
    public record SubmitRequest(@NotBlank String storeName, @NotBlank String representativeName,
            @NotBlank @Pattern(regexp = "^[0-9-]{10,12}$", message = "사업자등록번호 형식이 올바르지 않습니다.") String businessRegistrationNumber,
            LocalDate businessOpenedOn, @NotBlank String cityName, @NotBlank String districtName,
            @NotBlank String address, @NotBlank String phone, String handledItems) {}
    public record RejectRequest(@NotBlank String reason) {}
    public record ApplicantResponse(Long id, String storeName, String cityName, String districtName, String address, String phone,
            List<String> handledItems, String status, String ntsStatus, boolean certificateSubmitted, boolean bankAccountCopySubmitted,
            Instant submittedAt, Instant reviewedAt, String rejectionReason) {
        static ApplicantResponse from(SellerApplication application) {
            return new ApplicantResponse(application.getId(), application.getStoreName(), application.getCityName(), application.getDistrictName(),
                    application.getAddress(), application.getPhone(), splitItems(application.getHandledItems()), application.getStatus().name(),
                    application.getNtsStatus().name(), application.getCertificateObjectKey() != null, application.getBankAccountCopyObjectKey() != null,
                    application.getSubmittedAt(), application.getReviewedAt(), application.getRejectionReason());
        }
    }
    public record AdminResponse(Long id, Long applicantUserId, String applicantName, String applicantEmail, String applicantPhone,
            String storeName, String representativeName, String businessRegistrationNumber, String businessRegistrationNumberMasked,
            LocalDate businessOpenedOn, String cityName, String districtName, String address, String phone,
            List<String> handledItems, String status, String ntsStatus, String ntsMessage, boolean certificateSubmitted,
            boolean bankAccountCopySubmitted, Instant submittedAt, Long reviewedByUserId, Instant reviewedAt, String rejectionReason) {
        static AdminResponse from(SellerApplication application) {
            String number = application.getBusinessRegistrationNumber();
            String masked = number.length() <= 5 ? "*****" : number.substring(0, Math.min(5, number.length())) + "*****";
            return new AdminResponse(application.getId(), application.getApplicant().getId(), application.getApplicant().getName(),
                    application.getApplicant().getEmail(), application.getApplicant().getPhone() == null ? "미입력" : application.getApplicant().getPhone(), application.getStoreName(),
                    application.getRepresentativeName(), number, masked, application.getBusinessOpenedOn(), application.getCityName(),
                    application.getDistrictName(), application.getAddress(), application.getPhone(),
                    splitItems(application.getHandledItems()), application.getStatus().name(), application.getNtsStatus().name(), application.getNtsMessage(),
                    application.getCertificateObjectKey() != null, application.getBankAccountCopyObjectKey() != null, application.getSubmittedAt(),
                    application.getReviewedByUserId(), application.getReviewedAt(), application.getRejectionReason());
        }
    }
    public record DocumentResponse(String type, String label, boolean submitted, String contentType, Long sizeBytes, String signedUrl) {}
    public record AdminDocumentsResponse(Long applicationId, DocumentResponse businessLicense, DocumentResponse bankAccountCopy) {}
    private static List<String> splitItems(String handledItems) { return java.util.Arrays.stream(handledItems.split(",")).map(String::trim).filter(item -> !item.isBlank()).toList(); }
}
