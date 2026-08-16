package com.chulsooya.server.domain.catalog;
import java.util.*; import org.springframework.web.bind.annotation.*; import com.chulsooya.server.common.*;
@RestController @RequestMapping("/api/products") public class ProductPriceTierController {
private final ProductPriceTierRepository tiers; private final ProductRepository products;
public ProductPriceTierController(ProductPriceTierRepository tiers, ProductRepository products){this.tiers=tiers;this.products=products;}
private List<ProductPriceTier> listOrCreate(Long id){
 var list=tiers.findByProductIdAndActiveTrueOrderBySortOrderAsc(id);
 if(!list.isEmpty()) return list;
 var p=products.findByIdAndActiveTrue(id).orElseThrow(()->new DomainException(ErrorCode.NOT_FOUND));
 var brand=p.getBrand()==null||p.getBrand().isBlank()?"Seller available brands":p.getBrand();
 return List.of(tiers.save(new ProductPriceTier(p,"Base price tier",p.getPrice(),brand,"The selected price tier may be supplied with the seller available brand. See the brand guide.",0)));
}
@GetMapping("/{productId}/price-tiers") public ApiResponse<List<PriceTierResponse>> list(@PathVariable Long productId){return ApiResponse.of(listOrCreate(productId).stream().map(PriceTierResponse::from).toList());}
public record PriceTierResponse(Long id,String label,int salePrice,String guideBrands,String guideMessage){static PriceTierResponse from(ProductPriceTier t){return new PriceTierResponse(t.getId(),t.getLabel(),t.getSalePrice(),t.getGuideBrands(),t.getGuideMessage());}} }
