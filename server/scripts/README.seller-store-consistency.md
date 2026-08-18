# 판매점 승인 데이터 정합성 점검

## 실행 파일

- `server/scripts/auditSellerStoreConsistency.mjs`
- `server/scripts/auditSellerStoreConsistency.test.mjs`

승인 완료된 판매자 신청을 기준으로 회원 역할과 등록 판매점 데이터를 대조한다. 점검은 읽기 전용 API만 호출하며 DB를 수정하지 않는다.

## 점검 규칙

| 코드 | 판정 |
| :--- | :--- |
| `APPLICANT_USER_NOT_FOUND` | 승인 신청의 회원 레코드가 없음 |
| `APPROVED_APPLICATION_USER_NOT_SELLER` | 승인 신청 회원의 역할이 판매자가 아님 |
| `APPROVED_APPLICATION_STORE_MISSING` | 승인 신청에 연결된 등록 판매점이 없음 |
| `APPROVED_APPLICATION_STORE_DUPLICATED` | 신청자 이메일에 등록 판매점이 둘 이상 있음 |
| `STORE_NAME_MISMATCH` | 신청서와 등록 판매점의 판매점명이 다름 |
| `CITY_MISMATCH`, `DISTRICT_MISMATCH` | 시·도 또는 구·군이 다름 |
| `ADDRESS_MISMATCH`, `PHONE_MISMATCH` | 사업장 주소 또는 연락처가 다름 |
| `HANDLED_ITEMS_MISMATCH` | 취급 품목이 다름 |
| `APPROVED_STORE_NOT_VERIFIED` | 판매자 역할은 활성인데 판매점이 승인 상태가 아님 |
| `SELLER_STORE_NOT_RECEIVING_ORDERS` | 판매자 역할은 활성이나 주문 수신이 꺼져 있음 |

## 실행

PowerShell에서 서버 API를 실행한 뒤 아래 환경 변수만 현재 터미널에 설정한다. 비밀번호는 스크립트나 저장소에 기록하지 않는다.

```powershell
Set-Location 'C:\Users\user\Desktop\chulsoo-ya\Chulsoo-ya\server'
$env:CHULSOO_AUDIT_ADMIN_EMAIL = '<관리자 이메일>'
$env:CHULSOO_AUDIT_ADMIN_PASSWORD = '<관리자 비밀번호>'
node scripts\auditSellerStoreConsistency.mjs
```

JSON 보고서가 필요하면 `--json`을 덧붙인다.

```powershell
node scripts\auditSellerStoreConsistency.mjs --json
```

기본 API 주소는 `http://localhost:8080`이다. 다른 주소를 점검할 때만 현재 터미널에 `CHULSOO_AUDIT_API_BASE_URL`을 설정한다.

## 종료 코드

| 종료 코드 | 의미 |
| :--- | :--- |
| `0` | 오류 없음. 경고만 있어도 점검은 완료됨 |
| `1` | 관리자 인증·API 호출 등 실행 실패 |
| `2` | 데이터 불일치 오류 발견 |

## 규칙 테스트

```powershell
node --test scripts\auditSellerStoreConsistency.test.mjs
```

정상 연결, 판매점명·취급 품목 불일치, 등록 판매점 누락을 각각 검증한다.
