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
| `src/features/checkout/` | 주소·구매자 정보·매칭 요청·결제 |
| `src/features/matching/` | 매칭 대기, 판매자 확인 대기 |
| `src/features/orders/` | 주문 추적, 클레임 |
| `src/features/seller/` | 가용 슬롯, 제안 큐, 물품 확인, 이행 |
| `src/features/admin/` | 카탈로그·판매자·매칭·클레임 관리 |
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
| `src/main/java/com/Chulsoo_ya/server/ServerApplication.java` | 부트 엔트리 |
| `.../common/` | 공통 응답 래퍼, 예외, 시간 제공자 |
| `.../domain/auth/` | Supabase JWT 사용자 동기화 및 `/api/auth/me` |
| `.../domain/catalog/` | 카테고리·상품 |
| `.../domain/cart/` | 장바구니 |
| `.../domain/order/` | 주문, 주문 품목, 상태 머신 |
| `.../domain/matching/` | 제안(Match_Offer), 응찰(Bid), 낙찰 트랜잭션 |
| `.../domain/store/` | 판매자 매장, 슬롯 회계, 슬롯 변경 로그 |
| `.../domain/payment/` | 결제·환불 |
| `.../domain/claim/` | 클레임·정산 HOLD |
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

