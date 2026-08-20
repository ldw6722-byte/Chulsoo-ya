# PROJECT_MAP.md — 구조 지도

인덱싱 제외: `node_modules/`, `.gradle/`, `build/`, `dist/`, `.idea/`

## 1. 루트

| 경로 | 역할 |
| :--- | :--- |
| `AGENTS.md` | 에이전트 작업 규약 (최우선 규칙) |
| `PROGRESS.md` | 단계별 진행 상태 및 세션 핸드오프 |
| `PROJECT_MAP.md` | 이 파일. 파일 위치 지도 |
| `README.ko.md` / `README.md` | 제품 사양 원본 (제품 규칙, 상태 머신, 스키마) |
| `architecture.png` | 시스템 아키텍처 도식 |
| `docs/FEATURE_GAP_AUDIT.md` | 기획 문서와 현재 구현의 역할·API·DB 기능 갭 감사 및 구현 순서 |
| `docs/SELLER_ONBOARDING_CONTRACT.md` | 판매자 사업자 검증·증빙·관리자 심사의 V7 DB·REST·TDD 계약 |
| `docs/PAYMENT_REFUND_CONTRACT.md` | 결제 취소·전액/부분 환불·멱등성·권한·감사 이력 계약 |
| `docs/CLAIM_CONTRACT.md` | 클레임·증빙·정산 HOLD·교환·부분 교체·문서 생성 계약 |
| `docs/COUPON_CONTRACT.md` | 무상 쿠폰 발행·사용·취소 복구·만료·감사 이력 계약 |

| `client/` | 프론트엔드 (Vite + React 19 + TS) |
| `server/` | 백엔드 (Spring Boot 4.x + Java 25, Gradle) |

## 2. 프론트엔드 지도 (`client/`)

| 경로 | 역할 |
| :--- | :--- |
| `index.html` | Vite 엔트리 HTML |
| `package.json` | 스크립트: `dev`, `build`, `lint`, `preview` |
| `vite.config.ts` | Vite 설정, `/api` 프록시 및 Tailwind Vite 플러그인 정의 위치 |
| `tsconfig.app.json` | 앱 TS 설정, path alias 정의 위치 |
| `.oxlintrc.json` | 린터 설정 |
| `src/main.tsx` | React 루트 마운트 |
| `src/app/` | 라우터, 역할 가드, IdentityProvider, Supabase AuthProvider |
| `src/api/client.ts` | **Axios 인스턴스 (유일한 HTTP 진입점)** |
| `src/api/*.ts` | 도메인별 REST 함수 (catalog, cart, orders, bids, seller, admin) |
| `src/types/` | 서버 계약 타입 |
| `src/lib/supabase.ts` | Supabase JS 인증 클라이언트 및 Email·OAuth 호출 |
| `src/lib/auth-session.ts` | Axios Bearer access token 메모리 저장소 |
| `src/features/auth/` | Kordeal식 중앙 카드형 로그인·회원가입·OAuth callback 화면 |
| `src/components/shop/` | Kordeal 이식 공통 상점 헤더·푸터·공구 상품 카드 |
| `src/features/my/` | 프로필·주문·매칭 요약 마이페이지 |
| `src/styles/tokens.css` / `src/styles/global.css` | 기존 토큰과 Tailwind 기반 Kordeal 이식 테마 |
| `src/features/catalog/` | Kordeal식 홈·3단 카테고리 탐색·검색·상품 상세 |
| `src/components/shop/ShopHeader.tsx` | 3열 hover 메가 메뉴 및 자동완성 검색 |
| `src/components/shop/ToolProductCard.tsx` | 할인·브랜드·평점·빠른 매칭 배지 판매 카드 |
| `src/features/cart/` | 장바구니 |
| `src/features/checkout/` | 주소·구매자 정보·무상 쿠폰 선택·매칭 요청·결제 |

