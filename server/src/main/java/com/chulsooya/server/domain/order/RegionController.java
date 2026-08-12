package com.chulsooya.server.domain.order;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

/**
 * 주소 -> gu_code 정규화.
 * ponytail: 주소 문자열에서 '○○구/시/군'을 추출하는 로컬 파서.
 * upgrade path: 카카오 로컬 API(주소 검색) 호출로 교체하고 region_2depth_name 을 사용한다.
 */
@RestController
@RequestMapping("/api/regions")
public class RegionController {

	public record ResolveResponse(String guCode, String guName, String normalizedAddress) {
	}

	private static final Pattern GU_PATTERN = Pattern.compile("([가-힣]+[구군])|([가-힣]+시)");

	@GetMapping("/resolve")
	public ApiResponse<ResolveResponse> resolve(@RequestParam String address) {
		if (address == null || address.isBlank()) {
			throw new DomainException(ErrorCode.ADDRESS_REQUIRED);
		}
		Matcher matcher = GU_PATTERN.matcher(address);
		String guName = null;
		while (matcher.find()) {
			String candidate = matcher.group();
			if (candidate.endsWith("구") || candidate.endsWith("군")) {
				guName = candidate;
				break;
			}
			if (guName == null) {
				guName = candidate;
			}
		}
		if (guName == null) {
			throw new DomainException(ErrorCode.GU_CODE_UNRESOLVED);
		}
		return ApiResponse.of(new ResolveResponse(toCode(guName), guName, address.trim()));
	}

	/** 자주 쓰는 예시 주소. 개발 및 데모용. */
	@GetMapping("/samples")
	public ApiResponse<List<String>> samples() {
		return ApiResponse.of(List.of(
				"서울특별시 강남구 테헤란로 123",
				"서울특별시 마포구 양화로 45",
				"경기도 성남시 분당구 판교역로 22"));
	}

	private String toCode(String guName) {
		return "GU_" + Integer.toHexString(guName.hashCode() & 0xFFFF).toUpperCase();
	}
}
