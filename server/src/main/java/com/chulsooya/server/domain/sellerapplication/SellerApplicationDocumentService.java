package com.chulsooya.server.domain.sellerapplication;

import static com.chulsooya.server.domain.sellerapplication.SellerApplicationDtos.ApplicantResponse;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class SellerApplicationDocumentService {

    private final SellerApplicationRepository applications;
    private final SellerCertificateStorage storage;
    private final SellerCertificateValidator validator = new SellerCertificateValidator();

    public SellerApplicationDocumentService(SellerApplicationRepository applications, SellerCertificateStorage storage) {
        this.applications = applications;
        this.storage = storage;
    }

    @Transactional
    public ApplicantResponse uploadCertificate(CurrentUser actor, Long applicationId, MultipartFile file) {
        SellerApplication application = applications.findByIdForUpdate(applicationId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매자 신청을 찾을 수 없습니다."));
        if (!application.getApplicant().getId().equals(actor.userId())) {
            throw new DomainException(ErrorCode.FORBIDDEN, "본인의 판매자 신청에만 증빙을 제출할 수 있습니다.");
        }
        try {
            validator.validate(file);
        } catch (IllegalArgumentException exception) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, exception.getMessage());
        }
        String objectKey = storage.upload(application.getId(), file);
        application.markCertificateUploaded(objectKey, file.getContentType(), file.getSize());
        return ApplicantResponse.from(application);
    }
}
