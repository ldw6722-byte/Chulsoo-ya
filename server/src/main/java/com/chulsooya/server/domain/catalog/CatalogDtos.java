package com.chulsooya.server.domain.catalog;

import java.util.List;

public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record CategoryResponse(
            Long id,
            String code,
            String name,
            String iconKey,
            String imageUrl,
            int level,
            String parentCode,
            int sortOrder) {
        public static CategoryResponse from(Category category) {
            return new CategoryResponse(
                    category.getId(),
                    category.getCode(),
                    category.getName(),
                    category.getIconKey(),
                    category.getImageUrl(),
                    category.getLevel(),
                    category.getParent() == null ? null : category.getParent().getCode(),
                    category.getSortOrder());
        }
    }

    public record CategoryTreeResponse(
            Long id,
            String code,
            String name,
            String iconKey,
            String imageUrl,
            int level,
            List<CategoryTreeResponse> children) {
    }

    public record ProductResponse(
            Long id,
            String name,
            String specSummary,
            String description,
            String specification,
            int price,
            Integer originalPrice,
            Integer discountRate,
            String unit,
            String imageUrl,
            List<String> imageUrls,
            String brand,
            double rating,
            int reviewCount,
            int salesCount,
            boolean featured,
            boolean selectPromotion,
            boolean quickFulfillment,
            String categoryCode,
            String categoryName) {

        public static ProductResponse from(Product product) {
            return new ProductResponse(
                    product.getId(),
                    product.getName(),
                    product.getSpecSummary(),
                    product.getDescription(),
                    product.getSpecification(),
                    product.getPrice(),
                    product.getOriginalPrice(),
                    product.getDiscountRate(),
                    product.getUnit(),
                    product.getImageUrl(),
                    product.getImageUrls(),
                    product.getBrand(),
                    product.getRating(),
                    product.getReviewCount(),
                    product.getSalesCount(),
                    product.isFeatured(),
                    product.isSelectPromotion(),
                    product.isQuickFulfillment(),
                    product.getCategory().getCode(),
                    product.getCategory().getName());
        }
    }

    public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages) {
    }
}
