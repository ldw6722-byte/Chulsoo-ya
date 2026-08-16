package com.chulsooya.server.domain.catalog;
import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
class ProductAdminMutationTest {
 @Test void administrator_can_update_and_deactivate_product() {
  Category category=new Category("TOOLS","Tools","wrench",1);
  Product product=new Product(category,"Existing","10 mm",10000,"EA",null);
  product.updateCatalog(category,"Updated","12 mm","Description","Specification",12000,15000,"EA",null,"Guide brand",false,true);
  product.deactivate();
  assertThat(product.getName()).isEqualTo("Updated");
  assertThat(product.getPrice()).isEqualTo(12000);
  assertThat(product.getBrand()).isEqualTo("Guide brand");
  assertThat(product.isQuickFulfillment()).isTrue();
  assertThat(product.isActive()).isFalse();
 }
}
