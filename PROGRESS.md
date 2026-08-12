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
