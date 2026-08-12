# AGENTS.md — 철수야 (Chulsoo-ya) 에이전트 작업 규약

이 파일은 이 저장소에서 작업하는 모든 AI 에이전트의 최상위 규약이다. 하위 디렉터리에 별도 `AGENTS.md`가 있으면 가까운 파일이 우선한다.

## 1. 프로젝트 정체성

| 항목 | 값 |
| :--- | :--- |
| 서비스명 | 철수야 (Chulsoo-ya) |
| 모델 | 구(區) 단위 실시간 입찰 기반 철물 O2O 매칭 플랫폼 |
| 저장소 형태 | 모노레포 (`client/` + `server/`) |
| 사양 원본 | `README.ko.md` (제품 규칙·상태 머신·스키마의 단일 진실 공급원) |
| 진행 상태 | `PROGRESS.md` |
| 구조 지도 | `PROJECT_MAP.md` |

## 2. 기술 스택 (고정)

| 레이어 | 스택 | 비고 |
| :--- | :--- | :--- |
| 프론트엔드 | React 19 + TypeScript + Vite, **TSX만 사용** | `.jsx`/`.js` 컴포넌트 금지 |
| HTTP 통신 | **Axios 단일 채널** | `fetch` 직접 호출 금지, `src/api/client.ts` 인스턴스만 사용 |
| 서버 통신 방식 | **REST API** | GraphQL/tRPC 도입 금지 |
| 백엔드 | Spring Boot 4.x + Java 25 (Gradle) | `server/build.gradle` 기준 |
| 데이터 | PostgreSQL (Supabase), Redis(락·슬롯) | 개발 초기에는 H2/인메모리 허용 |
| 스타일 | CSS 변수 기반 디자인 토큰 | 토큰 없는 하드코딩 색상 금지 |

## 3. 절대 규칙 (Non-negotiable)

1. **시간의 권위는 서버**: 매칭 5분, 판매자 물품 확인 2분 마감은 서버 타임스탬프만 판정한다. 클라이언트 카운트다운은 표시용이며 기기 시간으로 초기화하지 않는다.
2. **결제 순서 고정**: `MATCHED` → `SELLER_CONFIRMING`(2분) → `PAYMENT_PENDING` → `PAID`. 판매자 물품 확인 전 결제 진행 UI를 열지 않는다.
3. **부분 응찰 금지**: 낙찰은 배정 주문 단위 전체에 대해서만 생성한다.
4. **낙찰자 1인 보장**: 응찰은 주문 단위 락 + `bids(order_id) WHERE is_winner=true` 유니크 인덱스로 보장한다. 프론트엔드가 낙찰을 판정하지 않는다.
5. **가용량 회계 불변식**: `available = configured - reserved - active`, 모든 카운터 ≥ 0, `configured <= tier_slot_cap`.
6. **클레임은 정산을 HOLD**: 클레임 생성 트랜잭션에서 정산 상태를 `HOLD`로 전환하고 불변 타임라인을 남긴다.
7. **비즈니스 판단은 백엔드**: 프론트엔드는 확정 상태 렌더링, 유효 입력 수집, 승인된 이벤트 구독만 담당한다.
8. **법정 서류에 AI 사용 금지**: 결정적 템플릿 + DB 데이터 주입 방식만 허용한다.
9. **비밀값은 환경변수**: API 키, PG 키, 서비스 롤 키를 소스에 넣지 않는다.

## 4. 코딩 규약

### 4.1 프론트엔드 (`client/`)

```text
client/src/
├── app/            # 앱 셸, 라우터, 프로바이더, 역할 가드
├── api/            # Axios 인스턴스 + 도메인별 REST 함수
├── components/     # 재사용 UI 프리미티브
├── features/       # catalog, cart, checkout, matching, orders, seller, admin
├── hooks/          # 도메인 인지 훅 (useCountdown 등)
├── styles/         # 디자인 토큰, 전역 스타일
└── types/          # 서버 계약 타입 (단일 정의)
```

- 파일명: 컴포넌트 `PascalCase.tsx`, 그 외 `camelCase.ts`.
- API 호출은 반드시 `src/api/*.ts`를 경유한다. 컴포넌트에서 `axios`를 직접 import 하지 않는다.
- 모든 라우트/핵심 컴포넌트는 로딩·빈 결과·오류·권한 없음·만료 상태를 정의한다.
- 상태를 색상만으로 전달하지 않는다(텍스트 레이블 병기). 터치 영역 최소 44×44px.

### 4.2 백엔드 (`server/`)

```text
server/src/main/java/com/Chulsoo_ya/server/
├── common/         # 공통 응답·예외·시간 제공자
├── domain/<name>/  # controller / service / repository / entity / dto
└── infra/          # kakao, toss, nts, storage 어댑터
```

- REST 경로: `/api/{resource}` 복수형, 역할 전용은 `/api/seller/**`, `/api/admin/**`.
- 응답 포맷 고정: 성공 `{ "data": ... }`, 실패 `{ "error": { "code", "message" } }`.
- 도메인 상태 전이는 서비스 계층에서만 수행하고 컨트롤러에 로직을 두지 않는다.
- 결제·응찰은 멱등성 키를 요구한다.

## 5. 작업 절차 (에이전트 루프)

1. `PROGRESS.md`를 읽고 현재 단계와 다음 작업을 확인한다.
2. `PROJECT_MAP.md`로 수정 대상 파일을 특정한다(불필요한 전체 탐색 금지).
3. 포니테일 원칙으로 최소 변경을 설계한다: YAGNI → 기존 코드 재사용 → 표준 기능 → 기존 의존성 → 최소 코드.
4. 핵심 로직(응찰·가용량·마감·결제·클레임)은 테스트를 먼저 작성한다(Red → Green → Refactor).
5. 검증 명령을 실행한다.
6. `PROGRESS.md`와 필요 시 `PROJECT_MAP.md`를 갱신한다.

## 6. 검증 명령 (Definition of Done)

```bash
# 프론트엔드
cd client && npm run lint && npx tsc -b && npm run build

# 백엔드
cd server && ./gradlew test
```

- 위 명령이 모두 통과하지 않으면 "완료"라고 보고하지 않는다.
- 실패 시 RCA 절차를 따른다: 증거 수집 → 증상/원인 분리 → 호출자 추적 → 가설 검증 → 근본 수정.

## 7. 금지 사항

- 새 의존성 추가를 위한 사소한 기능 구현(포니테일 사다리를 먼저 적용).
- 요청되지 않은 추상화(단일 구현용 인터페이스, 팩토리).
- 스펙(`README.ko.md`)과 충돌하는 임의 결정. 충돌 발견 시 코드보다 문서를 먼저 확인하고, 모호하면 사용자에게 질문한다.
- `node_modules`, `.gradle`, `build`, `dist` 커밋 또는 인덱싱.
- 파괴적 마이그레이션(컬럼 삭제 등) 사전 확인 없는 실행.

## 8. 코너 커팅 표기

의도적으로 단순화한 지점은 주석으로 남긴다.

```ts
// ponytail: 목 데이터로 대체, upgrade path: /api/orders 연동 후 제거
```
