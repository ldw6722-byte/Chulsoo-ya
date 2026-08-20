# 진행 기록

갱신: 2026-08-12 · 기준 문서: `README.ko.md` · 규약: `AGENTS.md`

## 현재 상태

| 항목 | 상태 |
| :--- | :--- |
| 활성 단계 | Kordeal식 상품 쇼핑·상세·장바구니 UX와 1,600개 철물 카탈로그 적용 완료, 사용자 화면 확인 대기 |
| 백엔드 | Supabase PostgreSQL 프로파일 기동·Flyway V1~V3 적용·JWT 보호 경계 확인, `./gradlew test` **24건 통과** |
| 프론트엔드 | Kordeal식 메가 메뉴·상품 판매 카드·`/product/:id` 상세·장바구니 흐름 이식, lint 0 오류·production build 통과 |
| DB | 철물 **대 9·중 30·소 32** 카테고리, 모든 소분류당 상품 **50개**, 총 **1,600개** 적용 완료 |
| 이미지 | 요청에 따라 미등록 상태. 카드·상세에서 ‘상품 이미지 준비 중’ 플레이스홀더 표시 |
| Email Auth | 테스트 계정 개발용 인증 완료 처리. Supabase Email provider 저장 및 Custom SMTP 검토 필요 |
| Google/Kakao | UI와 Supabase 호출은 구현, Provider Client ID/Secret 설정·실연동은 미완료 |

## 쇼핑·카탈로그 이식 완료 목록

| 범위 | 구현 내용 | 데이터 연결 |
| :--- | :--- | :--- |
| 카테고리 체계 | 수공구·전동공구·철물·배관·전기·건축·접착·안전·생활철물의 대·중·소 계층 | `categories.parent_id`, `level`, `active`, `image_url` |
| 메가 메뉴 | Kordeal식 3열 hover 메뉴, 대→중→소 탐색 | `GET /api/categories/tree` |
| 홈 카테고리 | 9개 대분류 아이콘·추천·인기·신규 상품 판매 섹션 | `GET /api/categories`, `GET /api/products/featured`, `GET /api/products/popular` |
| 카탈로그 | 브레드크럼, 하위 분류 칩, 정렬, 5열 상품 판매 그리드 | `GET /api/categories/{code}`, `GET /api/products` |
| 상품 카드 | 빠른 매칭·할인 배지, 브랜드, 정가·할인가, 평점·리뷰, 장바구니 버튼 | 확장 `ProductResponse`, `cartApi.addItem` |
| 상품 상세 | Kordeal식 **`/product/:id`** URL, 이미지 갤러리/플레이스홀더, 수량·합계, 상세·규격·주문 안내 탭 | `GET /api/products/{id}`, `cartApi.addItem` |
| 장바구니 | 상품 상세 링크, 수량 변경·삭제, 주문 요약·주문 요청 연결 | `/api/cart/**` |
| 공개 탐색 | 로그인 없이 카테고리·상품 목록·상품 상세를 조회 | Supabase 보안 체인의 GET 카탈로그 permit 규칙 |
| 대량 시드 | 소분류별 실제 철물 취급 품목 조사 후 50개씩 JSON 정규화·안전 적용 | `hardware-products-1600.json`, `BulkCatalogSeedRunner` |

## 핵심 기술 결정

| 일자 | 결정 | 사유 |
| :--- | :--- | :--- |
| 2026-08-12 | HTTP는 Axios 단일 채널, 통신은 REST, 화면은 TSX로 고정 | 사용자 지시와 AGENTS 규약 |
| 2026-08-12 | Kordeal의 소스 구조·컴포넌트·Tailwind 테마를 철수야 도메인으로 이식 | 사용자 제공 참조 프로젝트의 UI/UX 재사용 요구 |
| 2026-08-12 | 계층형 카테고리는 자기 참조 `parent_id` + `level(1~3)`로 모델링 | 메가 메뉴·하위 카테고리 검색·운영 확장 지원 |
| 2026-08-12 | 상품 판매 정보는 기존 `products`에 비파괴 필드 확장 | 기존 장바구니·매칭 주문의 `product_id` 계약 보존 |
| 2026-08-12 | 카탈로그 교체는 주문이 없을 때만 허용 | 주문·결제 이력의 `product_id` 정합성 보존 |
| 2026-08-12 | 이미지 미등록 상품은 디자인 플레이스홀더로 렌더링 | 사용자 요청에 따른 이미지 작업 보류 |
| 2026-08-12 | Supabase Session pooler Hikari 풀을 최대 3으로 제한 | Pooler 연결 한도 초과 방지 |

## 검증 기록

| 검증 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 0 오류 |
| `cd client && npm run build` | 통과 |
| `cd server && ./gradlew test` | 통과, 24건 |
| 카테고리 트리 단위 테스트 | 대→중→소 정렬·중첩 조립 통과 |
| Supabase 공개 탐색 | 카테고리·상품 목록·상품 상세 모두 HTTP 200 |
| Supabase 대량 시드 | 총 1,600개, 소분류 32개 모두 정확히 50개 확인 |
| 로컬 REST E2E | 소분류 상품 50개 조회 → 상품 상세 → 장바구니 2개 추가 통과 |

## 남은 작업

- [ ] 브라우저에서 3단 메가 메뉴·상품 카드 클릭·`/product/:id` 상세·장바구니 시각 확인 및 피드백 반영
- [ ] 상품 이미지 업로드·리사이징·대표/상세 이미지 관리 기능 추가
- [ ] Supabase Dashboard에서 Email provider를 ON으로 저장하고, default SMTP 문제를 Custom SMTP 또는 운영용 메일 서비스로 해결
- [ ] Email 회원가입·로그인·`/api/auth/me` 동기화의 실제 브라우저 E2E 재확인
- [ ] Google OAuth: Google Cloud Client ID/Secret 등록 및 Supabase Provider 활성화
- [ ] Kakao OAuth: Kakao Developers REST API Key/Client Secret 등록 및 Supabase Provider 활성화

## 세션 핸드오프

다음 세션은 `AGENTS.md` → `PROGRESS.md` → `PROJECT_MAP.md` 순서로 읽는다. 카테고리 분류 근거는 `docs/HARDWARE_CATEGORY_RESEARCH.md`, 스키마·REST 계약은 `docs/CATEGORY_CATALOG_SCHEMA.md`, 1,600개 시드는 `server/src/main/resources/seed/hardware-products-1600.json`, UI 기준은 `docs/KORDEAL_UI_REFERENCE.md`에 있다.

## Recent UI adjustment (2026-08-12)
- Home quick scroll now contains exactly three links: product newest, popular hardware, affordable tools.
- Removed the fast-response and seller-operation quick links.
- Home section titles now exactly match quick-link labels; English badges removed.
- Frontend verification: npm run lint, npx tsc -b, and npm run build passed.


## Header refinement (2026-08-12)
- Home quick navigation and section titles are now: New Products, Popular Tools, Recommended Products.
- Removed all three section descriptions.
- Applied distinct blue, green, and red quick-link colors plus a compact Chulsoo-ya wordmark.
- Frontend verification: npm run lint, npx tsc -b, and npm run build passed.


## Signature wordmark refinement (2026-08-12)
- Replaced the decorative logo with a compact horizontal wordmark: the Cheolsu pair is emphasized as one high-contrast unit and Ya remains a clean companion character.
- Removed the sparkle, multi-color gradient, and single-character emphasis from the prior version.
- Design basis: simple, scalable wordmark with one controlled accent for header readability.
- Frontend verification: npm run lint, npx tsc -b, and npm run build passed.


## Product showcase refinement (2026-08-12)
- Quick navigation has persistent blue, green, and red underlines for New Products, Popular Tools, and Recommended Products.
- Replaced the boxed wordmark with a minimalist Chulsoo-ya wordmark and a controlled underline accent under Cheolsu.
- Rebuilt the three product showcase headers, grid spacing, cards, image placeholder, price hierarchy, and cart CTA for cleaner commerce presentation.
- Fixed one HomePage link encoding regression using a UTF-8 Node script.
- Frontend verification: npm run lint, npx tsc -b, and npm run build passed.


## Cyberpunk signature and bathroom event copy (2026-08-12)
- Replaced the previous plain wordmark with a Gaegu Korean handwritten-style signature using cyan, violet, and fuchsia neon treatment.
- Removed the HARDWARE CATEGORY label above the category grid.
- Updated bathroom event title and copy as requested.
- Frontend verification: npm run lint, npx tsc -b, and npm run build passed.


