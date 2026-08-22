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


## Supabase Free 기반 로그인 유지·비활동 로그아웃 (2026-08-20)

| 파일 | 역할 |
| :--- | :--- |
| `client/src/lib/auth-session.ts` | 기본 30분·로그인 유지 7일 정책, Supabase 인증 저장소 선택, 활동 만료 시각·스냅샷 관리 |
| `client/src/lib/supabase.ts` | 위 인증 저장소를 Supabase 클라이언트에 연결하고 global/local 로그아웃 범위를 제공 |
| `client/src/app/AuthProvider.tsx` | 사용자 활동 감지, 비활동 만료 시 로컬 세션·개발용 신원 정리와 로그인 화면 복귀 |
| `client/src/features/auth/LoginPage.tsx` | 기본 미선택 로그인 상태 유지 체크박스와 이메일 로그인 정책 시작 |
| `client/src/features/auth/SocialAuthButtons.tsx` | Google·Kakao OAuth 시작 전 로그인 유지 정책 기록 |

> Supabase Free에서는 서버 측 `Inactivity timeout`과 `Time-box user sessions`를 설정할 수 없다. 현재 정책은 브라우저 저장소·프론트엔드 활동 타이머 기준이며, Pro 전환 시 서버 측 제한을 추가한다.


## 정중앙 인증 화면 디자인 (2026-08-20)

| 파일 | 역할 |
| :--- | :--- |
| `client/src/features/auth/AuthLayout.tsx` | 로그인·회원가입 공통 정중앙 인증 셸과 가입 전용 반응형 변형 클래스 |
| `client/src/features/auth/auth.css` | 밝은 격자 배경, 중앙 카드, 소셜 버튼·입력 필드·다크 모드·낮은 높이 가입 화면 스타일 |
| `client/src/features/auth/LoginPage.tsx` | 로그인 상태 유지 개인 기기 안내와 한글 오류·로딩 문구 |
| `client/src/features/auth/SignupPage.tsx` | 가입 전용 인증 셸과 한글 검증·이메일 인증 안내 |


## 관리자 계정·권한·운영 상태

| 위치 | 역할 |
| --- | --- |
| `server/src/main/resources/db/supabase/V35__admin_levels_and_status.sql` | 최고 관리자·일반 관리자 등급과 운영 상태 컬럼의 비파괴 마이그레이션 |
| `server/src/main/java/com/chulsooya/server/domain/admin/AdminAccountService.java` | 최고 관리자 전용 일반 관리자 초대·목록과 본인 운영 상태 변경 권한 경계 |
| `server/src/main/java/com/chulsooya/server/domain/admin/AdminAccountController.java` | `/api/admin/account/**` REST 계약 |
| `server/src/main/java/com/chulsooya/server/domain/admin/SupabaseAdminInvitationClient.java` | 서버 환경변수 기반 Supabase 일반 관리자 이메일 초대 |
| `server/src/main/java/com/chulsooya/server/support/SuperAdminBootstrapRunner.java` | 로컬 환경 설정 이메일의 최초 최고 관리자 자동 승격 |
| `client/src/features/admin/AdminAccountMenu.tsx` | 상단 접속 관리자 정보·운영 상태·최고 관리자 계정 설정 모달 |
| `client/src/api/endpoints.ts` | `adminApi`의 관리자 계정 조회·상태 변경·초대 Axios 호출 |
| `client/src/types/api.ts` | 관리자 계정·등급·운영 상태 API 타입 |

## 판매자 멤버십 탐색·정렬 구조 (2026-08-20)

| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/admin/SubscriptionManagementPanel.tsx` | 판매점·이메일·지역·취급 품목 통합 검색, 지역·카테고리 필터, 프리미엄→골드→실버 및 역순 정렬, 행 아래 등급 히스토리 토글 UI |
| `client/src/types/api.ts` | `AdminSellerMembership`의 `districtName`, `handledItems` REST 계약 타입 |
| `server/src/main/java/com/chulsooya/server/domain/subscription/SubscriptionDtos.java` | 관리자 판매자 멤버십 응답에 지역·취급 품목 필드 추가 |
| `server/src/main/java/com/chulsooya/server/domain/subscription/AdminSubscriptionService.java` | `Store`의 지역·취급 품목을 관리자 멤버십 응답으로 매핑 |


## 최신 운영·권한·인증 구조 (2026-08-21)

| 경로 | 역할 |
| :--- | :--- |
| `docs/CURRENT_IMPLEMENTATION_AND_BACKLOG.md` | 코드·Flyway V1~V39 기준의 완료·보완·미구현 우선순위와 문서 관리 기준 |
| `docs/STORE_OPERATIONS_PERMISSION_CONTRACT.md` | 판매점 별도 안내·영업 시간·휴무와 최고관리자 부여형 기능 권한 계약 |
| `server/src/main/resources/db/supabase/V34__enable_rls_and_revoke_public_table_access.sql` | public 테이블 RLS 활성화와 anon·authenticated 직접 권한 회수 |
| `server/src/main/resources/db/supabase/V35__admin_levels_and_status.sql` | 최고·일반 관리자 등급과 운영 상태 |
| `server/src/main/resources/db/supabase/V36__store_operations_and_user_feature_permissions.sql` | 판매점 운영 정보, 회원별 기능 권한, 권한 감사 이력 |
| `server/src/main/resources/db/supabase/V37__backfill_standard_admin_feature_permissions.sql` | 기존 일반관리자 기능 권한 보정 |
| `server/src/main/resources/db/supabase/V38__administrator_role_audit_logs.sql` | 최고관리자의 일반관리자 부여·해지 감사 이력 |
| `server/src/main/resources/db/supabase/V39__backfill_standard_administrator_levels.sql` | 기존 관리자 시드 계정의 일반관리자 등급 보정 |
| `server/src/main/java/com/chulsooya/server/domain/store/Store.java` | 별도 찾아오시는 길·영업 시간·휴무 설정과 서버 기준 `StoreOperatingStatus` 계산 |
| `server/src/main/java/com/chulsooya/server/domain/store/StoreOperatingStatus.java` | 고객 노출 상태 `영업중`·`준비중`·`영업종료`·`휴무` enum |
| `server/src/main/java/com/chulsooya/server/domain/user/FeaturePermissionService.java` | 일반관리자 기능 토글·권한 감사·본인 권한 조회 |
| `server/src/main/java/com/chulsooya/server/domain/user/AdministratorRoleService.java` | 최고관리자 전용 일반관리자 부여·해지·권한 회수·역할 감사 |
| `server/src/main/java/com/chulsooya/server/support/AdminFeaturePermissionInterceptor.java` | `/api/admin/**`의 일반관리자 세부 권한 검사 |
| `client/src/app/AuthProvider.tsx` | Supabase 세션과 `/api/auth/me` DB 역할 동기화, 늦은 세션 응답 경합 방지 |
| `client/src/app/RequireIdentity.tsx` | DB 역할 동기화 완료 뒤 역할별 라우트 접근 판정 |
| `client/src/features/auth/AuthCallbackPage.tsx` | OAuth 콜백에서 AuthProvider 역할 상태 확정 뒤 `next` 경로 이동 |
| `client/src/features/admin/AdminOverviewPage.tsx` | 최고관리자 전체 메뉴·일반관리자 허용 토글 메뉴만 노출 |
| `client/src/features/admin/UserManagementPanel.tsx` | 최고관리자 전용 일반관리자 부여·해지와 세부 기능 토글 UI |
| `client/src/features/seller/SellerSettingsPage.tsx` | 판매자 본인의 별도 안내·영업 시간·휴무 설정 |
| `client/src/features/admin/StoreManagementPanel.tsx` | 관리자 판매점 운영 정보 CRUD |
| `client/src/features/stores/StoreFinder.tsx`, `StoreDetailPage.tsx` | 서버 계산 판매점 영업 상태와 찾아오시는 길 고객 노출 |

> 판매자는 관리자 소유 상품·구독상품을 CRUD하지 않는다. 판매자는 공개된 구독상품을 신청하고 본인의 구독 상태를 확인하는 역할만 가진다.

## 관리자 접근 감사·반복 경보 구조 (V40, 2026-08-22)

| 경로 | 역할 |
| --- | --- |
| `server/src/main/resources/db/supabase/V40__admin_access_audit_log.sql` | 관리자 권한 거부 감사 로그·경보 이력 테이블과 조회 인덱스 |
| `server/src/main/java/com/chulsooya/server/domain/security/AdminAccessAuditService.java` | 권한 거부 기록, 10분 반복·경로 탐색·분산 IP 탐지, 30분 경보 중복 억제, 모든 관리자 DB 알림 저장 |
| `server/src/main/java/com/chulsooya/server/domain/security/AdminAccessAuditLog*.java` | 관리자 접근 거부 JPA 엔터티·패턴 집계·동시 요청 자문 잠금 저장소 |
| `server/src/main/java/com/chulsooya/server/domain/security/AdminAccessAlertLog*.java` | 발송된 보안 경보 이력·중복 억제 저장소 |
| `server/src/main/java/com/chulsooya/server/domain/security/AdminSecurityAuditController.java` | `GET /api/admin/security-audits` 최근 감사·경보 REST API |
| `server/src/main/java/com/chulsooya/server/support/AdminAccessAuthenticationEntryPoint.java` | 인증 전 401 `/api/admin/**` 접근 감사 기록 |
| `server/src/main/java/com/chulsooya/server/support/AdminFeaturePermissionInterceptor.java` | `/api/admin/**` 역할·세부 기능 권한 거부 감사와 `ADMIN_VIEW_SECURITY_AUDIT` 경계 |
| `server/src/main/java/com/chulsooya/server/domain/user/FeaturePermission.java` | 일반관리자용 `ADMIN_VIEW_SECURITY_AUDIT` 토글 권한 |
| `client/src/features/admin/SecurityAuditPanel.tsx` | 최근 경보·접근 거부 이력 조회 관리자 탭 |
| `client/src/features/admin/AdminOverviewPage.tsx` | 보안 운영 메뉴, 상단 보안 경보 바로가기, `?view=security-audit` 딥링크 처리 |
| `client/src/api/endpoints.ts`, `client/src/types/api.ts` | 보안 감사 Axios REST 계약과 TypeScript 응답 타입 |


## 권한 기반 관리자 알림 종·업무 딥링크 (2026-08-22)

| 경로 | 역할 |
| --- | --- |
| `server/src/main/java/com/chulsooya/server/domain/support/BusinessNotificationService.java` | 전체 관리자 보안 경보, 최고관리자 전용 업무, 기능 토글 기반 일반관리자 업무 알림 저장 |
| `server/src/main/java/com/chulsooya/server/support/AdminFeaturePermissionInterceptor.java` | 성공한 `/api/admin/**` 변경 요청을 기능 권한별 관리자 업무 알림·탭 딥링크로 연결 |
| `server/src/main/java/com/chulsooya/server/domain/support/CustomerSupportService.java` | 신규 고객 문의를 고객 지원 권한 보유 관리자에게만 전달 |
| `server/src/main/java/com/chulsooya/server/domain/admin/AdminAccountService.java` | 최고관리자용 계정 초대·운영 상태 변경 알림 |
| `server/src/main/java/com/chulsooya/server/domain/user/AdministratorRoleService.java` | 일반관리자 부여·해지 알림 |
| `server/src/test/java/com/chulsooya/server/domain/support/BusinessNotificationServiceTest.java` | 최고관리자 전체 수신·일반관리자 기능 토글 수신 규칙 단위 테스트 |
| `client/src/components/shop/HeaderNotifications.tsx` | 공통 알림 종·레드닷·읽음 항목 목록. null 생략 응답까지 미확인으로 처리 |
| `client/src/features/admin/AdminOverviewPage.tsx` | 관리자 상단 알림 종, DB 읽음 처리, 권한 확인 후 관리자 탭 딥링크 이동 |
| `client/src/api/endpoints.ts`, `client/src/types/api.ts` | 관리자 알림 조회·읽음 Axios 계약과 `readAt` 선택 타입 |

## 이메일 비밀번호 재설정·로그인 안내 보정 (2026-08-22)

| 경로 | 역할 |
| --- | --- |
| `client/src/features/auth/PasswordResetRequestPage.tsx` | 이메일 로그인 계정의 비밀번호 재설정 안내 메일 요청 화면 |
| `client/src/features/auth/PasswordResetPage.tsx` | Supabase 복구 세션에서 새 비밀번호 설정 후 재로그인 처리 화면 |
| `client/src/lib/supabase.ts` | `requestPasswordReset`, `updatePassword` 인증 래퍼와 기존 콜백 기반 재설정 URL |
| `client/src/features/auth/LoginPage.tsx` | 개인 기기 주의 로그인 상태 유지 문구, 비밀번호 찾기 연결, 재설정 완료 안내 |
| `client/src/app/router.tsx` | `/auth/forgot-password`, `/auth/reset-password` 인증 경로 |


## 2026-08-22 — 인증·보안 감사·관리자 알림·다크모드 구조

| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/auth/PasswordResetRequestPage.tsx` | 이메일 로그인 계정의 비밀번호 재설정 링크 요청 화면. Google·Kakao 계정은 각 플랫폼에서 비밀번호를 관리한다는 안내를 제공한다. |
| `client/src/features/auth/PasswordResetPage.tsx` | Supabase 복구 세션에서 새 비밀번호를 설정하고 로그인으로 복귀하는 화면. |
| `client/src/lib/supabase.ts` | `requestPasswordReset`, `updatePassword` Supabase 인증 래퍼와 기존 인증 콜백 재사용 위치. |
| `client/src/features/auth/LoginPage.tsx` | 로그인 상태 유지 개인 기기 주의 문구와 비밀번호 찾기 진입점. |
| `client/src/components/shop/HeaderNotifications.tsx` | 공통 알림 종, 미확인 레드닷, 읽음 처리 후 대상 경로 이동 UI. 서버가 `readAt`을 생략한 항목도 미확인으로 판정한다. |
| `client/src/components/shop/ShopHeader.tsx` | 상점 헤더 알림 종의 관리자 고객 문의 강제 딥링크(`/admin?view=support`), 공통 장바구니 수량 갱신 수신, 다크모드 회청색 로고 카드. |
| `client/src/features/admin/AdminOverviewPage.tsx` | 관리자 알림 종, URL `view` 딥링크 초기 탭, 권한 기반 메뉴·보안 감사 탭 연결. |
| `client/src/features/admin/SecurityAuditPanel.tsx` | 최근 관리자 접근 거부 이력과 보안 경보를 조회하는 운영 대시보드 패널. |
| `client/src/components/shop/CategoryMegaMenu.tsx` | 밝은·다크모드 공통 3단 카테고리, 연한 보라 테두리형 호버와 선택 상태. |
| `client/src/styles/global.css` | `shop-theme` 다크 레거시 표면 보정, 전용 카테고리 다크 호버 규칙, 회청색 로고 카드·이미지 혼합 규칙. |
| `server/src/main/java/com/chulsooya/server/domain/security/AdminAccessAuditLog.java` | 관리자 API 401·403 감사 로그 엔터티. |
| `server/src/main/java/com/chulsooya/server/domain/security/AdminAccessAlertLog.java` | 반복·경로 탐색·분산 IP 보안 경보 이력 엔터티. |
| `server/src/main/java/com/chulsooya/server/domain/security/AdminAccessAuditService.java` | 감사 기록, 반복·경로·분산 패턴 감지, 중복 억제, 관리자 DB 알림 발송. |
| `server/src/main/java/com/chulsooya/server/domain/security/AdminSecurityAuditController.java` | `/api/admin/security-audit` 최근 이력·경보 조회 REST API. |
| `server/src/main/java/com/chulsooya/server/support/AdminAccessAuthenticationEntryPoint.java` | 로그아웃 상태의 `/api/admin/**` 401도 감사 로그에 남기고 Bearer 인증 안내 헤더를 유지하는 진입점. |
| `server/src/main/java/com/chulsooya/server/support/AdminFeaturePermissionInterceptor.java` | 관리자 역할·기능 권한 403 감사, 성공한 관리자 CRUD의 권한 기반 업무 알림 생성 위치. |
| `server/src/main/java/com/chulsooya/server/domain/support/BusinessNotificationService.java` | 최고관리자 전체 수신, 일반관리자 기능 토글 기반 수신, 관리자 전용 업무·보안 알림 라우팅. |
| `server/src/main/java/com/chulsooya/server/domain/support/CustomerSupportService.java` | 고객 문의 관리자 알림을 권한 보유 일반관리자와 최고관리자에게 저장하고 관리자 고객 지원 탭으로 연결. |
| `server/src/main/resources/db/supabase/V40__admin_access_audit_log.sql` | 관리자 접근 감사 로그·경보 테이블 및 패턴 집계 인덱스. |
| `server/src/main/resources/db/supabase/V41__normalize_admin_inquiry_notification_paths.sql` | 기존 관리자 고객 문의 알림의 대상 경로를 `/admin?view=support`로 정규화. |
| `server/src/test/java/com/chulsooya/server/domain/support/BusinessNotificationServiceTest.java` | 최고관리자 전체 수신과 일반관리자 기능 토글 기반 수신 규칙 검증. |

### 최근 문서·설정 위치

| 경로 | 역할 |
| :--- | :--- |
| `docs/PLANNING_ALIGNMENT_REGISTER.md` | 기획서 충돌 해소, 현재 구현 기준과 보류 범위 등록부. |
| `docs/CURRENT_IMPLEMENTATION_AND_BACKLOG.md` | P0~P3 현재 구현·보완·미구현 단일 백로그. |
| `최종 테스트 계정 로그인 정보.md` | 역할별 실제 Supabase 로그인 테스트 계정과 검증 목적. |


## 기존 행사 배너 테마 Storage·DB 운영 통합 (V42, 2026-08-22)

| 경로 | 역할 |
| :--- | :--- |
| `server/src/main/resources/db/supabase/V42__backfill_legacy_event_theme_assets.sql` | 기존 `event-assets/themes/`의 GPT 생성 테마 20개를 `event_assets`에 등록하고 기존 행사 `theme_asset_id`를 연결하는 비파괴 이관. |
| `server/src/main/java/com/chulsooya/server/domain/catalog/EventCampaignController.java` | 공개 히어로 응답에 연결된 `themeAssetId`·`themeImageUrl`을 반환하는 서버 경계. |
| `server/src/main/java/com/chulsooya/server/domain/admin/AdminEventCampaignController.java` | 행사 생성·수정에서 활성 테마 자산 연결을 검증하고 행사 응답에 이미지 URL을 매핑. |
| `server/src/main/java/com/chulsooya/server/domain/admin/AdminEventAssetController.java` | Storage 자산 CRUD. 행사에서 참조 중인 테마·아이콘의 삭제를 차단한다. |
| `client/src/features/events/campaignPresentation.tsx` | 기본 색상 테마·SVG 아이콘 표현만 유지한다. 기존 Storage 배너 URL 하드코드 목록은 제거됐다. |
| `client/src/features/admin/EventCampaignManagementPanel.tsx` | 기본 테마와 DB `event_assets` 기반 `Storage 업로드 배너 테마`를 구분해 선택·저장·미리보기한다. |
| `client/src/features/admin/EventAssetManagementPanel.tsx` | Storage 테마 업로드·수정·삭제와 등록 테마 삭제 선택 UI. 자산 변경 이벤트로 행사 편집 드롭다운을 즉시 갱신한다. |
| `client/src/components/shop/EventHeroCarousel.tsx` | 공개 API가 반환한 DB Storage `themeImageUrl`을 히어로 배경에 렌더링한다. |


## 접이식 행사 자산 관리 (2026-08-22)

| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/admin/EventAssetManagementPanel.tsx` | Storage 배너 테마·아이콘 업로드·목록 순서·편집·활성 상태·삭제 전용 관리자 화면. 새 이미지 등록, 등록 배너 테마, 등록 배너 아이콘을 접이식 섹션으로 제공한다. |
| `client/src/features/admin/EventCampaignManagementPanel.tsx` | 새 행사 등록과 기존 행사 수정에서 DB Storage 테마·아이콘을 직접 선택·저장하는 유일한 행사 자산 적용 화면. |


## 2026-08-22 추가 인증·알림 딥링크 파일

| 파일 | 책임 |
| :--- | :--- |
| `client/src/lib/auth-session.ts` | 30분·7일 정책 만료 시각을 유지하면서 Supabase 세션을 `localStorage`에서 복원한다. 새 탭·직접 `/admin` 진입의 로그인 이탈을 방지한다. |
| `client/src/features/admin/AdminOverviewPage.tsx` | 관리자 알림 대상 경로의 `view` 값을 활성 탭으로 변환한다. 이전 `security-audit` 경로도 `securityAudit`으로 호환한다. |
| `server/src/main/java/com/chulsooya/server/domain/security/AdminAccessAuditService.java` | 새 보안 경보를 `/admin?view=securityAudit` 대상 경로로 모든 관리자에게 기록한다. |
| `server/src/main/java/com/chulsooya/server/support/AdminFeaturePermissionInterceptor.java` | 관리자 CRUD 완료 알림의 기능 권한별 업무 탭 경로를 결정한다. |
| `server/src/main/resources/db/supabase/V43__normalize_security_notification_paths.sql` | 기존 관리자 `SECURITY_ALERT` 알림의 하이픈 탭 키를 표준 `securityAudit`으로 정규화한다. |

## 행사 자산 Storage 업로드 운영 구조 (2026-08-22)

| 경로 | 역할 |
| :--- | :--- |
| `client/src/api/client.ts` | Axios 공통 HTTP 진입점. 전역 JSON 고정 헤더를 두지 않아 FormData 요청의 multipart 경계값을 브라우저가 생성한다. |
| `client/src/api/endpoints.ts` | `adminApi.uploadEventAsset`, `replaceEventAssetFile`이 Axios `postForm`으로 행사 자산 파일을 전송한다. |
| `client/src/features/admin/EventAssetManagementPanel.tsx` | 관리자 행사 자산의 새 이미지 등록·Storage 활성화·이미지 교체·삭제 UI. |
| `server/src/main/java/com/chulsooya/server/domain/admin/AdminEventAssetController.java` | 관리자 행사 자산 생성·파일 교체 multipart REST API. |
| `server/src/main/java/com/chulsooya/server/domain/admin/EventAssetStorage.java` | 공개 `event-assets` 버킷 업로드·삭제·공개 URL 조립과 실패 사유 운영 로그. |
| `server/src/main/resources/application.yaml` | 행사 자산 업로드를 포함한 Spring multipart 최대 8MB 제한. |
| `server/src/main/resources/db/supabase/V44__allow_supported_event_asset_image_types.sql` | `event-assets` 버킷에 JPG·PNG·WebP MIME 형식을 허용. |
| `server/src/main/resources/db/supabase/V45__align_event_asset_file_size_limit.sql` | `event-assets` 버킷 파일 제한을 관리자 UI와 같은 8MB로 설정. |
| `client/src/features/admin/EventCampaignManagementPanel.tsx` | 새 행사 등록·수정의 Storage 업로드 배너 테마 드롭다운과 행사 적용 처리. |

## 관리자 상품 삭제 보호 (2026-08-22)

| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/admin/ProductManagementPanel.tsx` | 상품 행의 수정·활성 상태·삭제 버튼, 삭제 확인 팝업, 다크모드 대비 |
| `client/src/api/endpoints.ts` | `adminApi.deleteProduct()` Axios REST 호출 |
| `server/src/main/java/com/chulsooya/server/domain/admin/AdminProductController.java` | `DELETE /api/admin/products/{id}`; 주문·장바구니 참조 상품 삭제 차단 |
| `server/src/main/java/com/chulsooya/server/domain/cart/CartRepository.java` | 장바구니 상품 참조 존재 검사 |
| `server/src/main/java/com/chulsooya/server/domain/order/OrderRepository.java` | 주문 품목 상품 참조 존재 검사 |
| `server/src/test/java/com/chulsooya/server/domain/admin/AdminProductDeletionTest.java` | 안전 삭제·주문 이력 차단·장바구니 차단 단위 테스트 |

## 비활성 상품 장바구니·주문 보호 (2026-08-22)

| 경로 | 역할 |
| :--- | :--- |
| `server/src/main/java/com/chulsooya/server/domain/cart/CartDtos.java` | 장바구니 품목의 상품 활성 상태 REST 응답 계약 |
| `server/src/main/java/com/chulsooya/server/domain/cart/CartService.java` | 비활성 상품 활성 상태 조회, 수량 변경 서버 차단 |
| `server/src/main/java/com/chulsooya/server/domain/order/OrderService.java` | 주문 생성 직전 비활성 상품 최종 차단 |
| `client/src/features/cart/CartPage.tsx` | 흐림·재고 없음 배지, 수량 변경·주문 요청 차단, 개별 삭제 유지 |
| `client/src/features/checkout/CheckoutPage.tsx` | 재고 없음 주문 차단 안내와 장바구니 정리 이동 |
| `server/src/test/java/com/chulsooya/server/domain/cart/CartServiceInactiveProductTest.java` | 비활성 상태 응답·수량 변경 차단 테스트 |

## 카카오 주소·장소명 통합 검색 (2026-08-22)

| 찾는 것 | 위치 |
| :--- | :--- |
| 주소·장소명 찾기 탭 팝업 | `client/src/components/address/KakaoAddressTools.tsx` |
| 기존 우편번호·카카오 지도·장소명 검색 SDK 도우미 | `client/src/lib/kakao.ts` |
| 배송지 관리의 검색 결과 적용·서울시 구 검증 | `client/src/features/my/AddressManagementPanel.tsx` |
| 주문 화면의 검색 결과 적용·매칭 지역 확인 | `client/src/features/checkout/CheckoutPage.tsx` |

장소명 검색은 별도 REST API 키를 추가하지 않고 기존 카카오 지도 JavaScript SDK의 `services.Places().keywordSearch()`를 사용한다. 선택한 장소 결과는 도로명 주소를 우선 적용하고, 기존 지역 검증 흐름을 재사용한다.

## 서비스 점검·연결 오류 화면 (2026-08-22)

| 찾는 것 | 위치 |
| :--- | :--- |
| 공통 로딩·빈 결과·서비스 점검·연결 오류 화면 | `client/src/components/StateViews.tsx` |
| Axios 네트워크·시간 초과·서버 오류 정규화 | `client/src/api/client.ts` |

`ErrorView`는 `NETWORK_ERROR`, `TIMEOUT`, 5xx, 일반 요청 오류를 사용자용 서비스 안내 카드로 분류하며, 홈·판매점·카탈로그 등 기존 오류 상태 화면이 공통으로 재사용한다.

## 최고관리자 전면 점검 모드 (2026-08-22)

| 찾는 것 | 위치 |
| :--- | :--- |
| 점검 상태 영속화 | `server/src/main/resources/db/supabase/V46__platform_maintenance_mode.sql` |
| 점검 상태 엔터티·저장소·최고관리자 제어 서비스 | `server/src/main/java/com/chulsooya/server/domain/maintenance/` |
| 공개 상태·관리자 변경 REST API | `server/.../domain/maintenance/PlatformMaintenanceModeController.java` |
| 일반 API 503 차단·최고관리자 예외 | `server/src/main/java/com/chulsooya/server/support/MaintenanceModeInterceptor.java`, `config/WebMvcConfig.java` |
| Supabase 공개 점검 상태 경로 | `server/src/main/java/com/chulsooya/server/config/SupabaseSecurityConfig.java` |
| 점검 상태 Axios 계약 | `client/src/api/endpoints.ts`, `client/src/types/api.ts` |
| 전면 점검 게이트·점검 페이지 | `client/src/components/maintenance/MaintenanceGate.tsx` |
| 최고관리자 점검 제어 탭 | `client/src/features/admin/MaintenanceManagementPanel.tsx`, `AdminOverviewPage.tsx` |
| 핵심 단위 테스트 | `server/src/test/java/com/chulsooya/server/domain/maintenance/PlatformMaintenanceModeServiceTest.java`, `server/src/test/java/com/chulsooya/server/support/MaintenanceModeInterceptorTest.java` |

## 점검 단계·재사용 공지 운영 확장 (V47)

| 찾는 것 | 위치 |
| :--- | :--- |
| 점검 단계·재사용 공지 DB 스키마 | `server/src/main/resources/db/supabase/V47__maintenance_phases_and_reusable_notices.sql` |
| 점검 단계·공지 엔터티·저장소·서비스 | `server/src/main/java/com/chulsooya/server/domain/maintenance/MaintenancePhase.java`, `MaintenanceNotice*.java`, `PlatformMaintenanceMode*.java` |
| 공개 상태·점검 제어·공지 CRUD REST API | `server/.../domain/maintenance/PlatformMaintenanceModeController.java` |
| 최고관리자 점검 단계·공지 라이브러리 탭 | `client/src/features/admin/MaintenanceManagementPanel.tsx` |
| 점검 API 프론트 계약 | `client/src/api/endpoints.ts`, `client/src/types/api.ts` |
| 점검 준비 상단 안내 | `client/src/components/maintenance/MaintenanceNoticeLayer.tsx` |
| 전면 점검 페이지·일반 라우트 게이트 | `client/src/components/maintenance/MaintenanceGate.tsx`, `client/src/app/router.tsx` |
| 이전 메인 팝업 연결 위치 | V48에서 `HomePage.tsx`의 독립 `PopupAdvertisingLayer.tsx`로 대체됨 |

## V48 — 서비스 점검 공지와 메인 팝업 광고 분리

| 영역 | 경로 | 책임 |
| :--- | :--- | :--- |
| 팝업 스키마 | `server/src/main/resources/db/supabase/V48__popup_notice_library.sql` | `popup_notices` 테이블과 단일 활성 팝업 부분 유니크 인덱스 |
| 팝업 도메인 | `server/src/main/java/com/chulsooya/server/domain/notice/PopupNotice.java` | 팝업 광고 엔터티, 선택 표시 기간·활성 상태·수정 관리자 |
| 팝업 저장소 | `server/src/main/java/com/chulsooya/server/domain/notice/PopupNoticeRepository.java` | 최신 수정순 저장 팝업 조회 |
| 팝업 서비스 | `server/src/main/java/com/chulsooya/server/domain/notice/PopupNoticeService.java` | 최고관리자 CRUD, 단일 활성 전환, 공개 시간 필터, 관리자 알림 |
| 팝업 REST | `server/src/main/java/com/chulsooya/server/domain/notice/PopupNoticeController.java` | 공개 `GET /api/notices/popup`, 최고관리자 `/api/admin/popup-notices/**` |
| 공개 보안 | `server/src/main/java/com/chulsooya/server/config/SupabaseSecurityConfig.java` | 공개 팝업 GET permit 규칙 |
| 점검 차단 예외 | `server/src/main/java/com/chulsooya/server/support/MaintenanceModeInterceptor.java` | 점검 중에도 공개 팝업 조회는 통과, 일반 서비스 API는 `MAINTENANCE`에서만 차단 |
| API 타입·호출 | `client/src/types/api.ts`, `client/src/api/endpoints.ts` | `PopupNotice`·`PopupNoticeRequest`, 공개 조회와 관리자 CRUD Axios REST 계약 |
| 팝업 표시 | `client/src/components/popup/PopupAdvertisingLayer.tsx` | 홈 전용 팝업 렌더링, 팝업 ID별 24시간 다시 보지 않기 |
| 점검 표시 | `client/src/components/maintenance/MaintenanceNoticeLayer.tsx` | `PREPARING` 단계의 상단 점검 배너만 담당 |
| 홈 연결 | `client/src/features/catalog/HomePage.tsx` | 기존 `MaintenanceNoticePopup` 대신 `PopupAdvertisingPopup` 렌더링 |
| 팝업 관리자 UI | `client/src/features/admin/PopupAdvertisingManagementPanel.tsx` | 제목·내용·기간 CRUD, 단일 활성화, 2단계 삭제 확인, 다크모드 |
| 관리자 탐색 | `client/src/features/admin/AdminOverviewPage.tsx` | 최고관리자 전용 `popupAds`, `홍보 · 콘텐츠`와 `서비스 운영` 독립 메뉴 그룹 |
| 회귀 테스트 | `server/src/test/java/com/chulsooya/server/domain/notice/PopupNoticeServiceTest.java` | 단일 활성화, 일반관리자 차단, 공개 시간 필터 |

> 운영 구분: `maintenance_notices`는 점검 준비 상단 공지 전용이며, `popup_notices`는 홈 메인 팝업 광고 전용이다. `NORMAL`은 실제 API 차단과 전면 점검 게이트를 해제하고, `PREPARING`은 차단 없이 상단 공지만 표시하며, `MAINTENANCE`만 일반 서비스 차단을 수행한다.

## V49 — 고객센터 공지 탭과 점검 공지 연동

| 영역 | 경로 | 책임 |
| :--- | :--- | :--- |
| 일반 공지 스키마 | `server/src/main/resources/db/supabase/V49__customer_notices.sql` | 일반 고객 공지의 제목·내용·활성 상태·표시 기간·작성/수정자 이력 |
| 일반 공지 도메인 | `server/src/main/java/com/chulsooya/server/domain/support/CustomerNotice*.java` | 일반 공지 엔터티·저장소·일반 공지 CRUD와 표시 기간 판정 |
| 공지 집계 서비스 | `server/src/main/java/com/chulsooya/server/domain/support/CustomerNoticeService.java` | 활성 일반 공지와 활성 점검 공지를 고객센터 공개 목록으로 통합, 출처 구분 |
| 공지 REST | `server/src/main/java/com/chulsooya/server/domain/support/CustomerNoticeController.java` | 공개 `GET /api/support/notices`, 권한 기반 `/api/admin/customer-notices/**` |
| 권한·업무 알림 | `server/.../domain/user/FeaturePermission.java`, `server/.../support/AdminFeaturePermissionInterceptor.java` | `ADMIN_MANAGE_CUSTOMER_NOTICES` DB 토글, 관리자 변경 알림·딥링크 |
| 공개 보안 | `server/src/main/java/com/chulsooya/server/config/SupabaseSecurityConfig.java` | 로그인 없이 고객센터 공지를 조회하는 GET 허용 경로 |
| 고객센터 UI | `client/src/features/support/CustomerSupportPage.tsx`, `CustomerNoticeBoard.tsx` | 기본 공지사항 탭, 일반/서비스 점검 출처 배지, 전체 내용·안내 기간 표시 |
| 관리자 UI | `client/src/features/admin/CustomerNoticeManagementPanel.tsx`, `AdminOverviewPage.tsx` | 권한 보유 관리자 전용 일반 공지 CRUD·활성화·2단계 삭제 |
| 공통 Axios 계약 | `client/src/types/api.ts`, `client/src/api/endpoints.ts` | 공개 조회와 관리자 CRUD 타입·호출 |
| 시간대 보정 | `client/src/features/admin/MaintenanceManagementPanel.tsx` | 점검 예정 시간을 브라우저 로컬 시간으로 `datetime-local`에 표시 |
| 회귀 테스트 | `server/src/test/java/com/chulsooya/server/domain/support/CustomerNoticeServiceTest.java` | 일반/점검 공지 공개 연동, 권한 보유 관리자 생성 규칙 |

## 철수야 소개·이용약관·개인정보처리방침 안내 페이지 (2026-08-22)

| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/support/ServiceInformationPage.tsx` | 공용 `/about` 페이지. 철수야 소개, 이용약관 검토 초안, 개인정보처리방침 검토 초안을 해시 앵커로 제공하며 다크 모드를 지원한다. |
| `client/src/app/router.tsx` | 공용 상점 셸 아래 `/about` 라우트를 등록한다. |
| `client/src/components/shop/ShopFooter.tsx` | 우측 푸터의 서비스 소개·이용약관·개인정보처리방침을 `/about#intro`, `/about#terms`, `/about#privacy`로 연결한다. |
| `legal_policy_research_notes.md` | 전자상거래 표준약관·개인정보처리방침 작성지침 출처와 정식 공개 전 사업 정보 확인 항목을 기록한다. |


## 판매자 서비스·구독·패널티 가이드 (2026-08-22)

- `client/src/features/seller/SellerServiceGuidePage.tsx`: 공개 `/seller-guide`의 판매자 서비스, 지원 등록, 운영, 구독, 신뢰·패널티 앵커 안내 페이지. 실제 지원 등록 요건, 주문 제안·가용 슬롯 원칙, 등급별 주문 공개 시점, 물품 확인 2분 만료 패널티·신뢰 점수·24시간 제한 안내를 제공한다.
- `client/src/app/router.tsx`: 공개 `seller-guide` 라우트와 판매자 전용 `seller/subscription` 라우트를 등록한다.
- `client/src/components/shop/ShopFooter.tsx`: 판매자 서비스 푸터를 지원 등록·구독·신뢰 패널티 가이드 앵커로 연결한다.
- `client/src/features/my/MyPage.tsx`: `SELLER` 역할의 마이철수 `SELLER WORKFLOW`에 판매자 안내 가이드 링크를 제공한다.


## 안내 CTA 공통화 및 회귀 방지 (2026-08-22)

- `client/src/styles/global.css`: 공용 안내·가이드·신청 CTA용 `guide-cta-primary`(다색 입체 주요 액션) 및 `guide-cta-secondary`(밝은·다크 모드 입체 보조 액션) 스타일. 팝업 전용 `popup-attention-button`과 분리한다.
- `client/src/features/seller/SellerServiceGuidePage.tsx`: 판매자 등록·구독·슬롯·마이철수 CTA에 공통 스타일을 사용한다.
- `AGENTS.md`: 새 안내·가이드·신청·확인 CTA가 평면 `bg-brand-*` 버튼으로 회귀하지 않도록 공통 CTA 우선 재사용 규약을 명시한다.

- 최고관리자 판매자 테스트·전역 예외 보정: `server/domain/sellerapplication/SellerApplicationService.java`는 최고관리자와 `CONSUMER_SELLER_APPLICATION` 토글을 받은 일반관리자의 판매자 신청을 허용하며, 관리자 신청 승인 시 ADMIN 역할·등급을 유지한다. `client/app/RouteErrorPage.tsx`와 `router.tsx`는 예상하지 못한 라우트 예외 및 404의 복구 경로를 제공한다. `RequireIdentity.tsx`는 권한 없음에서 메인 복귀 CTA를 제공하고, `SellerDashboardPage.tsx`·`useAsync.ts`는 판매점 없음 안내와 오류 폴링 중지로 반복 깜빡임을 막는다.

## 판매자 증빙 비공개 Storage 10MB 정합성 (2026-08-22)

| 경로 | 역할 |
| :--- | :--- |
| `server/src/main/java/com/chulsooya/server/domain/sellerapplication/SellerCertificateStorage.java` | 비공개 `seller-verification-documents` 버킷을 조회해 재사용하고, 없는 경우에만 JPEG/PNG·10MB 정책으로 생성한다. 관리자 조회에는 만료형 서명 URL을 생성한다. |
| `server/src/main/resources/db/supabase/V52__align_seller_certificate_size_limit.sql` | 사업자등록증·통장사본 메타데이터 DB 제약을 100KB~10MB로 정렬한다. |
| `server/src/test/java/com/chulsooya/server/domain/sellerapplication/SellerCertificateStorageTest.java` | 기존 비공개 버킷은 재생성하지 않고 업로드하며, 없는 경우에만 10MB 제한 버킷을 생성하는 계약을 검증한다. |
| Supabase Storage `seller-verification-documents` | 비공개 버킷, JPEG/PNG 전용, 10MB 파일 제한. 신청 DB에는 URL 대신 객체 키·콘텐츠 타입·크기를 저장하고, 관리자 심사 시에만 짧은 수명의 서명 URL을 만든다. |


## 관리자 내부 판매자 신청·판매점 보유 관리자 UI 정합성 (2026-08-22)

| 경로 | 역할 |
| :--- | :--- |
| `server/src/main/resources/db/supabase/V53__internal_admin_seller_applications.sql` | 증빙·등록값 없는 내부 관리자 판매자 신청 식별자와 NULL 허용 필드를 비파괴로 추가한다. |
| `server/src/main/java/com/chulsooya/server/domain/sellerapplication/SellerApplication.java` | 일반 사업자 신청과 내부 관리자 신청을 구분하는 엔터티 상태를 보관한다. |
| `server/src/main/java/com/chulsooya/server/domain/sellerapplication/SellerApplicationService.java` | 최고관리자 또는 `CONSUMER_SELLER_APPLICATION` 토글 일반관리자의 내부 신청을 심사 대기로 생성하고, 최고관리자 승인 시 ADMIN/HIGHEST를 보존한다. |
| `server/src/main/java/com/chulsooya/server/domain/sellerapplication/SellerApplicationController.java` | 내부 관리자 판매자 신청 REST 경로를 분리한다. |
| `server/src/main/java/com/chulsooya/server/domain/sellerapplication/SellerApplicationDocumentService.java` | 내부 신청의 문서 면제와 판매자 심사 문서 접근 토글을 서버에서 강제한다. |
| `server/src/main/java/com/chulsooya/server/domain/user/FeaturePermissionService.java` | 최고관리자가 일반관리자에게 소비자·판매자 그룹을 포함한 토글을 부여하고, 해지 시 위임 토글을 회수한다. |
| `server/src/main/java/com/chulsooya/server/domain/store/SellerController.java` | 판매점 보유 일반관리자의 판매자 API를 실제 SELLER 토글로 제한한다. |
| `client/src/features/my/MyPage.tsx` | 판매점 보유 관리자에게 부여된 SELLER 토글 범위의 판매자 워크플로를 표시한다. |
| `client/src/features/seller/SellerApplicationPage.tsx` | 관리자 전용 무증빙 내부 신청과 일반 판매자 증빙 신청을 구분해 표시한다. |
| `client/src/features/admin/SellerApplicationManagementPanel.tsx` | 내부 관리자 신청을 식별하고 최고관리자만 문서 없이 강제 승인하도록 한다. |

## 운영 UI·다크모드·스페셜 CTA 사용 경계 (2026-08-22)

| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/seller/SlotControlBar.tsx` | 주문 수신 중에는 표준 `주문 거절` 버튼만, 중지 상태에서는 비활성 거절 버튼을 숨기고 `주문 수신 재개`만 표시한다. |
| `client/src/features/seller/SellerSettingsPage.tsx` | 가용량 변경 이력의 `BUSY_MODE` 라벨을 `주문 거절`로 표시한다. |
| `client/src/features/seller/SellerServiceGuidePage.tsx` | 안내 페이지 첫 탭을 `판매자 운영 안내`로 표기하고 다크모드 준비 정보 패널의 대비를 보정한다. |
| `client/src/features/support/CustomerNoticeBoard.tsx` | 일반 공지 배지에 다크모드 전용 인디고 표면·테두리·본문 대비를 적용한다. |
| `client/src/components/shop/ShopHeader.tsx` | 계정 드롭다운의 마이철수·주문 내역·로그아웃 항목에 라이트·다크 대비를 명시한다. |
| `client/src/components/shop/ShopFooter.tsx` | 판매자 가이드 링크를 `판매자 운영 안내`로 구분하고 그룹 제목·링크 목록 간격을 조정한다. |
| `/home/ubuntu/skills/chulsooya-special-cta/SKILL.md` | 입체·애니메이션 스페셜 CTA를 안내·신청·팝업 확인에만 제한하고 운영·위험 동작에는 표준 `.btn`을 사용하도록 하는 재사용 스킬이다. |


## 판매자 구독 등급·주문 공개 우선순위 감사 (2026-08-22)

| 경로 | 역할 |
| :--- | :--- |
| `docs/SELLER_TIER_NOTIFICATION_PRIORITY_AUDIT.md` | Markdown 전수 조사 결과, 현행 0/30/60초·15/8/3 슬롯 기준, 과거 0/3/6초 폐기 근거, DB·API·UI 정합성 조치 순서를 보관한다. |
| `server/src/main/java/com/chulsooya/server/domain/store/SubscriptionTier.java` | 현재 서버의 `PREMIUM/GOLD/SILVER`별 슬롯 한도와 공개 지연 상수(15·8·3 / 0·30·60)를 제공한다. 정책 수치의 관리자 변경이 요구되면 DB 정책 테이블로 분리해야 한다. |
| `server/src/main/java/com/chulsooya/server/domain/matching/OfferDispatchService.java` | DB 판매점 등급·신뢰 점수·가용 슬롯·수신 상태·패널티를 기준으로 주문 제안을 생성하며, 상위 등급 후보가 없으면 하위 등급 조기 확산을 허용한다. |
| `client/src/components/format.ts` | 과거 `FREE/STANDARD/PREMIUM` 레이블 계약이 남아 현재 `SILVER/GOLD/PREMIUM` DB 응답과 불일치한다. |
| `client/src/features/seller/SellerSettingsPage.tsx` | 과거 0/3/6초 문구가 남아 있어 현재 DB·서버 정책 기반 표기로 교체 또는 제거가 필요하다. |

## 2026-08-22 — 내부 구독결제·전국 지역·구매자 가이드·문의 상태 흐름

| 구분 | 핵심 파일 | 책임 |
| :--- | :--- | :--- |
| 구독 결제 요청 | `server/.../subscription/SubscriptionPaymentRequest*.java`, `V54__subscription_payment_requests.sql` | PG 미연동 내부 결제 요청의 PENDING/APPROVED/REJECTED 상태, 중복 요청 차단, 승인·반려 알림, 승인 시 등급·만료·이력 반영 |
| 관리자 결제 승인 | `client/src/features/admin/SubscriptionPaymentApprovalPanel.tsx`, `AdminOverviewPage.tsx` | 개발 결제 승인 아래 별도 구독결제 승인 탭, 2단계 승인·반려 UI |
| 판매자 플랜 판매 | `client/src/features/seller/SellerSubscriptionPage.tsx`, `SellerSubscriptionController.java`, `SellerSubscriptionService.java` | 관리자 등록 활성 상품만 카드로 표시하고 결제 요청·승인 대기·이력 표시 |
| 초기 상품 | `V56__seed_default_seller_subscription_products.sql` | 골드 운영 플랜 39,000원/1개월, 프리미엄 운영 플랜 79,000원/1개월을 중복 없이 시드 |
| 전국 서비스 지역 | `V55__service_regions.sql`, `server/.../region/ServiceRegion*.java`, `order/RegionController.java` | 제주 제외 전국 시군구 공식 코드 마스터, 주소 정규화·판매점 구 코드 단일 기준 |
| 주소·판매자 신청 | `SellerApplicationPage.tsx`, `KakaoAddressTools.tsx`, `SellerApplicationService.java`, `CheckoutPage.tsx`, `StoreFinder.tsx` | 로그인·기본 배송지 자동 채움, 카카오 주소 선택, DB 지역 코드 저장, 전국 지역 선택·탐색 |
| 구매자 사용방법 | `client/src/features/support/BuyerUsageGuidePage.tsx`, `router.tsx`, `ShopFooter.tsx`, `docs/BUYER_GUIDE_UX_RESEARCH.md` | 주문·시간 지정·매칭·배송·픽업·결제 공용 가이드와 푸터 앵커 |
| 고객 문의 상태 | `SupportInquiry.java`, `CustomerSupportService.java`, `SupportManagementPanel.tsx` | OPEN→IN_PROGRESS→ANSWERED→CLOSED, 답변·고객 알림·처리 완료 단방향 운영 흐름 |

## 안내 CTA·인증 복귀 라우팅 (2026-08-23)

| 경로 | 역할 |
| :--- | :--- |
| `client/src/features/seller/SellerServiceGuidePage.tsx` | 판매자 등록·구독·슬롯 CTA를 비로그인, 일반 회원, 승인 판매자, 판매자 워크플로 관리자 상태에 맞춰 분기한다. |
| `client/src/features/support/BuyerUsageGuidePage.tsx` | 장바구니(`/cart`)·주문 조회(`/orders`) 보호 CTA와 공개 고객센터(`/support`) CTA를 제공한다. |
| `client/src/app/RequireIdentity.tsx` | 비로그인 보호 경로의 path·query·hash를 `next`로 보존하고, 판매자 전용 경로의 일반 회원을 판매자 신청으로 회복한다. |
| `client/src/app/router.tsx` | 판매자 전용 라우트의 `/seller/application` fallback과 공개 고객센터 경로를 정의한다. |
| `client/src/features/auth/LoginPage.tsx`, `SignupPage.tsx`, `AuthCallbackPage.tsx` | 이메일·소셜 로그인과 콜백에서 내부 `next` 목적지만 검증해 복귀한다. |
| `client/src/features/auth/PasswordResetRequestPage.tsx`, `PasswordResetPage.tsx`, `client/src/lib/supabase.ts` | 비밀번호 재설정 이메일·콜백·재로그인 과정에도 `next` 목적지를 유지한다. |
| `client/src/components/shop/ShopFooter.tsx` | 공용 고객센터를 공개 `/support`에 연결하고 주문 조회는 보호 경로로 유지한다. |

## 고객문의 재처리·원문·서버 등록 시각 표시 (2026-08-23)

| 경로 | 역할 |
| :--- | :--- |
| `server/src/main/java/com/chulsooya/server/domain/support/SupportInquiry.java` | `OPEN → IN_PROGRESS → ANSWERED → CLOSED` 상태와 완료 문의의 안전한 `reopen()` 전이를 보관한다. 답변·접수 시각은 서버 `Instant`로 기록한다. |
| `server/src/main/java/com/chulsooya/server/domain/support/CustomerSupportService.java` | 관리자 상태 변경, 답변 등록, 완료 해지 시 고객 `INQUIRY_REOPENED` 재처리 알림을 처리한다. |
| `server/src/main/java/com/chulsooya/server/domain/support/SupportDtos.java` | 고객·관리자 문의 응답에 원문 `content`, 서버 `createdAt`, 서버 `answeredAt`을 제공한다. |
| `server/src/test/java/com/chulsooya/server/domain/support/SupportInquiryTest.java` | 상태 전이·완료 해지 정책을 검증한다. |
| `server/src/test/java/com/chulsooya/server/domain/support/CustomerSupportServiceNotificationTest.java` | 답변·완료 해지 시 고객 알림을 검증한다. |
| `client/src/features/admin/SupportManagementPanel.tsx` | 처리 시작·답변 완료·처리 완료와 두 단계 `후속 문제로 처리 완료 해지` 관리자 UI를 제공한다. |
| `client/src/features/support/CustomerSupportPage.tsx` | 고객 문의 원문, 접수 상태·서버 생성 시각, 철수야 답변·서버 답변 등록 시각을 카드로 표시한다. |
| `client/src/types/api.ts` | `SupportInquiry`의 `content`, `createdAt`, `answeredAt`, 상태 계약을 단일 관리한다. |
