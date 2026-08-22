package com.chulsooya.server.domain.admin;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.domain.cart.CartRepository;
import com.chulsooya.server.domain.catalog.Category;
import com.chulsooya.server.domain.catalog.CategoryRepository;
import com.chulsooya.server.domain.catalog.EventCampaignRepository;
import com.chulsooya.server.domain.catalog.Product;
import com.chulsooya.server.domain.catalog.ProductRepository;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class AdminProductDeletionTest {
    @Mock private ProductRepository products;
    @Mock private CategoryRepository categories;
    @Mock private EventCampaignRepository campaigns;
    @Mock private CartRepository carts;
    @Mock private OrderRepository orders;

    private AdminProductController controller;
    private final CurrentUser administrator = new CurrentUser(1L, UserRole.ADMIN);

    @BeforeEach
    void setUp() {
        controller = new AdminProductController(products, categories, campaigns, carts, orders);
    }

    @Test
    void administrator_can_remove_product_without_cart_or_order_reference() {
        Product product = new Product(new Category("TOOLS", "Tools", "wrench", 1), "Product", "10 mm", 1000, "EA", null);
        when(products.findById(1L)).thenReturn(Optional.of(product));
        when(orders.existsItemByProductId(1L)).thenReturn(false);
        when(carts.existsItemByProductId(1L)).thenReturn(false);

        controller.remove(administrator, 1L);

        verify(products).delete(product);
    }

    @Test
    void administrator_cannot_remove_product_with_order_history() {
        Product product = new Product(new Category("TOOLS", "Tools", "wrench", 1), "Product", "10 mm", 1000, "EA", null);
        when(products.findById(1L)).thenReturn(Optional.of(product));
        when(orders.existsItemByProductId(1L)).thenReturn(true);

        assertThatThrownBy(() -> controller.remove(administrator, 1L)).isInstanceOf(DomainException.class);

        verify(products, never()).delete(any());
    }

    @Test
    void administrator_cannot_remove_product_in_cart() {
        Product product = new Product(new Category("TOOLS", "Tools", "wrench", 1), "Product", "10 mm", 1000, "EA", null);
        when(products.findById(1L)).thenReturn(Optional.of(product));
        when(orders.existsItemByProductId(1L)).thenReturn(false);
        when(carts.existsItemByProductId(1L)).thenReturn(true);

        assertThatThrownBy(() -> controller.remove(administrator, 1L)).isInstanceOf(DomainException.class);

        verify(products, never()).delete(any());
    }
}
