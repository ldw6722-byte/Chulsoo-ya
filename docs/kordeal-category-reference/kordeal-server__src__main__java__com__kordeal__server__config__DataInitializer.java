package com.kordeal.server.config;

import com.kordeal.server.domain.category.entity.Category;
import com.kordeal.server.domain.category.repository.CategoryRepository;
import com.kordeal.server.domain.product.entity.Product;
import com.kordeal.server.domain.product.repository.ProductRepository;
import com.kordeal.server.domain.user.entity.User;
import com.kordeal.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            log.info("데이터가 이미 존재합니다. 초기화를 건너뜁니다.");
            return;
        }

        log.info("샘플 데이터 초기화 시작...");

        // 샘플 유저 생성 (id=1)
        User sampleUser = User.builder()
                .email("ldw6722@gmail.com")
                .name("마스터")
                .role(User.Role.ADMIN)
                .supabaseId("sample-user-1")
                .active(true)
                .build();
        userRepository.save(sampleUser);
        log.info("샘플 유저 생성 완료 (id=1)");

        // 대분류 카테고리
        Category fashion = createCategory("패션의류/잡화", null, 1, 1, "👗");
        Category beauty = createCategory("뷰티", null, 1, 2, "💄");
        Category baby = createCategory("출산/유아동", null, 1, 3, "🍼");
        Category food = createCategory("식품", null, 1, 4, "🍎");
        Category kitchen = createCategory("주방용품", null, 1, 5, "🍳");
        Category living = createCategory("생활용품", null, 1, 6, "🏠");
        Category interior = createCategory("홈인테리어", null, 1, 7, "🛋️");
        Category appliance = createCategory("가전디지털", null, 1, 8, "📱");
        Category sports = createCategory("스포츠/레저", null, 1, 9, "⚽");
        Category auto = createCategory("자동차용품", null, 1, 10, "🚗");
        Category books = createCategory("도서/음반/DVD", null, 1, 11, "📚");
        Category toys = createCategory("완구/취미", null, 1, 12, "🎮");
        Category office = createCategory("문구/오피스", null, 1, 13, "✏️");
        Category pet = createCategory("반려동물용품", null, 1, 14, "🐾");
        Category health = createCategory("헬스/건강식품", null, 1, 15, "💊");

        // 식품 중분류
        Category beverages = createCategory("음료/커피/차", food, 2, 1, null);
        Category snacks = createCategory("과자/스낵", food, 2, 2, null);
        Category ramen = createCategory("라면/면류", food, 2, 3, null);
        Category rice = createCategory("쌀/잡곡/견과", food, 2, 4, null);
        Category dairy = createCategory("유제품/달걀", food, 2, 5, null);
        Category meat = createCategory("축산물/계란", food, 2, 6, null);
        Category seafood = createCategory("수산물/건어물", food, 2, 7, null);
        Category organic = createCategory("유기농/건강식품", food, 2, 8, null);

        // 음료 소분류
        Category water = createCategory("생수", beverages, 3, 1, null);
        Category juice = createCategory("주스/음료", beverages, 3, 2, null);
        Category coffee = createCategory("커피", beverages, 3, 3, null);
        Category tea = createCategory("차/허브티", beverages, 3, 4, null);

        // 가전디지털 중분류
        Category mobile = createCategory("스마트폰/태블릿", appliance, 2, 1, null);
        Category laptop = createCategory("노트북/PC", appliance, 2, 2, null);
        Category tv = createCategory("TV/영상가전", appliance, 2, 3, null);
        Category audio = createCategory("음향가전", appliance, 2, 4, null);
        Category homeAppliance = createCategory("생활가전", appliance, 2, 5, null);

        // 스마트폰 소분류
        Category iphone = createCategory("아이폰", mobile, 3, 1, null);
        Category galaxy = createCategory("갤럭시", mobile, 3, 2, null);
        Category accessories = createCategory("휴대폰 액세서리", mobile, 3, 3, null);

        log.info("카테고리 생성 완료");

        // 샘플 상품 생성
        createProduct("삼다수 2L 12개", "제주 삼다수 생수 2L 12개입 묶음", 12900, 15000, water, "제주개발공사", true, true, 4.8, 15420, 50000);
        createProduct("아이시스 ECO 2L 12개", "아이시스 ECO 생수 2L 12개", 10900, 13000, water, "롯데칠성", true, false, 4.6, 8320, 30000);
        createProduct("에비앙 500ml 20개", "프랑스 에비앙 천연 미네랄워터", 24900, 28000, water, "에비앙", true, false, 4.7, 5210, 20000);
        createProduct("코카콜라 제로 355ml 24캔", "코카콜라 제로 슈거 355ml 24캔", 22900, 26000, juice, "코카콜라", true, true, 4.5, 12300, 45000);
        createProduct("스타벅스 콜드브루 블랙 325ml 10개", "스타벅스 콜드브루 블랙 325ml 10개입", 34900, 39000, coffee, "스타벅스", true, true, 4.9, 9870, 35000);
        createProduct("갓성비 원두커피 1kg", "에티오피아 예가체프 원두 1kg", 18900, 25000, coffee, "커피빈", false, false, 4.4, 3210, 15000);
        createProduct("신라면 멀티팩 5개입", "농심 신라면 120g 5개입", 4500, 5000, ramen, "농심", true, true, 4.8, 45600, 120000);
        createProduct("진라면 순한맛 5개입", "오뚜기 진라면 순한맛 120g 5개입", 4200, 4800, ramen, "오뚜기", true, false, 4.6, 23400, 80000);
        createProduct("삼성 갤럭시 S25 256GB", "삼성 갤럭시 S25 스마트폰 256GB 팬텀블랙", 1099000, 1199000, galaxy, "삼성전자", true, true, 4.7, 2340, 8000);
        createProduct("아이폰 16 Pro 256GB", "Apple 아이폰 16 Pro 256GB 티타늄 블랙", 1550000, 1650000, iphone, "Apple", true, true, 4.8, 3120, 12000);
        createProduct("갤럭시 버즈3 Pro", "삼성 갤럭시 버즈3 Pro 무선 이어폰", 249000, 299000, accessories, "삼성전자", true, true, 4.6, 1890, 7000);
        createProduct("LG 올레드 TV 65인치", "LG OLED65C4KNA 65인치 4K OLED TV", 2490000, 2990000, tv, "LG전자", false, true, 4.9, 890, 3000);
        createProduct("다이슨 V15 무선청소기", "다이슨 V15 Detect Absolute 무선청소기", 899000, 999000, homeAppliance, "다이슨", true, true, 4.8, 1560, 5000);
        createProduct("비비고 왕교자 1.05kg", "CJ 비비고 왕교자 1.05kg", 8900, 10000, food, "CJ제일제당", true, true, 4.7, 34500, 90000);
        createProduct("오뚜기 진짜쫄면 4개입", "오뚜기 진짜쫄면 230g 4개입", 5900, 7200, ramen, "오뚜기", true, false, 4.5, 12300, 40000);

        log.info("샘플 상품 {} 개 생성 완료", productRepository.count());
    }

    private Category createCategory(String name, Category parent, int level, int sortOrder, String icon) {
        Category category = Category.builder()
                .name(name)
                .parent(parent)
                .level(level)
                .sortOrder(sortOrder)
                .icon(icon)
                .active(true)
                .build();
        return categoryRepository.save(category);
    }

    private void createProduct(String name, String description, int price, int originalPrice,
                                Category category, String brand, boolean rocketDelivery, boolean featured,
                                double rating, int reviewCount, int salesCount) {
        Product product = Product.builder()
                .name(name)
                .description(description)
                .price(BigDecimal.valueOf(price))
                .originalPrice(BigDecimal.valueOf(originalPrice))
                .category(category)
                .brand(brand)
                .seller(brand)
                .stock(999)
                .rocketDelivery(rocketDelivery)
                .featured(featured)
                .rating(BigDecimal.valueOf(rating))
                .reviewCount(reviewCount)
                .salesCount(salesCount)
                .active(true)
                .images(List.of(
                        "https://via.placeholder.com/400x400?text=" + name.substring(0, Math.min(name.length(), 10))
                ))
                .build();
        productRepository.save(product);
    }
}