## Home reload and adult signature refinement (2026-08-12)
- Removed query-driven quick navigation so a refreshed home page always begins at the top.
- Quick links now navigate with transient route state and preserve smooth scrolling without a reload target in the URL.
- Replaced the prior light handwritten font with a joined adult brush-signature wordmark and cyan-violet-fuchsia treatment.
- Frontend verification: npm run lint (0 warnings, 0 errors), npx tsc -b, and npm run build passed.


## Supplied brand logo integration (2026-08-12)
- Added the user-supplied Cheolsuya logo to client/public/brand/chulsooya-logo.webp.
- Replaced the generated text signature in ShopHeader with the supplied logo while preserving the home navigation and accessible label.
- Frontend verification: npm run lint (0 warnings, 0 errors), npx tsc -b, and npm run build passed.


## Header icon tooltips (2026-08-12)
- Removed persistent text labels from dark mode, account, and cart controls in the header.
- Added labels that appear only on hover or keyboard focus, while retaining aria labels and the cart count badge.
- Frontend verification: npm run lint (0 warnings, 0 errors), npx tsc -b, and npm run build passed.


## Bathroom banner copy-only update (2026-08-12)
- Changed only the bathroom event title to 욕실 꾸미기 행사전 and the description to 욕실 분위기 전환.
- Preserved the existing banner layout, badge, CTA, icon, gradient, and carousel behavior.
- Frontend verification: npm run lint (0 warnings, 0 errors), npx tsc -b, and npm run build passed.


## Admin shortcut flow (2026-08-13)
- In the local Vite development environment, the header Admin link selects seeded admin user ID 2 only when no authenticated or development identity exists, then opens /admin.
- Existing authenticated users remain subject to the normal ADMIN role guard.
- Frontend lint/typecheck/build passed.


## Store directory and admin CRUD (2026-08-13)
- Added city/district store finder on home and /stores. City returns all city stores; district narrows to the selected district.
- Added /api/stores public directory search, /api/admin/stores ADMIN CRUD, directory profile fields, and Supabase V4 migration.
- Local seed creates 100 mock stores across 10 Seoul districts (10 per district). Verified city=100, district=10, admin=100 responses and CRUD cycle.



## 판매자 온보딩·관리자 심사 구현 (2026-08-13)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 기능 갭 감사 | 공유 기획 문서 11종과 저장소 명세·코드를 역할/API/DB 단위로 대조하고 `docs/FEATURE_GAP_AUDIT.md`에 기록 | 완료 |
| 신청 DB | Supabase 비파괴 `V7__seller_applications.sql`에 신청자·사업자 정보·NTS 상태·증빙 메타데이터·심사 이력을 추가 | 코드 완료, Supabase 기동 시 Flyway 적용 |
| 신청 API | `POST /api/seller-applications`, `GET /me`, 증빙 업로드와 관리자 목록·승인·반려 REST API 구현 | 완료 |
| 증빙 보안 | JPEG/PNG/PDF, 100KB~5MB, 파일 시그니처 검증; UUID 객체 키와 Supabase 비공개 Storage 업로드 어댑터 | 완료 |
| 역할 전환 | 관리자 승인 트랜잭션에서 증빙 확인 → `SELLER` 역할 전환 → 미검증 매장 1개 생성 | 완료 |
| 소비자 화면 | 마이철수의 `판매자 등록 신청` → 신청 정보 입력·증빙 제출·심사 상태 확인 화면 | 완료 |
| 관리자 화면 | 관리자 대시보드의 `판매자 신청 심사`에서 제출 상태 확인·승인·반려 | 완료 |
| TDD | 신청 승인/반려 상태 전이, 승인 시 역할·매장 생성, 증빙 파일 형식·용량·시그니처 테스트 | 통과 |

### 이번 검증

| 명령 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 기존 경고 3건·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |
| `cd server && .\gradlew.bat test` | 통과 (`gradle_exit=0`) |

### 다음 구현 순서

1. 매칭·응찰·가용 슬롯·자동 제한에 대한 실제 역할별 E2E와 패널티 이력 도메인을 보강한다.
2. 결제 스텁을 취소·전액/부분 환불·감사 이력을 갖춘 내부 결제 도메인으로 확장한다.
3. 클레임·정산 HOLD·증빙·문서·쿠폰·플랫폼 알림·관리자 재무 화면을 순서대로 구현한다.

### 외부 설정 대기

- Supabase Storage에 비공개 `seller-verification-documents` 버킷과 서버 서비스 키 권한을 설정해야 실제 증빙 업로드가 가능하다.
- NTS 실시간 진위확인은 공공데이터포털 API 키가 준비된 뒤 서버 어댑터에서 활성화한다. 현재는 사업자 정보와 증빙을 관리자 수동 심사로 처리한다.
- V7은 사용자가 Supabase 프로필로 `ServerApplication.java`를 기동할 때 Flyway가 적용한다. 서버를 임의로 백그라운드 기동하지 않는다.


## 매칭·응찰·가용 슬롯·패널티 고도화 (2026-08-13)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 시차 발송 강제 | 제안 도달 시각 이전의 응찰을 서버에서 `OFFER_NOT_AVAILABLE_YET`으로 차단 | 완료 |
| 슬롯 배분 | 한 번의 확산마다 신규 제안을 한 건만 생성하고, 등급별 0/3/6초 시차와 상위 등급 포화 시 즉시 오버플로를 적용 | 완료 |
| 라운드 로빈 | 지역·등급별 영속 커서(`dispatch_cursors`)로 동일 등급 판매자의 시작점을 순환 | 완료 |
| 낙찰 동시성 | 주문 행 잠금·낙찰자 유니크 제약·슬롯 예약→진행 전환·비낙찰 예약 해제를 기존 흐름과 함께 회귀 검증 | 완료 |
| 패널티 감사 | 물품 확인 2분 만료 시 주문별 단일 패널티 이력·24시간 응찰 제한·신뢰점수 -10을 트랜잭션으로 기록 | 완료 |
| 판매자 화면 | 운영 설정에서 현재 제한 사유·해제 예정·패널티 이력을 조회 | 완료 |
| 관리자 화면 | 판매자 운영 모니터에서 선택 판매점의 패널티·제한 이력을 확인 | 완료 |
| DB | Supabase V8(`penalties`), V9(`dispatch_cursors`) 비파괴 Flyway 마이그레이션 추가 | 코드 완료, Supabase 기동 시 적용 |

### 이번 검증

| 명령 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 기존 경고 3건·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |
| `cd server && .\gradlew.bat test` | 통과 (`all_validation_exit=0`) |

### 다음 구현 순서

1. 결제 스텁을 멱등 결제 시도·취소·전액/부분 환불·감사 이력으로 확장한다.
2. 클레임 접수·증빙·정산 HOLD·교환/부분 교체·결정적 문서를 역할별로 구현한다.
3. 쿠폰·플랫폼 알림·관리자 재무·운영 거버넌스를 구현한다.

### 외부 적용 조건

- V8·V9는 사용자가 Supabase 프로필로 `ServerApplication.java`를 한 번 실행하면 Flyway가 순차 적용한다.
- Redis 분산 락과 앱 푸시 묶음 발송은 외부 인프라가 준비된 뒤 현재 PostgreSQL 행 잠금·영속 커서를 대체/보완하는 고도화 항목으로 남긴다.


## 결제 취소·전액/부분 환불·감사 이력 (2026-08-13)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 결제 멱등성 | 같은 주문의 재시도는 기존 결과를 반환하고, 다른 주문의 결제 키 재사용은 서버가 차단 | 완료 |
| 소비자 취소 | 결제 전 주문 취소와 `PAID` 직후 전액 결제 취소를 분기 처리 | 완료 |
| 관리자 환불 | `PAID`·`PREPARING` 주문의 전액/부분 환불, 환불 가능 잔액 검증, 전액 환불 시 주문 종료 | 완료 |
| 동시성 | 소비자 취소·관리자 환불의 잠금 순서를 주문→결제로 통일하고, 결제 비관적 잠금으로 잔액을 보호 | 완료 |
| 감사 이력 | 요청자·처리자·사유·환불 유형·멱등성 키·PG 개발 스텁 결과·처리 시각을 `refunds`에 기록 | 완료 |
| 소비자 화면 | 주문 상세에서 결제 상태·환불 가능 잔액·취소/환불 이력을 표시하고 안전한 취소 요청 제공 | 완료 |
| 관리자 화면 | 재무 메뉴에서 주문 번호로 결제 조회, 전액·부분 환불, 감사 이력 확인 제공 | 완료 |
| DB | Supabase V10(`refunds`) 비파괴 Flyway 마이그레이션 추가 | 코드 완료, Supabase 기동 시 적용 |

### 결제 환불 검증

