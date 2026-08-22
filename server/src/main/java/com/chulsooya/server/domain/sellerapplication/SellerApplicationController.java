package com.chulsooya.server.domain.sellerapplication;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.sellerapplication.SellerApplicationDtos.ApplicantResponse;
import com.chulsooya.server.domain.sellerapplication.SellerApplicationDtos.SubmitRequest;
import com.chulsooya.server.support.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/seller-applications")
public class SellerApplicationController {

    private final SellerApplicationService applications;
    private final SellerApplicationDocumentService documents;

    public SellerApplicationController(SellerApplicationService applications, SellerApplicationDocumentService documents) {
        this.applications = applications;
        this.documents = documents;
    }

    @PostMapping
    public ApiResponse<ApplicantResponse> submit(CurrentUser actor, @Valid @RequestBody SubmitRequest request) {
        return ApiResponse.of(applications.submit(actor, request));
    }

    @PostMapping("/internal-admin")
    public ApiResponse<ApplicantResponse> submitInternalAdministratorApplication(CurrentUser actor) {
        return ApiResponse.of(applications.submitInternalAdministratorApplication(actor));
    }

    @GetMapping("/me")
    public ApiResponse<ApplicantResponse> mine(CurrentUser actor) {
        return ApiResponse.of(applications.mine(actor));
    }

    @PostMapping(path = "/{applicationId}/business-license", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ApplicantResponse> uploadCertificate(CurrentUser actor, @PathVariable Long applicationId,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.of(documents.upload(actor, applicationId, SellerApplicationDocumentType.BUSINESS_LICENSE, file));
    }
    @PostMapping(path = "/{applicationId}/bank-account-copy", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ApplicantResponse> uploadBankAccountCopy(CurrentUser actor, @PathVariable Long applicationId,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.of(documents.upload(actor, applicationId, SellerApplicationDocumentType.BANK_ACCOUNT_COPY, file));
    }
}
