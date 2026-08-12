package com.chulsooya.server.support;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.domain.catalog.Category;
import com.chulsooya.server.domain.catalog.CategoryRepository;
import com.chulsooya.server.domain.catalog.Product;
import com.chulsooya.server.domain.catalog.ProductRepository;
import com.chulsooya.server.domain.order.OrderRepository;
import tools.jackson.databind.ObjectMapper;

/**
 * ponytail: 초기 카탈로그 전용 일회성 시드.
 * 주문이 이미 존재하면 절대 상품을 교체하지 않아 주문 이력을 보존한다.
 */
@Configuration
@ConditionalOnProperty(name = "app.seed.bulk-products", havingValue = "true")
public class BulkCatalogSeedRunner {

    private static final String RESOURCE = "seed/hardware-products-1600.json";
    private static final int LEAF_CATEGORY_COUNT = 32;
    private static final int PRODUCTS_PER_LEAF = 50;
    private static final int TOTAL_PRODUCTS = LEAF_CATEGORY_COUNT * PRODUCTS_PER_LEAF;

    @Bean
    public ApplicationRunner bulkHardwareCatalogSeeder(
            ObjectMapper objectMapper,
            CategoryRepository categories,
            ProductRepository products,
            OrderRepository orders,
            @Value("${app.seed.reset-catalog:false}") boolean resetCatalog) {
        return args -> seed(objectMapper, categories, products, orders, resetCatalog);
    }

    @Transactional
    void seed(
            ObjectMapper objectMapper,
            CategoryRepository categories,
            ProductRepository products,
            OrderRepository orders,
            boolean resetCatalog) throws IOException {
        CatalogSeed catalog = readCatalog(objectMapper);
        validateCatalog(catalog, categories);

        long existingProducts = products.count();
        if (existingProducts > 0 && !resetCatalog) {
            return;
        }
        if (existingProducts > 0 && orders.count() > 0) {
            throw new IllegalStateException("주문 이력이 존재해 초기 상품 카탈로그를 교체할 수 없습니다.");
        }
        if (existingProducts > 0) {
            products.deleteAllInBatch();
        }

        Map<String, Category> categoryByCode = categories.findAllByActiveTrueOrderBySortOrderAsc().stream()
                .collect(Collectors.toMap(Category::getCode, Function.identity()));
        List<Product> entities = catalog.products().stream()
                .map(item -> toProduct(item, categoryByCode.get(item.categoryCode())))
                .toList();
        products.saveAll(entities);
    }

    private CatalogSeed readCatalog(ObjectMapper objectMapper) throws IOException {
        try (var stream = new ClassPathResource(RESOURCE).getInputStream()) {
            return objectMapper.readValue(stream, CatalogSeed.class);
        }
    }

    private void validateCatalog(CatalogSeed catalog, CategoryRepository categories) {
        if (catalog == null || catalog.products() == null || catalog.products().size() != TOTAL_PRODUCTS) {
            throw new IllegalStateException("초기 철물 카탈로그는 정확히 1,600개 상품이어야 합니다.");
        }
        Map<String, Long> countByCategory = catalog.products().stream()
                .collect(Collectors.groupingBy(SeedProduct::categoryCode, Collectors.counting()));
        if (countByCategory.size() != LEAF_CATEGORY_COUNT
                || countByCategory.values().stream().anyMatch(count -> count != PRODUCTS_PER_LEAF)) {
            throw new IllegalStateException("각 소분류는 정확히 50개 상품을 가져야 합니다.");
        }
        Map<String, Category> categoryByCode = categories.findAllByActiveTrueOrderBySortOrderAsc().stream()
                .collect(Collectors.toMap(Category::getCode, Function.identity()));
        if (countByCategory.keySet().stream().anyMatch(code -> !categoryByCode.containsKey(code)
                || categoryByCode.get(code).getLevel() != 3)) {
            throw new IllegalStateException("초기 상품이 유효하지 않은 소분류에 연결되어 있습니다.");
        }
    }

    private Product toProduct(SeedProduct item, Category category) {
        return new Product(category, item.name(), item.specSummary(), item.price(), item.unit(), null)
                .catalogInfo(
                        item.brand(),
                        item.description(),
                        item.specification(),
                        item.originalPrice(),
                        item.rating(),
                        item.reviewCount(),
                        item.salesCount(),
                        item.featured(),
                        item.quickFulfillment(),
                        null);
    }

    private record CatalogSeed(int version, int targetPerLeafCategory, List<SeedProduct> products) {
    }

    private record SeedProduct(
            String categoryCode,
            String categoryName,
            String name,
            String specSummary,
            String unit,
            int price,
            int originalPrice,
            String description,
            String specification,
            String brand,
            double rating,
            int reviewCount,
            int salesCount,
            boolean featured,
            boolean quickFulfillment) {
    }
}
