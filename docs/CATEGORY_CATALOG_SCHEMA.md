# 계층형 철물 카테고리·상품 카탈로그 스키마

## 비파괴 마이그레이션: V3

| 대상 | 추가 필드·제약 | 목적 |
| :--- | :--- | :--- |
| `categories` | `parent_id` 자기 참조 FK, `level`(1~3), `active`, `image_url` | 대·중·소 트리와 홈 아이콘·메가 메뉴 지원 |
| `categories` | `(parent_id, sort_order)` 인덱스, `parent_id` 인덱스 | 단계별 메뉴/정렬 조회 |
| `products` | `description`, `brand`, `original_price`, `discount_rate`, `rating`, `review_count`, `sales_count`, `featured`, `quick_fulfillment`, `image_urls`, `specification` | 카드·상세 판매 정보 지원 |
| `products` | `active/featured`, `active/sales_count`, `active/created_at` 인덱스 | 추천·인기·신상품 목록 정렬 |

기존 `category_id`, `price`, `unit`, `image_url`, `active`는 보존한다. 실시간 판매자 매칭 모델상 매장별 사전 재고는 확정값으로 추가하지 않으며, 매칭 후 재고 확인 단계가 최종 재고 진실 공급원이다.

## 엔티티 관계

```text
Category (parent_id nullable)
  └── Category (level 2)
        └── Category (level 3)
              └── Product (category_id, leaf 권장)
```

## API 계약

| 경로 | 역할 |
| :--- | :--- |
| `GET /api/categories` | 대분류 목록 |
| `GET /api/categories/tree` | 3단 트리 메가 메뉴 |
| `GET /api/categories/{code}` | 단일 카테고리 및 하위 노드 |
| `GET /api/products` | 선택 카테고리와 모든 하위 카테고리를 포함한 검색·정렬·페이지 조회 |
| `GET /api/products/featured` | 홈 추천 상품 |
| `GET /api/products/popular` | 판매량 기반 인기 상품 |
| `GET /api/products/suggestions` | 상품명 자동완성 |
| `GET /api/products/{id}` | 이미지·브랜드·정가·할인·사양을 포함한 상세 상품 |

## 정렬 값

`popular`, `newest`, `priceAsc`, `priceDesc`, `rating`, `name`만 허용한다. 입력값은 서버에서 enum 방식으로 해석해 임의 property 정렬을 허용하지 않는다.