| 명령 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 기존 경고 3건·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |
| `cd server && .\gradlew.bat test` | 통과 (`all_payment_validation_exit=0`) |

### 다음 구현 순서

1. 클레임 접수·증빙·정산 HOLD·교환/부분 교체·결정적 문서를 역할별로 구현한다.
2. 쿠폰·플랫폼 알림·관리자 재무·운영 거버넌스를 구현한다.
3. OAuth·외부 알림·웹훅·접근성·보안 오류 상태를 보강한다.

### 외부 적용 조건

- V10은 사용자가 Supabase 프로필로 `ServerApplication.java`를 한 번 실행하면 Flyway가 순차 적용한다.
- 현재 PG 취소·환불은 개발용 결정적 스텁 키를 감사 이력에 남긴다. 실제 자금 이동은 이후 서버 전용 PG 어댑터와 서명 검증 웹훅 연동에서 대체한다.


## 클레임·증빙·정산 HOLD·결정적 문서 (2026-08-13)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 소비자 | 주문 상세에서 반품·교환·부분 교체 접수, 사유·상세 내용·사진/영상 증빙 제출 | 완료 |
| 증빙 보안 | JPG·PNG·WEBP·MP4 MIME·시그니처·용량 이중 검증, UUID 객체 키 기반 비공개 Storage 저장 | 완료 |
| 정산 HOLD | 클레임 생성 트랜잭션에서 주문별 정산 레코드 생성 또는 잠금 후 `HOLD`, 불변 이벤트 기록 | 완료 |
| 판매자 | 낙찰 판매자만 신규 클레임 목록·상세·증빙 메타데이터를 보고 접수·회수·재발송·중재 요청 처리 | 완료 |
| 관리자 | 상태별 운영 큐, 증빙·처리 타임라인 검토, 정산 해제·기각·전액 환불 중재 | 완료 |
| 환불 연동 | 관리자 전액 환불 결정이 기존 결제 환불 감사 이력과 결제 잔액 갱신을 재사용 | 완료 |
| 역할 알림 | 소비자·낙찰 판매자·관리자에게 클레임 접수, 판매자·관리자 처리 결과를 저장형 알림으로 기록 | 완료 |
| 처리 문서 | AI 사용 없이 확정 DB 값만 주입한 클레임 처리 확인서 생성·관리자 조회 | 완료 |
| DB | Supabase V11(`claims`, `claim_evidences`, `claim_events`, `settlements`) 비파괴 Flyway 마이그레이션 | 코드 완료, Supabase 기동 시 적용 |

### 클레임 검증

| 명령 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 기존 경고 3건·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |
| `cd server && .\gradlew.bat test` | 통과 |

### 외부 적용 조건

- Supabase Storage에 비공개 버킷 `claim-evidences`를 생성해야 실제 증빙 업로드가 가능하다.
- 현재 알림은 DB 저장형 알림으로 먼저 보존한다. FCM·알림톡·SMS·이메일은 외부 발송 어댑터 설정 단계에서 이 이벤트를 구독한다.
- V11은 Supabase 프로필로 서버를 한 번 기동하면 Flyway가 순차 적용한다.

### 다음 구현 순서

1. 쿠폰 발행·사용·취소 복구와 관리자 쿠폰 운영을 구현한다.
2. 플랫폼 알림 고도화·관리자 재무·거버넌스 운영 도구를 구현한다.
3. OAuth·실시간 외부 알림·접근성·보안 오류 상태를 보강한다.


## 무상 쿠폰·플랫폼 알림·운영 도구 (2026-08-13)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 쿠폰 정책 | 코드·제목·정액 할인·최소 주문·시작/만료·활성 상태를 관리자가 생성 | 완료 |
| 회원 발행 | 관리자가 회원 번호 기준으로 무상 쿠폰 발행, 발행 이벤트·플랫폼 알림 기록 | 완료 |
| 소비자 선택 | 체크아웃에서 사용 가능 쿠폰·최소 주문 조건·유효기간 확인 후 발행본 선택 | 완료 |
| 서버 할인 | 클라이언트 할인값을 신뢰하지 않고 사용자 쿠폰을 잠금 조회해 서버에서 할인·주문 연결 확정 | 완료 |
| 취소 복구 | 소비자 주문 취소에서만 유효한 적용 쿠폰을 한 번 복구. 환불·클레임 전액 환불은 복구하지 않음 | 완료 |
| 감사 이력 | 발행·적용·복구·만료 상태를 `coupon_events`에 append-only 기록 | 완료 |
| 관리자 화면 | 관리자 대시보드의 쿠폰 운영 메뉴에서 정책 등록·회원 발행 제공 | 완료 |
| DB | Supabase V12(`coupons`, `coupon_issues`, `coupon_events`, `orders.coupon_issue_id`) 비파괴 Flyway 마이그레이션 | 코드 완료, Supabase 기동 시 적용 |

### 쿠폰 검증

| 명령 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 기존 경고 3건·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |
| `cd server && .\gradlew.bat test` | 통과 |

### 외부 적용 조건

- 만료 임박 알림은 현재 발행 시 안내와 상태 조회 시 만료 처리까지 구현되어 있다. 백그라운드 이메일·푸시·알림톡 발송은 운영 배포 환경과 발송 공급자 결정 후 별도 배치/이벤트 처리로 연결한다.
- V12는 Supabase 프로필로 서버를 한 번 기동하면 Flyway가 순차 적용한다.

### 다음 구현 순서

1. Supabase Email, Google OAuth, Kakao OAuth 운영 콘솔 설정과 리다이렉트·메일 전달 실연동을 확인한다.
2. 외부 발송(FCM·알림톡·SMS), PG 웹훅 서명 검증, 사업자 진위확인 어댑터를 운영 키로 연결한다.
3. 소비자·판매자·관리자 종단 간 시나리오와 권한·오류·접근성 회귀를 최종 검증한다.

## 기본 주소지·다중 배송지 관리 및 주문 요청 연동 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 기본 주소지 | 첫 배송지는 자동 기본 지정, 이후 기본 주소지 전환·삭제 후 대체 기본 주소지 자동 지정 | 완료 |
| 배송지 CRUD | 배송지 이름·받는 분·연락처·서울특별시 구·도로명·상세 주소 등록·수정·삭제 | 완료 |
| 매칭 지역 | 주문 요청에서 저장 배송지를 선택하면 주소·상세 주소·구 매칭이 자동 반영 | 완료 |
| 주문 화면 | 기본 주소지와 동일 버튼, 저장 배송지 선택, 직접 주소 입력 유지 | 완료 |
| DB | Supabase Flyway V23 (delivery_addresses, 기본 배송지 부분 유니크 인덱스) 적용 | 완료 |
| API | /api/delivery-addresses GET·POST·PATCH·DELETE 및 기본 지정 PATCH | 완료 |

### 배송지 검증
| 검증 | 결과 |
| :--- | :--- |
| DeliveryAddressTest | 통과 |
| 실제 API | 테스트 구매자 01로 생성·수정·기본 지정·삭제·정리 검증 완료 |
| Supabase 마이그레이션 | V23 적용 완료 |
| 클라이언트 | lint, tsc, build 통과 |
| 서버 | gradlew test 통과 |

## 마이철수 주문 현황·배송지 탭 분리 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 로그인 전용 | 인증 라우트 가드를 유지하고 마이철수 하단의 로그인 버튼 제거 | 완료 |
| 메뉴 동선 | 기존 배송지 관리 메뉴를 주문하기(`/checkout`)로 변경, 배송지 관리는 별도 `/my/delivery-addresses` 탭으로 분리 | 완료 |
| 본문 전환 | 마이철수 고정 배송지 관리 패널을 현재 장바구니 상품·수량·금액·주문하기 상태 패널로 교체 | 완료 |
| 배송지 탭 | 기본 주소지·현장 배송지 CRUD UI를 독립 페이지에서 제공 | 완료 |