| `src/features/matching/` | 매칭 대기, 판매자 확인 대기 |
| `src/features/orders/` | 주문 추적, 취소·환불, 반품·교환·부분 교체 접수 |

| `src/features/seller/` | 가용 슬롯, 제안 큐, 물품 확인, 이행, 클레임 처리, 지표 |
| `src/features/seller/SellerApplicationPage.tsx` | 일반 회원의 판매자 신청·사업자등록증 제출·심사 상태 화면 |

| `src/features/admin/` | 카탈로그·판매자·매칭·쿠폰 발행·클레임 중재·결제 환불 운영 |

| `src/hooks/useServerCountdown.ts` | 서버 마감 시각 기준 카운트다운 |

## 3. 백엔드 지도 (`server/`)

| 경로 | 역할 |
| :--- | :--- |
| `build.gradle` | 의존성 (JPA, Security, Validation, WebSocket, Lombok) |
| `src/main/resources/application.yaml` | local/supabase 프로파일·DB·JWKS 보안 설정 |
| `src/main/resources/db/supabase/` | PostgreSQL V1 초기 스키마, V2 인증 식별자, V3 계층형 카테고리·판매 메타데이터 마이그레이션 |
| `src/main/java/com/chulsooya/server/domain/catalog/CategoryTreeAssembler.java` | 3단 메뉴 트리 조립 |
| `src/main/java/com/chulsooya/server/support/DevSeedRunner.java` | 로컬·Supabase 안전 카테고리/상품 시드 (`app.seed.users=false` 지원) |
| `src/main/java/com/chulsooya/server/support/BulkCatalogSeedRunner.java` | 주문 이력 보호 조건의 1,600개 초기 상품 시드 |
| `src/main/resources/seed/hardware-products-1600.json` | 32개 소분류당 50개 상품의 이미지 미포함 초기 카탈로그 |
| `src/main/resources/db/supabase/V7__seller_applications.sql` | 판매자 신청·사업자등록증 메타데이터·관리자 심사 비파괴 마이그레이션 |
| `src/main/resources/db/supabase/V8__penalties.sql` | 확인 만료 패널티·신뢰점수·응찰 제한 감사 이력 |
| `src/main/resources/db/supabase/V9__dispatch_cursors.sql` | 지역·등급별 판매자 라운드 로빈 배분 커서 |
| `src/main/resources/db/supabase/V10__refunds.sql` | 결제 취소·전액/부분 환불 감사 이력과 멱등성 |
| `src/main/resources/db/supabase/V11__claims_and_settlements.sql` | 클레임·증빙·정산 HOLD·불변 이벤트 |
| `src/main/resources/db/supabase/V12__coupons.sql` | 무상 쿠폰 정책·사용자 발행본·감사 이력·주문 연결 |

| `src/main/java/com/Chulsoo_ya/server/ServerApplication.java` | 부트 엔트리 |
| `.../common/` | 공통 응답 래퍼, 예외, 시간 제공자 |
| `.../domain/auth/` | Supabase JWT 사용자 동기화 및 `/api/auth/me` |
| `.../domain/catalog/` | 카테고리·상품 |
| `.../domain/cart/` | 장바구니 |
| `.../domain/order/` | 주문, 결제, 취소·전액/부분 환불, 환불 감사 이력, 상태 머신 |

| `.../domain/matching/` | 제안(Match_Offer), 응찰(Bid), 낙찰 트랜잭션, 라운드 로빈 커서 |
| `.../domain/penalty/` | 판매자 확인 만료 패널티·신뢰점수·제한 감사 이력 |

| `.../domain/store/` | 판매자 매장, 슬롯 회계, 슬롯 변경 로그 |
| `.../domain/sellerapplication/` | 판매자 신청, 증빙 검증·비공개 Storage, 관리자 승인·반려 |

