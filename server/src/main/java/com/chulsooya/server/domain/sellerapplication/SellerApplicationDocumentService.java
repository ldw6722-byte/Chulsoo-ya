package com.chulsooya.server.domain.sellerapplication;
import static com.chulsooya.server.domain.sellerapplication.SellerApplicationDtos.ApplicantResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.support.CurrentUser;
@Service
@Transactional(readOnly = true)
public class SellerApplicationDocumentService {
    private final SellerApplicationRepository applications;
    private final StoreRepository stores;
    private final SellerCertificateStorage storage;
    private final SellerCertificateValidator validator = new SellerCertificateValidator();
    public SellerApplicationDocumentService(SellerApplicationRepository applications, StoreRepository stores, SellerCertificateStorage storage) { this.applications=applications; this.stores=stores; this.storage=storage; }
    @Transactional
    public ApplicantResponse upload(CurrentUser actor, Long applicationId, SellerApplicationDocumentType type, MultipartFile file) {
        SellerApplication application = applications.findByIdForUpdate(applicationId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매자 신청을 찾을 수 없습니다."));
        if (!application.getApplicant().getId().equals(actor.userId())) throw new DomainException(ErrorCode.FORBIDDEN, "본인의 판매자 신청에만 증빙을 제출할 수 있습니다.");
        try { validator.validate(file); } catch (IllegalArgumentException exception) { throw new DomainException(ErrorCode.VALIDATION_FAILED, exception.getMessage()); }
        String previous = type == SellerApplicationDocumentType.BUSINESS_LICENSE ? application.getCertificateObjectKey() : application.getBankAccountCopyObjectKey();
        String objectKey = storage.upload(applicationId, type, file);
        if (type == SellerApplicationDocumentType.BUSINESS_LICENSE) application.markCertificateUploaded(objectKey, file.getContentType(), file.getSize()); else application.markBankAccountCopyUploaded(objectKey, file.getContentType(), file.getSize());
        storage.deleteQuietly(previous);
        return ApplicantResponse.from(application);
    }
    public SellerApplicationDtos.AdminDocumentsResponse adminDocuments(CurrentUser actor, Long applicationId) { requireAdmin(actor); return documents(applications.findById(applicationId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매자 신청을 찾을 수 없습니다."))); }
    public SellerApplicationDtos.AdminDocumentsResponse adminDocumentsForStore(CurrentUser actor, Long storeId) { requireAdmin(actor); Store store = stores.findById(storeId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매점을 찾을 수 없습니다.")); SellerApplication application = applications.findByApplicantId(store.getOwner().getId()).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매자 신청 증빙을 찾을 수 없습니다.")); return documents(application); }
    private SellerApplicationDtos.AdminDocumentsResponse documents(SellerApplication application) { return new SellerApplicationDtos.AdminDocumentsResponse(application.getId(), document(SellerApplicationDocumentType.BUSINESS_LICENSE, application.getCertificateObjectKey(), application.getCertificateContentType(), application.getCertificateSizeBytes()), document(SellerApplicationDocumentType.BANK_ACCOUNT_COPY, application.getBankAccountCopyObjectKey(), application.getBankAccountCopyContentType(), application.getBankAccountCopySizeBytes())); }
    private SellerApplicationDtos.DocumentResponse document(SellerApplicationDocumentType type, String key, String contentType, Long size) { return new SellerApplicationDtos.DocumentResponse(type.name(), type.label(), key != null, contentType, size, key == null ? null : storage.signedUrl(key)); }
    private void requireAdmin(CurrentUser actor) { if (!actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다."); }
}