### 마이철수 탭 분리 검증
| 명령 | 결과 |
| :--- | :--- |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run lint` | 경고·오류 0건 |
| `cd client && npm run build` | 통과 |

## 회원정보 저장·관리자 회원관리 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 회원정보 탭 | 로그인 회원이 이름·휴대전화·이메일·권한·가입일을 확인하고 이름·휴대전화를 저장·수정 | 완료 |
| 인증 동기화 | 회원이 직접 저장한 이름은 다음 Supabase 인증 동기화에서 덮어쓰지 않고 이메일만 동기화 | 완료 |
| 관리자 회원관리 | 구매자·판매자의 이름·이메일·연락처·권한·가입일 조회, 검색·역할 필터, 판매자 역할 전환 | 완료 |
| 권한 | 회원은 본인 프로필만 조회·수정, 관리자 목록은 `/api/admin/users` 관리자 권한으로 제한 | 완료 |
| DB | 기존 `users` 테이블의 name·phone·role·created_at 재사용, 별도 마이그레이션 불필요 | 완료 |

### 회원정보 검증
| 검증 | 결과 |
| :--- | :--- |
| UserProfileTest·AuthUserServiceTest | 통과 |
| 실제 API | 테스트 구매자 프로필 저장 후 일반 관리자 회원 목록 반영 검증, 원래 이름으로 복원 완료 |
| 클라이언트 | lint, tsc, build 통과 |
| 서버 | gradlew test 통과 |

## 회원정보 기본 주소지·하단 추가 배송지 동선 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 회원정보 | 이름·연락처 아래에서 기본 주소지(받는 분·연락처·서울시 구·도로명·상세 주소)를 직접 저장·수정 | 완료 |
| 배송지 관리 | 기본 주소지는 회원정보에서만 수정하고, 배송지 관리 화면에는 별도 현장·수령지만 표시 | 완료 |
| 추가 UX | 배송지 관리 하단의 `+ 배송지 추가하기` 클릭 후에만 추가 폼을 열어 생성·수정·삭제 | 완료 |
| 주문 요청 | 기본 주소지·별도 배송지 모두 기존 체크아웃 저장 배송지 선택으로 유지 | 완료 |

### 주소지 동선 검증
| 검증 | 결과 |
| :--- | :--- |
| 실제 API | 테스트 구매자 02로 기본 주소지 1건·추가 배송지 1건 생성, 기본 1건 보장, 삭제 정리 완료 |
| 클라이언트 | lint, tsc, build 통과 |

## 회원정보 행 단위 수정 화면 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 화면 구조 | 첨부 참고 화면처럼 좌측 항목명·우측 내용의 행 단위 표 구조로 변경 | 완료 |
| 계정 정보 | 이메일, 이름, 휴대전화, 계정 보안 안내, 가입 정보 행 제공 | 완료 |
| 수정 동선 | 이름·휴대전화 행의 변경 버튼으로 입력을 열고 하단 회원정보 저장으로 DB 반영 | 완료 |
| 배송지 | 기본 배송지 편집을 같은 표의 배송지 행에 유지하고, 추가 배송지 관리 화면으로 연결 | 완료 |
| 인증 제약 | 이메일·비밀번호는 Supabase 인증 제공자가 관리하므로 현재 화면에서는 안내만 표시 | 완료 |

### 회원정보 표 화면 검증
| 검증 | 결과 |
| :--- | :--- |
| 클라이언트 | lint, tsc, build 통과 |

## 배송지 기본 선택·주문 요청 자동 적용 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 기본 주소지 표시 | 회원정보에서 작성한 `기본 주소지`를 배송지 관리 목록에도 표시 | 완료 |
| 배송지 선택 | 기본·추가 배송지의 `주문에 사용` 라디오 선택으로 기본 배송지 변경 | 완료 |
| 영속성 | 선택된 주소를 `default_address`로 저장하고 다른 주소의 기본 선택 자동 해제 | 완료 |
| 주문 요청 | `/checkout` 진입 시 기본 배송지를 주소·상세주소·매칭 지역에 자동 적용 | 완료 |
| 주문 중 변경 | 주문 요청의 저장한 배송지 버튼으로 등록 배송지를 즉시 변경하고 매칭 지역 재확인 | 완료 |

### 배송지 선택 검증
| 검증 | 결과 |
| :--- | :--- |
| 실제 API | 테스트 구매자 03의 기본 주소지와 추가 배송지를 생성하고, 추가 배송지 선택 후 default_address 전환 검증·정리 완료 |
| 클라이언트 | lint, tsc, build 통과 |

## 결제수단 관리 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 마이철수 메뉴 | `결제수단` 탭과 `/my/payment-methods` 로그인 전용 경로 추가 | 완료 |
| 결제수단 유형 | 쿠페이머니 없이 은행계좌·신용/체크카드 등록·목록·삭제 지원 | 완료 |
| 팝업 흐름 | 목록 → 결제수단 선택 → 은행 선택·계좌 입력 또는 카드 입력을 페이지 이동 없이 모달에서 처리 | 완료 |
| DB 저장 | provider_name·method_type·마지막 네 자리만 보관, 전체 카드·계좌번호는 저장·응답하지 않음 | 완료 |
| 권한 | 로그인한 본인 결제수단만 조회·등록·삭제 | 완료 |

### 결제수단 검증
| 검증 | 결과 |
| :--- | :--- |
| 단위 테스트 | 카드·계좌의 마지막 네 자리 마스킹 테스트 통과 |
| 실제 API | 테스트 구매자 02로 계좌·카드 등록, 마스킹 응답, 삭제·정리 완료 |
| DB | V24 payment_methods 마이그레이션 Supabase 적용 완료 |
| 전체 빌드 | client lint·tsc·build, server test 통과 |

## 전역 다크모드 토글·유지 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 테마 상태 | `ThemeProvider`가 light·dark 상태를 HTML 루트 클래스에 적용 | 완료 |
| 유지 | `chulsooya-theme` localStorage에 사용자 선택을 저장해 페이지 이동·새로고침 후 복원 | 완료 |
| 사용자 화면 | 쇼핑 헤더에 아이콘 토글 추가, 검색·메뉴·계정·탐색 영역 다크 표면 보정 | 완료 |
| 관리자 화면 | 관리자 상단 헤더에 아이콘 토글 추가, 레거시 관리자 패널의 배경·테두리·텍스트 대비 보정 | 완료 |
| 접근성 | 토글의 aria-pressed와 라이트·다크 모드 전환 레이블 제공 | 완료 |

### 다크모드 검증
| 검증 | 결과 |
| :--- | :--- |
| 클라이언트 | lint 경고 0, tsc·build 통과 |
| 서버 회귀 | gradlew test 통과 |

## 개발 결제 승인 탭 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 관리자 메뉴 | 왼쪽 메뉴 `개발 검증 → 개발 결제 승인` 별도 탭 추가 | 완료 |
| 대기 목록 | 판매자 재고 확인을 마쳐 `PAYMENT_PENDING` 상태인 주문만 조회 | 완료 |
| 임시 승인 | 관리자만 주문별 `개발용 결제 승인`을 실행해 `PAYMENT_PENDING → PAID → PREPARING` 전환 | 완료 |
| 결제 이력 | `DEVELOPMENT_ADMIN_APPROVAL` 결제수단과 개발용 거래 키를 남겨 실제 결제와 구분 | 완료 |
| 멱등성 | 주문 단위 잠금과 기존 완료 결제 확인으로 중복 승인 요청은 상태를 반복 전환하지 않음 | 완료 |
| 운영 전환 | 실제 PG 결제창·서버 승인·웹훅 서명 검증으로 대체 필요 | 기록 완료 |

### 개발 결제 승인 검증
| 검증 | 결과 |
| :--- | :--- |
| 단위 테스트 | 관리자 승인 시 결제 대기 주문이 준비 중으로 전환되고 비관리자는 차단되는 테스트 통과 |
| 실제 API | 일반 관리자 대기 목록 200·일반 구매자 접근 403 확인 |
| 프론트엔드 | lint 경고 0, tsc·build 통과 |
| 백엔드 | 전체 gradlew test 통과, 최신 JAR 재시작 |

## 2026-08-17 — 개발 결제 승인 히스토리 및 실제 강남 매칭 검증

- 관리자 `개발 결제 승인` 탭 하단에 `승인 및 처리 상태 히스토리`를 추가했다. 개발 결제 승인 완료 건은 결제 승인 시각, 결제 상태, 현재 주문 처리 상태, 판매점, 주문 금액을 표시한다.
- `GET /api/admin/payments/development-history`는 `DEVELOPMENT_ADMIN_APPROVAL` 결제 기록만 역시간순으로 반환하며 관리자만 접근할 수 있다.
- 구매자 01의 기본 배송지가 동대문구였던 상태를 확인하고, 실제 매칭 검증을 위해 강남구 테헤란로 123으로 수정했다. 지역 확인 결과와 판매자 04 역할 계정(`test.seller01@chulsooya.dev`)의 판매점 구 코드가 `GU_C99`로 일치했다.
- 판매점 `테스트 강남 철물점`은 검증 완료, 주문 수신 가능, 가용 슬롯 3개임을 확인했다. 구매자 주문 요청 → 판매자 응찰 → 판매자 재고 확인으로 주문 #9를 `PAYMENT_PENDING`까지 이동했다.
- 슈퍼어드민이 관리자 화면에서 주문 #9를 직접 개발 결제 승인했다. 구매자·판매자 주문 상태는 `PREPARING`, 결제 기록은 `PAID`, 개발 승인 대기 목록에서는 제거됨을 실제 API로 검증했다.
- 검증: `npm run lint` 경고 0건, `npx tsc -b`, `npm run build`, `gradlew test` 통과.


## 2026-08-17 — 개발 정산·환불 및 결제 승인 히스토리 연동

관리자 `정산 · 환불` 탭을 결제 승인 히스토리 기반 정산 화면으로 확장했다. 개발 환경 수수료율은 서버 설정 `app.settlement.commission-bps=1000`으로 분리해 **10.00%**로 계산하며, 실제 PG 이체는 수행하지 않는다. 결제 승인 시 정산 레코드를 생성하고, 부분·전액 환불 시 환불액·수수료·판매자 정산 예정액을 즉시 재계산한다.

주문 #9로 실제 흐름을 검증했다. 슈퍼어드민 직접 개발 결제 승인 뒤 1,000원 부분 환불과 136,500원 전액 환불을 순서대로 수행했고, 결제는 `REFUNDED`, 정산은 `CANCELLED`, 누적 환불액은 137,500원, 판매자 정산 예정액은 0원으로 DB에 저장됐다. 관리자 화면에는 판매점명, 승인 금액, 수수료, 환불, 정산 예정, 정산 상태, 결제 승인 시각이 표시된다.

검증: 실제 Supabase DB API 검증, Chrome 관리자 화면 확인, `npm run lint`, `npx tsc -b`, `npm run build`, `gradlew test` 통과.


## 판매자 신청 증빙 문서 업로드 (V26 완료)

판매자 신청에 **사업자등록증**과 **통장사본**을 각각 필수 이미지 증빙으로 추가했다. 전용 Supabase Storage 버킷 seller-verification-documents는 비공개로 생성됐고, JPG/PNG만 허용하며 파일별 최대 5MB로 제한한다.

서버·클라이언트는 100KB 이상 5MB 이하, JPG/PNG, 짧은 변 800px 이상, 긴 변 6000px 이하를 검증한다. 서버는 파일 서명, 실제 이미지 디코딩, 해상도를 재검증한다. 객체 키는 seller-applications/{applicationId}/{documentType}/{uuid} 형식이며 DB에는 공개 URL이 아니라 object key·content type·size만 저장된다. 관리자가 조회할 때만 10분 서명 URL을 생성한다.

V26 마이그레이션은 seller_applications에 통장사본 object key·content type·size 필드를 추가했다. 관리자 승인은 사업자등록증과 통장사본이 모두 제출돼야 가능하다. 판매자 신청 화면은 드래그앤드롭과 파일 찾기를 모두 제공하며, 관리자 판매자 신청 심사와 판매자 운영 상세에서 비공개 문서를 미리보기로 검토한다.

실제 검증에서는 테스트 구매자 02의 신청 ID 1에 두 문서를 각각 1,921,453 bytes PNG로 업로드했고, 일반 관리자 서명 URL 두 건의 이미지 응답을 확인했다. 신청은 승인하지 않고 PENDING 상태로 유지했다. 프론트엔드 lint 0건·TS 빌드·Vite build와 서버 전체 Gradle 테스트도 통과했으며, 최신 서버는 V26 적용 JAR로 8080에서 실행 중이다.


### 판매자 신청 폼 내 단일 문서 제출 동선 보정

판매자 신청 화면에 사업자등록증과 통장사본 선택 영역을 기본 정보 입력 영역 아래에 직접 배치했다. 사용자는 드래그앤드롭 또는 파일 찾기로 두 문서를 선택한 뒤 판매자 신청 접수 버튼 한 번으로 신청 DB 저장과 두 비공개 스토리지 업로드를 순차 실행한다. 두 문서 중 하나라도 없거나 이미지 기준을 충족하지 않으면 신청 전에 안내한다. 신청 저장 후 일부 업로드가 실패하면 신청 상태 화면에서 재시도할 수 있도록 유지한다.

## 판매자 등록 해지 신청 및 관리자 승인 연동 (V27 완료)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 판매자 메뉴 | 마이철수는 현재 역할이 **SELLER**이면 `판매자 등록 신청` 대신 `판매자 등록 해지 신청`만 표시한다. 신청이 대기 상태면 검토 중 문구를 표시한다. | 완료 |
| 신청 흐름 | `/seller/deactivation`에서 해지 사유를 제출하고, 이미 접수된 요청은 중복 생성하지 않고 상태로 반환한다. | 완료 |
| 관리자 처리 | 회원관리에서 대기 요청 수·신청 사유·신청 시각을 표시하며, 승인 또는 반려할 수 있다. | 완료 |
| 승인 효과 | 승인 시 판매자 역할을 일반 회원으로 변경하고, 해당 판매점의 영업 및 주문 수신 상태를 비활성화한다. | 완료 |
| 역할 보호 | 일반 회원 전환은 관리자 역할 직접 변경으로는 처리할 수 없고, 해지 신청 승인 API만 사용한다. 판매자 활성화에는 검증된 판매점이 필요하다. | 완료 |
| 지연 로딩 보정 | 해지 요청 응답에서 판매자 이름을 조회할 때 발생한 `LazyInitializationException`을 컨트롤러 트랜잭션 범위로 보정했다. | 완료 |

### 판매자 해지 신청 검증

| 검증 | 결과 |
| :--- | :--- |
| 판매자 01 상태 | `test.seller01@chulsooya.dev`(사용자 ID 107)의 역할이 **SELLER**로 유지됨을 본인·관리자 API에서 확인했다. |
| 판매자 02 신청 | `test.seller02@chulsooya.dev`(사용자 ID 108)의 요청 ID 1이 **PENDING** 상태로 조회된다. |
| 관리자 알림 | `GET /api/admin/seller-deactivations`가 대기 요청 ID 1을 반환해 회원관리 알림 섹션과 연결됨을 확인했다. |
| API 오류 회귀 | 지연 로딩 오류 보정 후 판매자 본인 요청 조회·관리자 대기 목록 조회가 모두 200 응답으로 통과했다. |
| 클라이언트 | `npm run lint` 경고·오류 0건, `npx tsc -b`, `npm run build` 통과. |
| 서버 | `./gradlew.bat test` 통과, V27 포함 최신 JAR를 8080 포트에서 실행 중. |

> 테스트 데이터 유지: 판매자 02의 요청 ID 1은 관리자 대기 알림·승인 UI 확인을 위해 **PENDING**으로 유지한다. 실제 승인 검증이 필요할 때에는 이 요청을 처리해 판매점 비활성화와 일반 회원 전환을 확인한다.

## 관리자 판매자 신청 심사 — 전체 입력 정보 조회 보완 (2026-08-17)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 심사 진입 | 목록의 `문서 검토` 버튼을 `전체 정보·문서`로 변경했다. | 완료 |
| 가입자 정보 | 신청자 이름·가입 이메일·가입 연락처를 상세 패널에 표시한다. 기존 계정에 가입 연락처가 없으면 `미입력`으로 명시한다. | 완료 |
| 사업자·판매점 정보 | 판매점명, 대표자명, 사업자등록번호, 개업일, 시·구, 사업장 주소, 사업장 연락처, 취급 품목을 한 화면에서 확인한다. | 완료 |
| 심사 정보 | 신청 상태, 국세청 확인 상태·메시지, 신청·심사 시각, 심사 담당자 ID, 반려 사유를 함께 표시한다. | 완료 |
| 증빙 문서 | 기존의 비공개 사업자등록증·통장사본 서명 URL 미리보기는 동일 상세 패널 하단에서 유지한다. | 완료 |
| API 범위 | 관리자 전용 판매자 신청 목록 응답에 신청자 연락처, 원문 사업자등록번호, 개업일을 추가했다. | 완료 |

### 전체 정보 심사 검증

| 검증 | 결과 |
| :--- | :--- |
| 단위 테스트 | 관리자 응답이 가입 연락처·개업일·사업장 주소·사업장 연락처·취급 품목을 포함하는 테스트를 추가하고 통과했다. |
| 실제 API | 테스트 신청 ID 1에서 신청자·사업장·사업자·개업일·취급 품목·증빙 상태가 관리자 API로 반환됨을 확인했다. |
| 클라이언트 | `npm run lint` 경고·오류 0건, `npx tsc -b`, `npm run build` 통과. |
| 서버 | `./gradlew.bat test` 통과, 최신 JAR를 8080 포트에서 재시작했다. |

## 승인 판매자 신청 → 판매자 운영 등록 판매점 연동 점검 (2026-08-17)

| 점검 항목 | 실제 확인 결과 |
| :--- | :--- |
| 승인 신청 | 승인 상태 판매자 신청은 1건이다. 신청 ID 1의 신청자 계정은 `SELLER` 역할로 전환되어 있다. |
| 판매점 목록 연동 | 신청자 이메일을 기준으로 판매자 운영의 등록 판매점에서 동일 소유자 판매점을 찾았고, `문서 검증 테스트 철물점`이 존재한다. |
| 판매점 명칭 | 신청서 판매점명과 등록 판매점명이 모두 `문서 검증 테스트 철물점`으로 일치한다. |
| 핵심 정보 일관성 | 시·구, 사업장 주소, 사업장 연락처, 취급 품목이 신청서와 등록 판매점 데이터에서 모두 일치한다. |
| 구현 판단 | 승인 처리 서비스가 신청서 값을 단일 원본으로 사용해 판매점을 생성하고 있으므로, 이번 점검에서는 추가 보정이 필요하지 않았다. |

## 판매점 등록·승인 DB 정합성 자동 점검 스크립트 (2026-08-17)

| 항목 | 내용 |
| :--- | :--- |
| 실행 파일 | `server/scripts/auditSellerStoreConsistency.mjs` |
| 점검 기준 | 승인 신청 ↔ 회원 역할 ↔ 등록 판매점 연결, 판매점명·시·구·주소·연락처·취급 품목, 승인 상태·주문 수신 상태를 대조한다. |
| 결과 | 오류가 없으면 종료 코드 0, 실행 실패는 1, 정합성 오류는 2로 종료한다. `--json`으로 자동 처리용 보고서를 출력할 수 있다. |
| 보안 | 관리자 이메일·비밀번호는 현재 터미널 환경 변수로만 전달하며 스크립트나 저장소에 저장하지 않는다. 점검은 읽기 전용 API만 호출한다. |
| 테스트 | `auditSellerStoreConsistency.test.mjs`에서 정상 연결, 판매점명·취급 품목 불일치, 등록 판매점 누락을 검증한다. |
| 실제 실행 | 승인 신청 1건·등록 판매점 103건을 점검했고 오류 0건·경고 0건으로 `PASS`를 확인했다. |
| 사용 문서 | `server/scripts/README.seller-store-consistency.md`에 실행 환경 변수·종료 코드·판정 규칙을 기록했다. |

## 관리자 메뉴 편의성 정리 — 행사 재배치·클레임 진입 제거 (2026-08-17)

| 변경 | 결과 |
| :--- | :--- |
| 행사 · 이벤트 관리 | 관리자 좌측 메뉴에서 `쿠폰 운영` 바로 아래로 이동했다. `EventCampaignManagementPanel` 연결과 행사 CRUD·히어로 배너 기능은 유지했다. |
| 클레임 운영 | 좌측 메뉴, 대시보드 빠른 진입 카드, 탭 타입·저장 탭 판별·렌더링 분기에서 제거했다. 기존 클레임 컴포넌트와 API·DB는 삭제하지 않았다. |
| 기존 저장 탭 | 이전 세션에 `claims`가 저장돼 있어도 유효 탭 목록에서 제외되므로 관리자 대시보드 홈으로 안전하게 복귀한다. |
| 검증 | 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build`를 모두 통과했다. |
\n## 판매자 신청 심사 대기열·완료 히스토리 및 신규 5건 실데이터 테스트 (2026-08-17)\n\n| 항목 | 구현·검증 결과 |\n| :--- | :--- |\n| 대기열 | 관리자 판매자 신청 심사 화면 상단에는 `PENDING`·`MANUAL_REVIEW` 신청만 접수 시각 오름차순으로 표시한다. |\n| 완료 히스토리 | `APPROVED`·`REJECTED` 신청은 하단 히스토리로 분리하고 입력 정보·심사 정보·비공개 문서 미리보기 연결을 유지한다. |\n| 연속 심사 | 대기 목록의 각 신청에 승인·반려 버튼을 제공한다. 처리 완료 후 목록을 새로고침해 다음 대기 신청이 상단에 유지되며, 완료 건은 히스토리로 이동한다. |\n| 서버 정렬 | 관리자 전체 신청 목록도 `submittedAt` 오름차순으로 조회하도록 `findAllByOrderBySubmittedAtAsc`를 적용했다. |\n| 신규 계정 | `test.sellerapp01`~`05@chulsooya.dev` 5개 계정을 실제 Supabase Auth에 생성하고 사용자 프로필을 저장했다. |\n| 실제 신청·문서 저장 | 신청 ID 2~6을 모두 `PENDING`으로 제출했다. 각 신청은 사업자등록증·통장사본 JPEG를 실제 비공개 스토리지에 저장하고 두 제출 상태를 확인했다. |\n| 문서 검증 | 5개 신청이 접수 순서 1~5로 정렬되며, 각 문서의 저장 크기 318KB~431KB와 관리자 서명 URL 반환을 실제 API에서 확인했다. |\n| 품질 검증 | 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build`; 백엔드 `gradlew test bootJar`를 통과했다. |\n
## 판매자 신청 심사 인라인 상세·완료일 범위 필터 (2026-08-17)