| `.../domain/payment/` | 결제·환불 |
| `.../domain/claim/` | 클레임·증빙·정산 HOLD·역할별 알림·결정적 처리 확인서 |
| `.../domain/coupon/` | 무상 쿠폰 정책·회원 발행·서버 할인·취소 복구·감사 이력 |

| `.../infra/` | Kakao / Toss / NTS / Storage 어댑터 |
| `.../scheduler/` | 마감 집행 및 정합성 배치 |
| `src/test/java/...` | 단위·통합 테스트 |

## 4. 자주 찾는 위치

| 찾는 것 | 위치 |
| :--- | :--- |
| API 베이스 URL / 인터셉터 | `client/src/api/client.ts` |
| 라우트 정의 | `client/src/app/router.tsx` |
| 공통 상점 UI (헤더/푸터/상품 카드) | `client/src/components/shop/` |
| Kordeal식 상품 상세 라우트 | `client/src/app/router.tsx`의 `/product/:productId` → `features/catalog/ProductDetailPage.tsx` |
| 마이페이지 | `client/src/features/my/MyPage.tsx` |
| 색상·간격 토큰·Kordeal 테마 | `client/src/styles/tokens.css`, `client/src/styles/global.css` |
| 철물 3단 분류 근거 | `docs/HARDWARE_CATEGORY_RESEARCH.md` |
| 카테고리·상품 스키마/REST 계약 | `docs/CATEGORY_CATALOG_SCHEMA.md` |
| 주문 상태 enum | `server/.../domain/order/OrderStatus.java` + `client/src/types/order.ts` |
| Supabase 인증 화면·세션 | `client/src/features/auth/`, `client/src/app/AuthProvider.tsx` |
| Supabase JWT 검증 | `server/.../config/SupabaseSecurityConfig.java` |
| 인증 사용자 동기화 | `server/.../domain/auth/AuthUserService.java` |
| 낙찰 동시성 로직 | `server/.../domain/matching/BidService.java` |
| 슬롯 회계 로직 | `server/.../domain/store/SlotService.java` |
| 마감 스케줄러 | `server/.../scheduler/` |

> 파일을 생성·이동할 때마다 이 표를 즉시 갱신한다.

## 6. Store directory additions (2026-08-13)
| Path | Role |
| :--- | :--- |
| client/src/features/stores/StoreFinder.tsx | Home preview and full city/district store directory |
| client/src/features/admin/StoreManagementPanel.tsx | Admin store CRUD for image, handled items, rating, and status |
| server/.../domain/store/StoreDirectoryService.java | Public regional discovery and ADMIN store CRUD |
| server/.../domain/store/StoreDirectoryController.java | GET /api/stores and /api/stores/regions |
| server/.../domain/store/AdminStoreController.java | ADMIN CRUD /api/admin/stores |
| server/src/main/resources/db/supabase/V4__store_directory_profiles.sql | Store directory profile migration and index |

## 배송지 관리 구조 (2026-08-17)
| 경로 | 역할 |
| :--- | :--- |
| client/src/features/my/AddressManagementPanel.tsx | 마이철수 기본 주소지·현장 배송지 CRUD 및 서울 구 선택 UI |
| client/src/features/checkout/CheckoutPage.tsx | 저장 배송지·기본 주소지 선택 후 매칭 지역 자동 확인 |
| client/src/api/endpoints.ts | deliveryAddressApi Axios REST 계약 |
| client/src/types/api.ts | DeliveryAddress, DeliveryAddressRequest 타입 |
| server/.../domain/address/ | 배송지 엔티티·저장소·서비스·컨트롤러·DTO, 본인 소유권 검증 |
| server/src/main/resources/db/supabase/V23__delivery_addresses.sql | 배송지 테이블·기본 배송지 유니크 인덱스 |

