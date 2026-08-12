package com.chulsooya.server.domain.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class CategoryTreeAssemblerTest {

    @Test
    void parent_child_grandchild_order_is_preserved_in_three_level_tree() {
        Category handTools = new Category("HAND_TOOL", "수공구·측정", "🔨", 1, null, 1);
        Category driver = new Category("DRIVER_WRENCH", "드라이버·렌치", "🪛", 2, handTools, 2);
        Category screwdriver = new Category("SCREWDRIVER", "드라이버", "🔧", 1, driver, 3);
        Category wrench = new Category("WRENCH", "렌치·스패너", "🔩", 2, driver, 3);

        List<CatalogDtos.CategoryTreeResponse> tree = new CategoryTreeAssembler()
                .assemble(List.of(wrench, screwdriver, driver, handTools));

        assertThat(tree).hasSize(1);
        assertThat(tree.getFirst().code()).isEqualTo("HAND_TOOL");
        assertThat(tree.getFirst().children()).extracting(CatalogDtos.CategoryTreeResponse::code)
                .containsExactly("DRIVER_WRENCH");
        assertThat(tree.getFirst().children().getFirst().children())
                .extracting(CatalogDtos.CategoryTreeResponse::code)
                .containsExactly("SCREWDRIVER", "WRENCH");
    }
}