| 항목 | 구현·검증 결과 |
| :--- | :--- |
| 인라인 상세 | 심사 대기와 심사 완료 히스토리 모두에서 `전체 정보·문서`를 누른 해당 행 바로 다음에 신청 정보와 두 문서 미리보기가 확장된다. 목록 하단의 독립 상세 패널은 제거했다. |
| 상세 토글 | 같은 항목을 다시 누르거나 `접기`를 누르면 해당 행의 상세만 닫힌다. 다른 항목을 누르면 선택 위치가 즉시 해당 항목 아래로 이동한다. |
| 완료일 필터 | 심사 완료 히스토리에 시작일·종료일 HTML 날짜 입력과 기간 초기화 버튼을 추가했다. `reviewedAt`의 한국 시간 날짜가 선택 범위에 포함되는 승인·반려 건만 표시한다. |
| 대기열 유지 | 대기 목록은 접수 시각 기준 오름차순을 유지하고, 히스토리 기간 필터는 완료된 신청에만 적용한다. |
| 품질 검증 | 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build`를 통과했다. 소스 검증으로 인라인 행 렌더링, 날짜 입력 2개, `reviewedAt` 범위 조건, 기존 하단 독립 패널 제거를 확인했다. |

## 판매점 인라인 후기 관리 및 관리자 메모 (2026-08-17)

| 항목 | 구현·검증 결과 |
| :--- | :--- |
| 판매점 행 인라인 관리 | 판매자 운영에서 판매점명을 누르면 해당 판매점 행 바로 아래에 후기·판매자 대댓글·증빙 문서·관리자 메모 관리 영역이 열린다. 기존 별도 후기 버튼은 제거했다. |
| 후기 없음 상태 | 선택 판매점에 거래 후기가 없으면 해당 판매점 아래에 `등록된 후기가 없습니다.`를 표시한다. |
| 관리자 후기 관리 | 관리자는 모든 거래 후기의 내용 수정, 공개·숨김 상태 변경, 영구 삭제, 판매자 대댓글 저장을 수행할 수 있다. 삭제와 숨김·재공개 시 판매점 신뢰 점수·평점을 기존 로직으로 다시 계산한다. |
| 관리자 신규 글쓰기 | 실제 거래 후기는 거래 구매자만 작성하는 기존 정책을 유지한다. 관리자의 새 글은 별도 `관리자 메모`로 저장하며, 작성·수정·삭제가 가능하다. |
| DB/API | V28 `admin_store_review_notes` 테이블과 판매점별 메모 CRUD API, 관리자 후기 수정 API를 추가했다. 모든 API는 관리자 권한을 검사한다. |
| 실제 검증 | 판매점 ID 2 `강남 종합공구`에서 후기 0건 조회, 임시 관리자 메모 작성·수정·삭제·원상 복구를 실제 API로 통과했다. |
| 품질 검증 | 관리자 후기 수정 도메인 테스트, 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build`, 백엔드 `gradlew test bootJar`를 통과했다. |