## 마이철수 주문·배송지 탭 구조 (2026-08-17)
| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/my/MyPage.tsx` | 로그인 후 전용 마이철수, 주문 지표·장바구니 현황·주문하기 동선 |
| `client/src/features/my/DeliveryAddressPage.tsx` | 배송지 관리 전용 탭, AddressManagementPanel 재사용 |
| `client/src/app/router.tsx` | 인증 가드가 적용된 `/my`, `/my/delivery-addresses` 라우트 |

## 회원정보·관리자 회원관리 구조 (2026-08-17)
| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/my/MemberProfilePage.tsx` | 마이철수 회원정보 조회·수정 UI |
| `client/src/features/admin/UserManagementPanel.tsx` | 구매자·판매자 프로필 검색·역할 필터·판매자 역할 전환 |
| `client/src/api/endpoints.ts` | `userApi.mine`, `userApi.updateMine`, `adminUserApi` Axios REST 계약 |
| `server/.../domain/user/UserController.java` | `/api/users/me` 본인 회원정보 조회·수정 |
| `server/.../domain/user/AdminUserController.java` | `/api/admin/users` 관리자 회원 목록·역할 전환 |

## 기본 주소지·추가 배송지 구조 (2026-08-17)
| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/my/MemberProfilePage.tsx` | 회원정보와 기본 주소지 생성·수정 UI |
| `client/src/features/my/AddressManagementPanel.tsx` | 현장·수령지 전용 목록 및 하단 추가하기·수정·삭제 UI |
| `client/src/features/checkout/CheckoutPage.tsx` | 저장된 기본·추가 배송지 선택 후 매칭 지역 반영 |

## 회원정보 행 단위 화면 구조 (2026-08-17)
| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/my/MemberProfilePage.tsx` | 이메일·이름·휴대전화·계정 보안·기본 배송지·추가 배송지를 행 단위로 보여주는 회원정보 수정 화면 |

