package com.chulsooya.server.domain.catalog;

import static com.chulsooya.server.domain.catalog.CatalogDtos.CategoryTreeResponse;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

/**
 * ponytail: 카테고리 수가 제한적인 3단 메뉴이므로 한 번의 전체 조회 후 메모리에서 트리를 조립한다.
 * upgrade path: 카탈로그가 대규모가 되면 recursive CTE 또는 메뉴 캐시로 교체한다.
 */
@Component
public class CategoryTreeAssembler {

    public List<CategoryTreeResponse> assemble(List<Category> categories) {
        Map<Category, List<Category>> byParent = new HashMap<>();
        for (Category category : categories) {
            if (category.isActive()) {
                byParent.computeIfAbsent(category.getParent(), ignored -> new ArrayList<>()).add(category);
            }
        }
        return byParent.getOrDefault(null, List.of()).stream()
                .sorted(order())
                .map(category -> toTree(category, byParent))
                .toList();
    }

    private CategoryTreeResponse toTree(Category category, Map<Category, List<Category>> byParent) {
        List<CategoryTreeResponse> children = byParent.getOrDefault(category, List.of()).stream()
                .sorted(order())
                .map(child -> toTree(child, byParent))
                .toList();
        return new CategoryTreeResponse(
                category.getId(),
                category.getCode(),
                category.getName(),
                category.getIconKey(),
                category.getImageUrl(),
                category.getLevel(),
                children);
    }

    private Comparator<Category> order() {
        return Comparator.comparingInt(Category::getSortOrder).thenComparing(Category::getName);
    }
}