## 결제 후 배달 시작·완료 및 주문 모니터링 흐름 (2026-08-17)

| 항목 | 구현·실제 검증 결과 |
| :--- | :--- |
| 판매자 배달 처리 | 결제 완료 뒤 판매자 진행 주문에서 `배달 시작` → `배달 완료`로 상태를 전환한다. 즉시배달만 배송 진행 상태를 사용하며 픽업 흐름은 기존 준비 완료·거래 완료를 유지한다. |
| 구매자 알림 | 판매자가 배달을 시작하면 `DELIVERY_STARTED`, 완료하면 `DELIVERY_COMPLETED` 고객 알림을 저장한다. |
| 관리자 타임라인 | 주문 응찰 모니터링에 `배달 시작`·`배달 완료` 이벤트를 추가했다. 2초 폴링으로 상태를 갱신하며, 현재 진행 단계는 느린 빨간 점멸, 완료 이벤트는 녹색 점, 나머지 완료 이력은 보라색 점으로 표시한다. |
| 실제 주문 #10 | 테스트 구매자 03이 즉시배달 503,400원 주문을 생성하고, 테스트 강남 철물점이 응찰·재고 확인 후 사용자가 개발 결제 승인을 수행했다. |
| 실제 전환 검증 | 주문 #10: `PAYMENT_PENDING` → `PREPARING` → `DELIVERY_IN_PROGRESS` → `COMPLETED` 전환을 실제 API로 검증했다. 배달 시작·완료 알림 2건과 관리자 타임라인의 두 이벤트가 모두 저장됐다. |
| 품질 검증 | 배송 알림 서비스 단위 테스트, 프론트엔드 린트·타입·프로덕션 빌드, 백엔드 전체 테스트·JAR 빌드를 통과했다. 최신 JAR가 8080 포트에서 실행 중이다. |

