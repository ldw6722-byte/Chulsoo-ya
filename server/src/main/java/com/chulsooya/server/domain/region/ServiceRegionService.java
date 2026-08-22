package com.chulsooya.server.domain.region;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

@Service
@Transactional(readOnly = true)
public class ServiceRegionService {
    public record RegionView(String code, String cityName, String districtName, String displayName) {
        static RegionView from(ServiceRegion region) {
            return new RegionView(region.getCode(), region.getCityName(), region.getDistrictName(), region.getDisplayName());
        }
    }

    private final ServiceRegionRepository regions;

    public ServiceRegionService(ServiceRegionRepository regions) {
        this.regions = regions;
    }

    public List<RegionView> list() {
        return regions.findAllByActiveTrueOrderByCityNameAscDistrictNameAsc().stream().map(RegionView::from).toList();
    }

    public RegionView resolveAddress(String address) {
        if (address == null || address.isBlank()) throw new DomainException(ErrorCode.ADDRESS_REQUIRED);
        String normalized = normalize(address);
        return regions.findAllByActiveTrueOrderByCityNameAscDistrictNameAsc().stream()
                .filter(region -> normalized.contains(normalize(region.getCityName()))
                        && normalized.contains(normalize(region.getDistrictName())))
                .max(Comparator.comparingInt(region -> region.getDisplayName().length()))
                .map(RegionView::from)
                .orElseThrow(() -> new DomainException(ErrorCode.GU_CODE_UNRESOLVED,
                        "카카오 주소에서 서비스 지역을 확인하지 못했습니다. 주소·장소명 찾기로 다시 선택해 주세요."));
    }

    public RegionView requireActive(String code) {
        if (code == null || code.isBlank()) throw new DomainException(ErrorCode.GU_CODE_UNRESOLVED);
        return regions.findByCodeAndActiveTrue(code.trim())
                .map(RegionView::from)
                .orElseThrow(() -> new DomainException(ErrorCode.GU_CODE_UNRESOLVED,
                        "선택한 지역은 현재 판매점 등록 서비스 지역이 아닙니다."));
    }

    private String normalize(String value) {
        return value.replace("서울특별시", "서울").replaceAll("\\s+", "").trim();
    }
}
