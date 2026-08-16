package com.chulsooya.server.domain.catalog;

import static com.chulsooya.server.domain.catalog.CatalogDtos.CategoryResponse;
import static com.chulsooya.server.domain.catalog.CatalogDtos.CategoryTreeResponse;
import static com.chulsooya.server.domain.catalog.CatalogDtos.PageResponse;
import static com.chulsooya.server.domain.catalog.CatalogDtos.ProductResponse;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

@RestController
@RequestMapping("/api")
@Transactional(readOnly = true)
public class CatalogController {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CategoryTreeAssembler treeAssembler;

    public CatalogController(
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            CategoryTreeAssembler treeAssembler) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.treeAssembler = treeAssembler;
    }

    /** 기존 홈 카테고리 UI 호환: 활성 대분류만 반환한다. */
    @GetMapping("/categories")
    public ApiResponse<List<CategoryResponse>> categories() {
        return ApiResponse.of(categoryRepository.findByParentIsNullAndActiveTrueOrderBySortOrderAsc().stream()
                .map(CategoryResponse::from)
                .toList());
    }

    @GetMapping("/categories/tree")
    public ApiResponse<List<CategoryTreeResponse>> categoryTree() {
        return ApiResponse.of(treeAssembler.assemble(categoryRepository.findAllByActiveTrueOrderBySortOrderAsc()));
    }

    @GetMapping("/categories/{code}")
    public ApiResponse<CategoryTreeResponse> category(@PathVariable String code) {
        Category target = categoryRepository.findByCodeAndActiveTrue(code)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "카테고리를 찾을 수 없습니다."));
        CategoryTreeResponse response = findTree(treeAssembler.assemble(categoryRepository.findAllByActiveTrueOrderBySortOrderAsc()), target.getCode());
        if (response == null) {
            throw new DomainException(ErrorCode.NOT_FOUND, "카테고리를 찾을 수 없습니다.");
        }
        return ApiResponse.of(response);
    }

    @GetMapping("/products")
    public ApiResponse<PageResponse<ProductResponse>> products(
            @RequestParam(required = false) String categoryCode,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long eventCampaignId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "popular") String sort) {

        String normalizedCategory = isBlank(categoryCode) ? null : categoryCode.trim();
        String normalizedKeyword = isBlank(keyword) ? null : keyword.trim();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), sortSpec(sort));
        Page<Product> result = search(normalizedCategory, normalizedKeyword, eventCampaignId, pageable);
        return ApiResponse.of(toPage(result));
    }

    @GetMapping("/products/featured")
    public ApiResponse<List<ProductResponse>> featured(@RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(0, Math.min(Math.max(size, 1), 40), Sort.by(Sort.Direction.DESC, "salesCount"));
        return ApiResponse.of(productRepository.findByActiveTrueAndFeaturedTrue(pageable).getContent().stream()
                .map(ProductResponse::from)
                .toList());
    }

    @GetMapping("/products/popular")
    public ApiResponse<List<ProductResponse>> popular(@RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(0, Math.min(Math.max(size, 1), 40), Sort.by(Sort.Direction.DESC, "salesCount"));
        return ApiResponse.of(productRepository.findByActiveTrue(pageable).getContent().stream()
                .map(ProductResponse::from)
                .toList());
    }

    @GetMapping("/products/suggestions")
    public ApiResponse<List<String>> suggestions(@RequestParam String keyword) {
        if (isBlank(keyword)) {
            return ApiResponse.of(List.of());
        }
        return ApiResponse.of(productRepository.suggestions(keyword.trim(), PageRequest.of(0, 8)).stream()
                .map(Product::getName)
                .distinct()
                .toList());
    }

    @GetMapping("/products/{id}")
    public ApiResponse<ProductResponse> product(@PathVariable Long id) {
        Product product = productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "상품을 찾을 수 없습니다."));
        return ApiResponse.of(ProductResponse.from(product));
    }

    private Page<Product> search(String categoryCode, String keyword, Long eventCampaignId, Pageable pageable) {
        if (eventCampaignId != null) return keyword == null ? productRepository.findByActiveTrueAndEventCampaignId(eventCampaignId, pageable) : productRepository.findByActiveTrueAndEventCampaignIdAndNameContainingIgnoreCase(eventCampaignId, keyword, pageable);
        if (categoryCode == null) {
            return keyword == null
                    ? productRepository.findByActiveTrue(pageable)
                    : productRepository.findByActiveTrueAndNameContainingIgnoreCase(keyword, pageable);
        }
        Category category = categoryRepository.findByCodeAndActiveTrue(categoryCode)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "카테고리를 찾을 수 없습니다."));
        List<String> codes = descendantCodes(category, categoryRepository.findAllByActiveTrueOrderBySortOrderAsc());
        return keyword == null
                ? productRepository.findByActiveTrueAndCategory_CodeIn(codes, pageable)
                : productRepository.findByActiveTrueAndCategory_CodeInAndNameContainingIgnoreCase(codes, keyword, pageable);
    }

    private List<String> descendantCodes(Category root, List<Category> all) {
        List<String> codes = new ArrayList<>();
        Deque<Category> queue = new ArrayDeque<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            Category current = queue.removeFirst();
            codes.add(current.getCode());
            all.stream().filter(item -> item.getParent() != null && item.getParent().getId().equals(current.getId()))
                    .forEach(queue::addLast);
        }
        return codes;
    }

    private CategoryTreeResponse findTree(List<CategoryTreeResponse> nodes, String code) {
        for (CategoryTreeResponse node : nodes) {
            if (node.code().equals(code)) {
                return node;
            }
            CategoryTreeResponse descendant = findTree(node.children(), code);
            if (descendant != null) {
                return descendant;
            }
        }
        return null;
    }

    private PageResponse<ProductResponse> toPage(Page<Product> result) {
        return new PageResponse<>(
                result.getContent().stream().map(ProductResponse::from).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    private Sort sortSpec(String sort) {
        return switch (sort) {
            case "priceAsc" -> Sort.by(Sort.Direction.ASC, "price");
            case "priceDesc" -> Sort.by(Sort.Direction.DESC, "price");
            case "rating" -> Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(Sort.Direction.DESC, "reviewCount"));
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "name" -> Sort.by(Sort.Direction.ASC, "name");
            default -> Sort.by(Sort.Direction.DESC, "salesCount").and(Sort.by(Sort.Direction.DESC, "id"));
        };
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