## 멤버십 시간차 제안·응찰·낙찰 모니터링 보정 (2026-08-17)

| 항목 | 결과 |
| :--- | :--- |
| 문서 기준 | 프리미엄은 0초, 일반은 3초, 신규·비구독은 6초 시차로 순차 제안을 받고, 판매자 응찰 뒤 단일 낙찰자가 확정된다. |
| 문제 원인 | 기존 타임라인은 실제 멤버십 제안 단계를 표시하지 않고 `낙찰`과 `응찰 확정`을 같은 시각에 역순으로 표시했다. 또한 추가 확산 스케줄러가 15초 주기여서 3·6초 규칙을 실제로 지키지 못했다. |
| 타임라인 보정 | 주문 접수 → 프리미엄 우선 제안 → 일반 판매자 확산 제안 → 신규·비구독 판매자 확산 제안 → 응찰 접수 → 낙찰 확정 → 물품 확인 → 결제 → 배송 순서로 표시한다. |
| 확산 주기 보정 | `spreadPendingOrders`의 고정 지연을 15초에서 1초로 변경해 0·3·6초 규칙의 최대 오차를 약 1초로 제한했다. |
| 실제 검증 | 자동 검증 주문 #11에서 프리미엄 +33ms, 일반 +3,928ms, 신규·비구독 +6,067ms로 제안된 것을 확인하고 주문을 취소 처리했다. |
| 품질 검증 | 백엔드 전체 테스트와 최신 JAR 빌드를 통과하고 8080 포트에서 재시작했다. |


## 프리미엄·골드·실버 판매자 구독 및 단계적 응찰 (완료)

- 멤버십 등급을 **프리미엄·골드·실버**로 통일했고, 비구독 판매자는 실버 기본 등급으로 정리했다.
- 단계별 주문 공개를 프리미엄 0~30초, 프리미엄·골드 30~60초, 전체 판매자 60초 이후로 구현했다. 각 단계에서는 가용 슬롯이 있는 해당 등급 판매자 모두에게 동시에 공개하며, 응찰 낙찰은 기존 DB 잠금 기반 서버 수신 선착순으로 유지한다.
- V29: 구독상품, 판매자 구독 변경 이력, 판매점 만료일을 추가했다. V30: 기존 임시 등급을 구독 이력 없는 실버 기본 등급으로 정규화했다.
- 판매자 경로 /seller/subscription: 구독상품 조회·자동 승인 구매, 등급·만료일·공개 단계·변경 이력 확인을 제공한다.
- 관리자 구독상품 관리: 상품 등록·수정·삭제(이력 존재 시 판매 중지), 판매자 등급 강제 조절, 30일 만료일 설정, 등급 이력 조회를 제공한다.
- 판매자 운영 목록에도 프리미엄·골드·실버 배지를 표시한다.
- 자동 구독 승인·관리자 프리미엄 승급·실버 원복·이력 검증을 실제 API로 완료했다. 상품 ID 1, 판매점 ID 101, 현재 테스트 판매점 등급은 실버로 원복했다.
- 백엔드 전체 테스트, 프론트엔드 lint·타입 검사·프로덕션 빌드, V29·V30 Flyway 적용과 최신 JAR 재시작을 완료했다.

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

## 행사 히어로 생성 자산 저장 보정 (2026-08-17)

- 원인: 관리자 행사 API의 themeKey·iconKey 허용 목록이 기존 20개 테마·30개 SVG 아이콘에 고정되어 있었다. 신규 생성 테마·철물점 아이콘을 저장하면 서버가 blue·toolbox 기본값으로 정규화했고, 메인 히어로 공개 API도 기본값을 반환했다.
- 보정: AdminEventCampaignController 허용 목록에 생성 배경 테마 20개와 asset-* 철물점 아이콘 30개를 추가했다.
- 검증: 행사 ID 1을 purpleTools·asset-drill로 관리자 API에서 저장한 뒤, 공개 /api/event-campaigns/hero API가 동일 키를 반환하는 것을 실제 검증했다.

## 행사 아이콘 토글 해제 (2026-08-17)

- 관리자 행사 아이콘 선택은 동일 카드 재클릭 시 none 값으로 전환되어 적용을 해제한다. 새 행사 기본값도 none이다.
- CampaignIcon은 none 또는 빈 키에서 렌더링하지 않아 메인 히어로에 아이콘 영역을 만들지 않는다.
- 서버 행사 API는 none을 유효 아이콘 키로 저장하며, 잘못된 아이콘 키도 none으로 안전하게 정규화한다.
- 아이콘 카드에 hover 이동·확대·테두리·그림자와 active 축소 반응을 추가했다.
- 실제 관리자 API에서 iconKey=none 저장, 비노출 행사 공개 히어로 제외, 임시 검증 행사 삭제까지 확인했다.

## 판매점 고객 노출 설정 CRUD 및 목록·상세 동기화 (2026-08-18)
| 항목 | 구현·검증 결과 |
| :--- | :--- |
| 데이터 모델 | V31에서 stores.directory_visible, customer_badge_text, customer_notice_text를 추가했다. 기존 판매점은 고객 노출 상태를 유지한다. |
| 관리자 판매자 운영 | 판매점 행의 기존 인라인 수정 폼에 **고객 화면 노출 설정**을 추가했다. 고객 배지(60자), 안내 문구(200자), 목록·상세 고객 노출 토글을 등록·수정 흐름으로 저장한다. |
| 고객 목록·상세 | 목록 카드에서는 내부 운영값인 가용 슬롯을 완전히 제거했다. 관리자가 저장한 배지와 안내 문구는 목록과 상세에 함께 노출된다. 상세는 기존처럼 가용 슬롯을 표시하지 않는다. |
| 노출 제어 | 고객 노출을 끄면 공개 판매점 목록·지역 필터·상세 조회에서 제외되며, 관리자는 판매자 운영 목록에서 계속 관리할 수 있다. |
| 실제 DB 연동 검증 | 테스트 판매점 ID 101에 배지·안내 문구를 관리자 API로 저장한 뒤 공개 목록과 상세 API에서 동일 값을 확인하고 원래 값으로 복구했다. |
| 품질 검증 | 고객 노출 설정 단위 테스트, 백엔드 전체 테스트, 프론트엔드 lint·TypeScript·프로덕션 빌드를 통과했다. V31 Flyway 적용 후 최신 JAR를 8080 포트에서 재시작했다. |


## 백엔드 Supabase 응답 지연 안정화 (2026-08-18)

| 범위 | 보정 내용 | 상태 |
| :--- | :--- | :--- |
| 원인 진단 | 스레드 덤프에서 공개 판매점 목록이 `StoreResponse.from`의 판매자 이메일 지연 로딩으로 판매점마다 `users` 조회를 발생시키고, Supabase Session pooler SSL 응답을 기다리는 현상을 확인 | 완료 |
| 공개 목록 DTO | 고객용 `/api/stores`는 판매자 이메일을 포함하지 않는 `StoreResponse.fromPublic`을 사용하도록 변경해 판매자별 지연 로딩 조회를 제거 | 완료 |
| 관리자 응답 | `/api/admin/stores`와 관리자 생성·수정 응답은 기존처럼 판매자 이메일을 포함 | 완료 |
| DB 대기 제한 | Supabase Hikari에 연결 5초·검증 3초·JDBC 연결 5초·소켓 15초·JPA 쿼리 15초 제한과 keepalive를 추가해 원격 DB 지연이 무한 대기가 되지 않도록 보정 | 완료 |
| 실행 방식 | 최신 JAR를 8080 포트에서 재기동하고 표준 출력·오류 로그를 `server/build/server-runtime.*.log`로 분리 | 완료 |

