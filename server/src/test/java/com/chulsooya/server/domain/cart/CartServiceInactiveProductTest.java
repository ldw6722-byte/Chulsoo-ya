package com.chulsooya.server.domain.cart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.domain.catalog.Category;
import com.chulsooya.server.domain.catalog.Product;
import com.chulsooya.server.domain.catalog.ProductPriceTierRepository;
import com.chulsooya.server.domain.catalog.ProductRepository;

@ExtendWith(MockitoExtension.class)
class CartServiceInactiveProductTest {
    @Mock private CartRepository carts;
    @Mock private ProductRepository products;
    @Mock private ProductPriceTierRepository priceTiers;

    @Test
    void cart_response_marks_deactivated_product_as_unavailable() {
        CartService service = new CartService(carts, products, priceTiers);
        Cart cart = new Cart(1L);
        cart.addOrIncrease(7L, "-", 11L, "기본 옵션", 7200, "표준 브랜드", 1);
        Product product = new Product(new Category("TOOLS", "Tools", "wrench", 1), "테스트 상품", "10 mm", 7200, "EA", null);
        product.deactivate();
        ReflectionTestUtils.setField(product, "id", 7L);
        when(products.findAllById(List.of(7L))).thenReturn(List.of(product));

        var response = service.toResponse(cart);

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().getFirst().active()).isFalse();
    }

    @Test
    void inactive_product_quantity_change_is_rejected() {
        CartService service = new CartService(carts, products, priceTiers);
        Cart cart = new Cart(1L);
        cart.addOrIncrease(7L, "-", 11L, "기본 옵션", 7200, "표준 브랜드", 1);
        ReflectionTestUtils.setField(cart.getItems().getFirst(), "id", 99L);
        Product product = new Product(new Category("TOOLS", "Tools", "wrench", 1), "테스트 상품", "10 mm", 7200, "EA", null);
        product.deactivate();
        when(carts.findByConsumerIdAndActiveTrue(1L)).thenReturn(Optional.of(cart));
        when(products.findById(7L)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> service.changeQuantity(1L, 99L, 2)).isInstanceOf(DomainException.class);
    }
}