## 배송지 선택·주문 요청 구조 (2026-08-17)
| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/my/AddressManagementPanel.tsx` | 기본·추가 배송지 목록, 주문에 사용 라디오 선택, 추가 배송지 CRUD |
| `client/src/features/my/MemberProfilePage.tsx` | 회원정보 기본 주소지의 기존 기본 선택 상태 보존 |
| `client/src/features/checkout/CheckoutPage.tsx` | 기본 배송지 자동 적용, 저장 배송지 변경과 매칭 지역 재확인 |

## 결제수단 관리 구조 (2026-08-17)
| 경로 | 역할 |
| :--- | :--- |
| `server/src/main/resources/db/supabase/V24__payment_methods.sql` | 사용자별 결제수단 메타데이터·마지막 네 자리 전용 테이블 |
| `server/src/main/java/com/chulsooya/server/domain/paymentmethod/` | 결제수단 엔티티·마스킹·본인 소유 API |
| `client/src/features/my/PaymentMethodsPage.tsx` | 결제수단 목록과 계좌·카드 단계형 팝업 |
| `client/src/api/endpoints.ts` | `paymentMethodApi` Axios REST 계약 |

## 전역 테마 구조 (2026-08-17)
| 경로 | 역할 |
| :--- | :--- |
| `client/src/app/ThemeContext.tsx` | localStorage 기반 테마 상태와 HTML dark 클래스 적용 |
| `client/src/app/useTheme.ts` | 전역 테마 상태 접근 훅 |
| `client/src/components/ThemeToggle.tsx` | 사용자·관리자 공통 아이콘 토글 |
| `client/src/styles/tokens.css` | 다크모드 전역 디자인 토큰 |
| `client/src/styles/global.css` | 관리자 레거시 패널 다크 대비 보정 |

## 개발 결제 승인 구조 (2026-08-17)
| 경로 | 역할 |
| :--- | :--- |
| `server/.../order/DevelopmentPaymentApprovalService.java` | 관리자 전용 결제 대기 목록·개발 승인 상태 전환 |
| `server/.../admin/AdminPaymentController.java` | 개발 결제 대기 조회·승인 REST API |
| `server/.../order/OrderRepository.java` | PAYMENT_PENDING 상태 정렬 조회 |
| `client/src/features/admin/DevelopmentPaymentApprovalPanel.tsx` | 관리자 왼쪽 메뉴 전용 승인 탭 |
| `client/src/api/endpoints.ts` | `adminPaymentApi.developmentPending/developmentApprove` 계약 |
| `pg_integration_official_findings.md` | PG 결제창·승인 API·웹훅 공식 확인 기록 |

## 2026-08-17 — 개발 결제 승인 히스토리 및 실제 강남 매칭 검증

- 관리자 `개발 결제 승인` 탭 하단에 `승인 및 처리 상태 히스토리`를 추가했다. 개발 결제 승인 완료 건은 결제 승인 시각, 결제 상태, 현재 주문 처리 상태, 판매점, 주문 금액을 표시한다.
- `GET /api/admin/payments/development-history`는 `DEVELOPMENT_ADMIN_APPROVAL` 결제 기록만 역시간순으로 반환하며 관리자만 접근할 수 있다.
- 구매자 01의 기본 배송지가 동대문구였던 상태를 확인하고, 실제 매칭 검증을 위해 강남구 테헤란로 123으로 수정했다. 지역 확인 결과와 판매자 04 역할 계정(`test.seller01@chulsooya.dev`)의 판매점 구 코드가 `GU_C99`로 일치했다.
- 판매점 `테스트 강남 철물점`은 검증 완료, 주문 수신 가능, 가용 슬롯 3개임을 확인했다. 구매자 주문 요청 → 판매자 응찰 → 판매자 재고 확인으로 주문 #9를 `PAYMENT_PENDING`까지 이동했다.
- 슈퍼어드민이 관리자 화면에서 주문 #9를 직접 개발 결제 승인했다. 구매자·판매자 주문 상태는 `PREPARING`, 결제 기록은 `PAID`, 개발 승인 대기 목록에서는 제거됨을 실제 API로 검증했다.
- 검증: `npm run lint` 경고 0건, `npx tsc -b`, `npm run build`, `gradlew test` 통과.


## 정산·환불 및 결제 승인 히스토리

| 경로 | 역할 |
|---|---|
| `server/src/main/java/com/chulsooya/server/domain/claim/Settlement.java` | 주문별 정산 원장. 승인 금액·수수료율·수수료·환불·판매자 정산 예정액·상태를 보관한다. |
| `server/src/main/java/com/chulsooya/server/domain/claim/SettlementService.java` | 개발 수수료 계산, 결제 승인 이력 보완, 환불 재계산, 정산 목록·요약 응답을 제공한다. |
| `server/src/main/java/com/chulsooya/server/domain/order/DevelopmentPaymentApprovalService.java` | 슈퍼어드민 개발 결제 승인 시 결제 기록과 정산 원장을 함께 생성한다. |
| `server/src/main/java/com/chulsooya/server/domain/order/PaymentRefundService.java` | 개발용 관리자 환불·클레임 환불 후 정산 원장을 즉시 반영한다. |
| `server/src/main/java/com/chulsooya/server/domain/admin/AdminPaymentController.java` | 관리자 정산 목록·요약·환불 API를 제공한다. |
| `server/src/main/resources/db/supabase/V25__settlement_commission_amounts.sql` | 정산 수수료·환불·판매자 정산 예정액 컬럼 마이그레이션. |
| `client/src/features/admin/PaymentManagementPanel.tsx` | 결제 승인 히스토리 기반 정산 요약, 판매자 정산 표, 부분·전액 환불 UI. |
| `client/src/api/endpoints.ts`, `client/src/types/api.ts` | 관리자 정산 목록·요약 REST API 계약과 타입. |


## 판매자 신청 증빙 문서 업로드 (V26 완료)

판매자 신청에 **사업자등록증**과 **통장사본**을 각각 필수 이미지 증빙으로 추가했다. 전용 Supabase Storage 버킷 seller-verification-documents는 비공개로 생성됐고, JPG/PNG만 허용하며 파일별 최대 5MB로 제한한다.

서버·클라이언트는 100KB 이상 5MB 이하, JPG/PNG, 짧은 변 800px 이상, 긴 변 6000px 이하를 검증한다. 서버는 파일 서명, 실제 이미지 디코딩, 해상도를 재검증한다. 객체 키는 seller-applications/{applicationId}/{documentType}/{uuid} 형식이며 DB에는 공개 URL이 아니라 object key·content type·size만 저장된다. 관리자가 조회할 때만 10분 서명 URL을 생성한다.

V26 마이그레이션은 seller_applications에 통장사본 object key·content type·size 필드를 추가했다. 관리자 승인은 사업자등록증과 통장사본이 모두 제출돼야 가능하다. 판매자 신청 화면은 드래그앤드롭과 파일 찾기를 모두 제공하며, 관리자 판매자 신청 심사와 판매자 운영 상세에서 비공개 문서를 미리보기로 검토한다.

실제 검증에서는 테스트 구매자 02의 신청 ID 1에 두 문서를 각각 1,921,453 bytes PNG로 업로드했고, 일반 관리자 서명 URL 두 건의 이미지 응답을 확인했다. 신청은 승인하지 않고 PENDING 상태로 유지했다. 프론트엔드 lint 0건·TS 빌드·Vite build와 서버 전체 Gradle 테스트도 통과했으며, 최신 서버는 V26 적용 JAR로 8080에서 실행 중이다.


### 판매자 신청 폼 내 단일 문서 제출 동선 보정

판매자 신청 화면에 사업자등록증과 통장사본 선택 영역을 기본 정보 입력 영역 아래에 직접 배치했다. 사용자는 드래그앤드롭 또는 파일 찾기로 두 문서를 선택한 뒤 판매자 신청 접수 버튼 한 번으로 신청 DB 저장과 두 비공개 스토리지 업로드를 순차 실행한다. 두 문서 중 하나라도 없거나 이미지 기준을 충족하지 않으면 신청 전에 안내한다. 신청 저장 후 일부 업로드가 실패하면 신청 상태 화면에서 재시도할 수 있도록 유지한다.

## 판매점·공구 이미지 자산 및 DB 연결 (2026-08-17)

- 판매점 카드용 철물점 외관 이미지 20개와 대·중분류 대표 공구 이미지 20개를 생성했다. 이미지에는 테스트 문구·워터마크·로고를 포함하지 않았다.
- 정적 자산 경로는 client/public/assets/generated/stores/ 및 client/public/assets/generated/tools/ 이며, Vite 프로덕션 빌드에도 같은 경로로 복사된다.
- 저용량 최적화: 판매점 이미지는 640×480 JPEG, 공구 이미지는 640×640 JPEG로 최적화했다. 총 용량은 1,629,876바이트이며 파일별 최대 크기는 56,916바이트다.
- DB는 이미지 바이너리를 저장하지 않고 정적 URL만 저장한다. 등록 판매점 106곳에 판매점 이미지 20종을 순환 적용했고, 상품 1,000개와 관련 대·중분류 48개에 공구 이미지 20종을 카테고리별로 적용했다.
- 실제 Supabase 조회로 판매점 106/106, 상품 1,000/1,000의 생성 이미지 URL 연결을 확인했다.
- 프론트엔드 lint·TypeScript·프로덕션 빌드는 통과했다. 이 작업은 백엔드 소스 변경이 없는 정적 자산·DB URL 반영이며, 전체 Gradle 테스트는 출력 없이 장시간 대기해 중지했다.

## 카탈로그 이미지 Supabase Storage 전환 (2026-08-17)

- 공개 Storage 버킷 catalog-images를 생성하고 최적화된 판매점 외관 20개, 공구 카테고리 이미지 20개를 업로드했다. 버킷에는 JPEG만 허용하고 파일 크기 상한은 1MB로 설정했다.
- 공개 경로는 https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/catalog-images/stores/ 및 tools/ 이다.
- DB는 정적 로컬 경로 대신 Storage 공개 URL을 참조한다. stores.image_url 106/106, products.image_url 및 image_urls 1,000/1,000, categories.image_url 56개가 Storage URL로 전환됐다.
- 대표 파일 stores/store-01.jpg 공개 URL은 HTTP 200, image/jpeg, 47,996바이트로 검증했다.
- 로컬 client/public/assets/generated 자산은 개발·빌드용 복사본으로 남아 있으나, 운영 데이터의 이미지 참조는 Supabase Storage URL을 사용한다.

## 행사 테마·철물점 아이콘 확장 (2026-08-17)

- 행사 히어로 배경용 고해상도 테마 20개를 생성하고 1440x810 저용량 JPEG로 최적화했다. 행사 등록·수정의 배경 테마 선택지에 기존 그라데이션과 함께 추가했다.
- 철물점 중심 3D 아이콘 30개(드릴, 해머, 렌치, 배관, 안전 장비, 도어락, 작업등 등)를 생성하고 투명 WebP로 최적화했다. 기존 SVG 아이콘과 함께 행사 아이콘 선택지에 추가했다.
- 생성 자산 50개는 Supabase Storage 공개 버킷 event-assets에 업로드했다. themes는 image/jpeg, icons는 image/webp로 제공되며 버킷 파일 상한은 1MB다.
- 신규 이미지 테마를 선택한 행사는 Storage 배경을 히어로에 적용한다. 선택한 생성 아이콘은 히어로 우측 약 1/3 영역(large breakpoint 23rem)에서 크게 표시한다.
- 관리자 행사·이벤트 관리의 아이콘 선택은 5열 대형 카드에서 8~12열, 높이 44~48px의 컴팩트 그리드로 축소했다. 미리보기의 아이콘은 더 크게 표시한다.
- 프론트엔드 lint, TypeScript 빌드, Vite production build를 통과했다. 대표 테마·아이콘 Storage URL은 HTTP 200으로 확인했다.


## 카카오 로그인·주소·지도 연동 (2026-08-19)

| 경로 | 역할 |
| :--- | :--- |
| `client/src/lib/supabase.ts` | Supabase OAuth의 `kakao` 공급자 시작 및 `/auth/callback` 복귀 처리 |
| `client/src/features/auth/SocialAuthButtons.tsx` | 카카오 로그인 시작 버튼 |
| `client/src/lib/kakao.ts` | 카카오 우편번호·지도 SDK 지연 로드, 주소 선택값 정규화, 주소 좌표 지도 렌더링 |
| `client/src/components/address/KakaoAddressTools.tsx` | 재사용 가능한 카카오 주소 찾기 버튼과 선택 주소 지도 미리보기 |
| `client/src/features/my/MemberProfilePage.tsx` | 회원 기본 배송지의 카카오 주소 선택·지도 확인 |
| `client/src/features/my/AddressManagementPanel.tsx` | 추가 배송지 CRUD의 카카오 주소 선택·지도 확인 |
| `client/src/features/checkout/CheckoutPage.tsx` | 주문 요청 중 카카오 주소 선택 후 기존 지역 매칭 검증으로 연결 |
| `client/.env.example` | `VITE_KAKAO_JAVASCRIPT_KEY` 공개 환경변수 이름 예시. 실제 키는 Git 제외 `client/.env.local`에만 저장 |

> 카카오 로그인 비밀값은 프론트엔드 파일에 저장하지 않고 Supabase Authentication의 Kakao Provider 설정에서 관리한다. 카카오 지도 JavaScript 키는 도메인 제한을 적용한 공개 키만 클라이언트 환경변수로 사용한다.