### 안정화 검증

| 검증 | 결과 |
| :--- | :--- |
| `cd server && .\\gradlew.bat test` | 통과 |
| 공개 판매점 목록 | 재기동 직후 7.96초, 워밍업 후 1.54초·2.83초·1.47초로 HTTP 200 확인 |
| 최종 공개 API | `/api/stores` HTTP 200 0.95초, `/api/stores/16` HTTP 200 0.38초 확인 |
| 실행 상태 | 최신 JAR 프로세스가 8080 포트를 유지하며 응답 확인 |

> 원격 Supabase 연결이 지연되면 이제 연결·소켓·쿼리 시간이 제한된다. 목록 API의 판매자 이메일은 고객 화면에 불필요하므로 공개 DTO에서 제외하며, 관리자 목록만 기존 판매자 이메일을 조회한다.


## 2026-08-18 — 브랜드 자산 전역 적용 완료

| 영역 | 반영 내용 |
| --- | --- |
| Supabase Storage | 공개 `event-assets` 버킷의 `brand/` 경로에 체크 테두리 메인 로고 WebP와 파비콘 WebP를 저장했다. |
| DB | V33 `brand_assets` 테이블로 `MAIN_LOGO`, `FAVICON`의 Storage 키·공개 URL·생성 출처를 기록했다. |
| 앱 | 공통 `ShopHeader`가 Storage 공개 메인 로고 URL을 사용하도록 변경했고, `public/favicon.ico`는 멀티사이즈 체크 테두리 ICO로 교체했다. |
| 캐시 | `index.html` 파비콘 버전을 `20260818-outline`으로 갱신했다. |
| 검증 | Storage 공개 URL HTTP 200, Flyway V33 적용, 백엔드 전체 테스트 무실패, 프론트엔드 lint·타입 검사·프로덕션 빌드, My Browser 메인 헤더 렌더링을 확인했다. |

## 비즈니스 알림 전수 보완 (2026-08-18)

- 고객센터 관리자 답변 알림은 기존에 DB 저장이 구현돼 있었고, 헤더가 최초 진입 후 재조회하지 않아 빨간 점·목록에 늦게 반영되는 문제를 확인했다.
- 공통 헤더의 고객센터 알림 조회에 10초 폴링과 `chulsooya:notifications-updated` 즉시 갱신 이벤트를 추가했다. 문의 접수 직후에도 헤더 배지가 즉시 재조회된다.
- 헤더 목록은 미확인 알림만 표시한다. 클릭된 알림은 읽음 처리 뒤 목록·빨간 점·숫자 배지에서 즉시 제거된다.
- `BusinessNotificationService`를 추가해 상태 전이가 확정된 트랜잭션 안에서 사용자·관리자 알림을 공통 저장하도록 정리했다.
- 보완된 알림 이벤트: 새 주문 제안 수신 판매자, 낙찰 확정 소비자·선정 판매자, 판매자 재고 확인 소비자, 결제 승인 소비자·선정 판매자, 주문 취소 소비자·선정 판매자, 관리자 환불·클레임 환불 소비자, 판매자 신청 접수 관리자·승인/반려 신청자, 구독 구매·관리자 등급 조절·만료 판매자.
- 회귀 테스트: 관리자 답변이 문의 작성자의 `INQUIRY_ANSWERED` 미확인 알림으로 저장되는 테스트와 새 주문 제안 알림 테스트를 추가했다.
- 검증: 백엔드 전체 테스트 통과, 프론트엔드 `npm run lint && npx tsc -b && npm run build` 통과, 최신 JAR 재시작 후 공개 API HTTP 200 확인.


## Supabase public RLS 보안 보정 (2026-08-19)

- Supabase Security Advisor 경고를 점검한 결과, public 스키마의 테이블 38개에서 RLS가 비활성화되어 있었고 `anon`·`authenticated` 역할에 CRUD 권한이 부여되어 있었다.
- 각 테이블에 RLS를 활성화하고 `anon`·`authenticated`의 테이블 직접 권한과 시퀀스 권한을 회수했다. 향후 테이블·시퀀스에 대한 기본 권한도 회수했다.
- 검증: public 테이블 38개 기준 `RLS_DISABLED=0`, `ANON_GRANTED=0`, `AUTHENTICATED_GRANTED=0`; anon Supabase REST의 `users` 직접 조회는 HTTP 401, Spring Boot 공개 판매점 API는 HTTP 200을 확인했다.
- Spring Boot 서버는 테이블 소유자 JDBC 역할로 REST API를 통해서만 DB에 접근하므로 기존 앱 기능 경로는 유지된다.
- Supabase Session Pooler에서 긴 DDL 배치가 대기하는 문제를 피하기 위해 실제 RLS 적용은 테이블별 짧은 연결로 완료했다. V34는 적용 완료 상태를 Flyway 이력에 기록한다.

## 관리자 CRUD 공통 상단 알림 통합 (2026-08-19)

| 범위 | 적용 내용 | 상태 |
| :--- | :--- | :--- |
| 행사·이벤트 | 행사 등록·수정·활성화·삭제, 자산 업로드·수정·이미지 교체·삭제·행사 적용의 성공·실패 안내를 공통 상단 토스트로 통일 | 완료 |
| 상품·카테고리 | 상품 등록·수정, 옵션 저장, 활성화·비활성화와 입력 검증 오류를 공통 상단 토스트로 통일 | 완료 |
| 판매자 신청 심사 | 증빙 문서 조회 오류, 승인·반려 및 승인 조건 검증을 공통 상단 토스트로 통일 | 완료 |
| 판매자 운영·주문 매칭 | 판매점 CRUD, 후기·대댓글·관리자 메모 관리, 슬롯 강제 조정의 성공·실패 안내를 공통 상단 토스트로 통일 | 완료 |
| 구독·쿠폰·정산·환불 | 구독상품 CRUD·판매자 등급 변경, 쿠폰 정책·회원 발행, 결제 조회·환불 처리의 성공·실패 안내를 공통 상단 토스트로 통일 | 완료 |
| 고객 문의·알림 | 문의 상태 변경과 답변 등록·고객 알림 발송의 성공·실패 안내를 공통 상단 토스트로 통일 | 완료 |
| 기존 적용 탭 | 회원 관리의 판매자 해지 처리와 개발 결제 승인 알림은 기존 공통 상단 토스트 구현을 유지 | 확인 완료 |

### 이번 검증

| 검증 | 결과 |
| :--- | :--- |
| 관리자 탭 정적 점검 | 현재 연결된 관리자 패널 12개에서 로컬 `message`·`notice` 상태 0건, 공통 `notify` 호출 확인 |
| 브라우저 확인 | 빈 행사 등록 저장 시 화면 상단 중앙에 오류 토스트 표시 확인. 데이터 변경 없음 |
| `cd client && npm run lint` | 통과, 경고·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |


## 2026-08-19 — 카카오 로그인·주소·지도 연동

- Kakao Developers에 개인 개발자 앱 `철수야`를 생성하고 카카오 로그인 사용 설정을 활성화했다.
- REST API 키 설정에 Supabase OAuth 콜백 `https://gvsnsnjfvtogvlyvmlkt.supabase.co/auth/v1/callback`을 등록하고 Client Secret을 활성화했다.
- Supabase Authentication의 Kakao Provider를 활성화하고 카카오 REST API 키·Client Secret을 저장했다. 이메일 미제공 계정 허용은 기존 회원 식별 규칙을 위해 OFF로 유지한다.
- 카카오 지도 JavaScript 키에는 `http://localhost:5173` 도메인을 등록했다. 실제 키는 Git 제외 `client/.env.local`에만 저장하고 `VITE_KAKAO_JAVASCRIPT_KEY`로 로드한다.
- `client/src/lib/kakao.ts`와 `components/address/KakaoAddressTools.tsx`를 추가했다. 카카오 우편번호 선택 후 서울시 구·도로명 주소를 기존 배송지 DTO에 맞게 채우고, 기본·추가 배송지 및 체크아웃에서 지도 미리보기를 표시한다.
- 주문 요청의 카카오 주소 선택은 기존 `regionApi.resolve`를 계속 호출하므로, 판매자 매칭 구 판정은 기존 서버 권위를 유지한다.
- 검증: `npm run lint`, `npx tsc -b`, `npm run build` 통과. 로그인 화면에서 카카오 로그인 시작 버튼 노출 확인.
