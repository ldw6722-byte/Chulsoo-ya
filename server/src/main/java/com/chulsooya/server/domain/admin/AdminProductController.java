package com.chulsooya.server.domain.admin;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.cart.CartRepository;
import com.chulsooya.server.domain.catalog.Category;
import com.chulsooya.server.domain.catalog.CategoryRepository;
import com.chulsooya.server.domain.catalog.EventCampaignRepository;
import com.chulsooya.server.domain.catalog.Product;
import com.chulsooya.server.domain.catalog.ProductRepository;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.support.CurrentUser;

@Transactional
@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {
    private final ProductRepository products;
    private final CategoryRepository categories;
    private final EventCampaignRepository campaigns;
    private final CartRepository carts;
    private final OrderRepository orders;

    public AdminProductController(ProductRepository products, CategoryRepository categories, EventCampaignRepository campaigns, CartRepository carts, OrderRepository orders) {
        this.products = products;
        this.categories = categories;
        this.campaigns = campaigns;
        this.carts = carts;
        this.orders = orders;
    }

    private void admin(CurrentUser user) {
        if (!user.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN);
    }

    private Category category(String code) {
        return categories.findByCodeAndActiveTrue(code)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
    }

    private String blank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void apply(Product product, Category category, Request request) {
        int regularPrice = request.price();
        int supplyCost = request.supplyCost() == null ? regularPrice : Math.max(0, request.supplyCost());
        int requestedRate = request.discountRate() == null ? 0 : request.discountRate();
        int discountRate = Math.min(99, Math.max(0, requestedRate));
        boolean selectPromotion = request.selectPromotion();
        Long eventCampaignId = selectPromotion ? request.eventCampaignId() : null;
        if (eventCampaignId != null && !campaigns.existsById(eventCampaignId)) throw new DomainException(ErrorCode.NOT_FOUND);
        int price = selectPromotion ? (int) Math.round(supplyCost * (100 - discountRate) / 100.0) : regularPrice;
        int originalPrice = selectPromotion
                ? supplyCost
                : (request.originalPrice() == null ? regularPrice : Math.max(regularPrice, request.originalPrice()));

        product.updateCatalog(
                category,
                request.name(),
                request.specSummary(),
                blank(request.description()),
                blank(request.specification()),
                price,
                originalPrice,
                request.unit(),
                blank(request.imageUrl()),
                blank(request.brand()),
                request.featured(),
                request.quickFulfillment(),
                selectPromotion ? supplyCost : null,
                selectPromotion,
                eventCampaignId);
    }

    @GetMapping
    public ApiResponse<PageView> list(
            CurrentUser user,
            @RequestParam(required = false) String categoryCode,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        admin(user);
        String categoryCodeFilter = blank(categoryCode);
        Category selectedCategory = categoryCodeFilter == null ? null : category(categoryCodeFilter);
        String search = blank(keyword);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by(Sort.Direction.DESC, "id"));
        Page<Product> result;

        if (active != null) {
            if (selectedCategory != null && search != null) result = products.adminByCategoryTreeAndKeywordAndActive(selectedCategory, search, active, pageable);
            else if (selectedCategory != null) result = products.adminByCategoryTreeAndActive(selectedCategory, active, pageable);
            else if (search != null) result = products.adminByKeywordAndActive(search, active, pageable);
            else result = products.adminByActive(active, pageable);
        } else {
            if (selectedCategory != null && search != null) result = products.adminByCategoryTreeAndKeyword(selectedCategory, search, pageable);
            else if (selectedCategory != null) result = products.adminByCategoryTree(selectedCategory, pageable);
            else if (search != null) result = products.adminByKeyword(search, pageable);
            else result = products.adminAll(pageable);
        }
        return ApiResponse.of(PageView.of(result));
    }

    @PostMapping
    public ApiResponse<View> create(CurrentUser user, @Valid @RequestBody Request request) {
        admin(user);
        Category category = category(request.categoryCode());
        Product product = new Product(category, request.name(), request.specSummary(), request.price(), request.unit(), blank(request.imageUrl()));
        apply(product, category, request);
        return ApiResponse.of(View.of(products.save(product)));
    }

    @PutMapping("/{id}")
    public ApiResponse<View> update(CurrentUser user, @PathVariable Long id, @Valid @RequestBody Request request) {
        admin(user);
        Product product = products.findById(id).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        apply(product, category(request.categoryCode()), request);
        return ApiResponse.of(View.of(products.save(product)));
    }

    @PatchMapping("/{id}/active")
    public ApiResponse<View> active(CurrentUser user, @PathVariable Long id, @RequestBody ActiveRequest request) {
        admin(user);
        Product product = products.findById(id).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        if (request.active()) product.activate(); else product.deactivate();
        return ApiResponse.of(View.of(products.save(product)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> remove(CurrentUser user, @PathVariable Long id) {
        admin(user);
        Product product = products.findById(id).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        if (orders.existsItemByProductId(id)) throw new DomainException(ErrorCode.INVALID_ORDER_STATUS, "주문 이력이 있는 상품은 삭제할 수 없습니다. 비활성화를 사용해 주세요.");
        if (carts.existsItemByProductId(id)) throw new DomainException(ErrorCode.INVALID_ORDER_STATUS, "장바구니에 담긴 상품은 삭제할 수 없습니다. 비활성화를 사용해 주세요.");
        products.delete(product);
        return ApiResponse.of(null);
    }

    public record Request(
            @NotBlank String categoryCode,
            @NotBlank String name,
            @NotBlank String specSummary,
            String description,
            String specification,
            @Min(0) int price,
            Integer originalPrice,
            Integer supplyCost,
            @Min(0) Integer discountRate,
            boolean selectPromotion,
            Long eventCampaignId,
            @NotBlank String unit,
            String imageUrl,
            String brand,
            boolean featured,
            boolean quickFulfillment) {
    }

    public record ActiveRequest(boolean active) {
    }

    public record View(
            Long id,
            String categoryCode,
            String categoryName,
            String name,
            String specSummary,
            String description,
            String specification,
            int price,
            Integer originalPrice,
            Integer supplyCost,
            boolean selectPromotion,
            Long eventCampaignId,
            String unit,
            String imageUrl,
            String brand,
            boolean featured,
            boolean quickFulfillment,
            boolean active) {
        static View of(Product product) {
            return new View(
                    product.getId(),
                    product.getCategory().getCode(),
                    product.getCategory().getName(),
                    product.getName(),
                    product.getSpecSummary(),
                    product.getDescription(),
                    product.getSpecification(),
                    product.getPrice(),
                    product.getOriginalPrice(),
                    product.getSupplyCost(),
                    product.isSelectPromotion(),
                    product.getEventCampaignId(),
                    product.getUnit(),
                    product.getImageUrl(),
                    product.getBrand(),
                    product.isFeatured(),
                    product.isQuickFulfillment(),
                    product.isActive());
        }
    }

    public record PageView(List<View> items, int page, int size, long totalElements, int totalPages) {
        static PageView of(Page<Product> products) {
            return new PageView(
                    products.getContent().stream().map(View::of).toList(),
                    products.getNumber(),
                    products.getSize(),
                    products.getTotalElements(),
                    products.getTotalPages());
        }
    }
}
