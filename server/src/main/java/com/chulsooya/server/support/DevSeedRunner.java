package com.chulsooya.server.support;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.domain.catalog.Category;
import com.chulsooya.server.domain.catalog.CategoryRepository;
import com.chulsooya.server.domain.catalog.Product;
import com.chulsooya.server.domain.catalog.ProductRepository;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;

/** app.seed.enabled=true (local 프로파일) 에서만 실행되는 개발 시드. */
@Configuration
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DevSeedRunner {

    private static String guCode(String guName) {
        return "GU_" + Integer.toHexString(guName.hashCode() & 0xFFFF).toUpperCase();
    }

    @Bean
    @Order(0)
    public ApplicationRunner seedRunner(UserRepository users, StoreRepository stores,
            CategoryRepository categories, ProductRepository products,
            @Value("${app.seed.users:true}") boolean seedUsers) {
        return args -> seed(users, stores, categories, products, seedUsers);
    }

    @Transactional
    void seed(UserRepository users, StoreRepository stores,
            CategoryRepository categories, ProductRepository products, boolean seedUsers) {
        if (categories.count() > 0) {
            seedStoresIfNeeded(users, stores, seedUsers);
            return;
        }
        // 대분류 → 중분류 → 소분류. 상품은 소분류에 연결한다.
        Category hand = category(categories, "HAND_TOOL", "수공구·측정", "🔨", 1, null, 1);
        Category driver = category(categories, "DRIVER_WRENCH", "드라이버·렌치", "🪛", 1, hand, 2);
        Category screwdrivers = category(categories, "SCREWDRIVER", "드라이버", "🔧", 1, driver, 3);
        Category wrenches = category(categories, "WRENCH", "렌치·스패너", "🔩", 2, driver, 3);
        Category cutting = category(categories, "CUTTING_FINISH", "절단·가공", "✂️", 2, hand, 2);
        Category saws = category(categories, "SAW_CUTTER", "톱·커터", "🪚", 1, cutting, 3);
        Category measuring = category(categories, "MEASURE_MARK", "측정·표시", "📏", 3, hand, 2);
        Category tapes = category(categories, "TAPE_LEVEL", "줄자·수평계", "📐", 1, measuring, 3);

        Category power = category(categories, "POWER_TOOL", "전동·충전공구", "⚡", 2, null, 1);
        Category drill = category(categories, "DRILL_HAMMER", "드릴·햄머", "🛠️", 1, power, 2);
        Category cordless = category(categories, "CORDLESS_DRILL", "충전드릴", "🔋", 1, drill, 3);
        Category hammer = category(categories, "HAMMER_DRILL", "함마드릴", "🏗️", 2, drill, 3);
        Category grinding = category(categories, "GRIND_CUT", "절단·연마", "🪚", 2, power, 2);
        Category grinder = category(categories, "GRINDER", "그라인더", "⚙️", 1, grinding, 3);
        Category accessory = category(categories, "POWER_ACCESSORY", "비트·날·배터리", "🔩", 3, power, 2);
        Category drillBits = category(categories, "DRILL_BIT", "드릴비트·톱날", "🧰", 1, accessory, 3);

        Category fastener = category(categories, "FASTENER", "나사·볼트·철물", "🔩", 3, null, 1);
        Category screws = category(categories, "SCREW_PIECE", "나사·피스", "📌", 1, fastener, 2);
        Category woodScrews = category(categories, "WOOD_SCREW", "목공피스", "🪵", 1, screws, 3);
        Category bolts = category(categories, "BOLT_NUT", "볼트·너트", "🔩", 2, fastener, 2);
        Category hexBolt = category(categories, "HEX_BOLT", "육각볼트", "⬡", 1, bolts, 3);
        Category anchors = category(categories, "ANCHOR_RIVET", "앵커·리벳", "⚓", 3, fastener, 2);
        Category wallAnchor = category(categories, "WALL_ANCHOR", "칼블럭·앙카", "🧱", 1, anchors, 3);
        Category locks = category(categories, "LOCK_HINGE", "경첩·잠금", "🔐", 4, fastener, 2);
        Category doorHinge = category(categories, "DOOR_HINGE", "도어경첩", "🚪", 1, locks, 3);

        Category plumbing = category(categories, "PLUMBING", "배관·수전·설비", "🚰", 4, null, 1);
        Category pipes = category(categories, "PIPE_FITTING", "수도배관", "🧩", 1, plumbing, 2);
        Category pvc = category(categories, "PVC_PIPE", "PVC 파이프·부속", "➿", 1, pipes, 3);
        Category valve = category(categories, "VALVE_FAUCET", "밸브·수전", "🚿", 2, plumbing, 2);
        Category faucet = category(categories, "FAUCET", "수전·샤워기", "🚰", 1, valve, 3);
        Category hose = category(categories, "HOSE_PUMP", "호스·펌프", "🌀", 3, plumbing, 2);
        Category waterHose = category(categories, "WATER_HOSE", "릴호스·물호스", "💧", 1, hose, 3);
        Category ventilation = category(categories, "BOILER_VENT", "보일러·환기", "🌬️", 4, plumbing, 2);
        Category fan = category(categories, "VENTILATION_FAN", "환풍기", "🌀", 1, ventilation, 3);

        Category electrical = category(categories, "ELECTRICAL", "전기·조명", "💡", 5, null, 1);
        Category cable = category(categories, "CABLE_WIRE", "전선·케이블", "〰️", 1, electrical, 2);
        Category vctf = category(categories, "VCTF_CABLE", "전선·코드", "🔌", 1, cable, 3);
        Category switchGear = category(categories, "SWITCH_OUTLET", "스위치·콘센트", "⏻", 2, electrical, 2);
        Category outlet = category(categories, "MULTITAP", "멀티탭·콘센트", "🔋", 1, switchGear, 3);
        Category lighting = category(categories, "LIGHTING", "조명", "💡", 3, electrical, 2);
        Category led = category(categories, "LED_LAMP", "LED 전구·등기구", "✨", 1, lighting, 3);

        Category construction = category(categories, "CONSTRUCTION", "건축·보수자재", "🧱", 6, null, 1);
        Category mortar = category(categories, "MORTAR_CEMENT", "시멘트·미장", "🏗️", 1, construction, 2);
        Category cement = category(categories, "CEMENT", "시멘트·보수몰탈", "🪣", 1, mortar, 3);
        Category waterproof = category(categories, "WATERPROOF_INSULATION", "방수·단열", "🛡️", 2, construction, 2);
        Category insulation = category(categories, "INSULATION", "단열재", "🧊", 1, waterproof, 3);
        Category board = category(categories, "WOOD_BOARD", "목재·판재", "🪵", 3, construction, 2);
        Category plywood = category(categories, "PLYWOOD", "합판·각재", "🪚", 1, board, 3);

        Category chemical = category(categories, "ADHESIVE", "접착·화학·도장", "🧴", 7, null, 1);
        Category sealant = category(categories, "SEALANT_ADHESIVE", "실리콘·접착제", "🧪", 1, chemical, 2);
        Category silicone = category(categories, "SILICONE", "실리콘 실란트", "🫧", 1, sealant, 3);
        Category tape = category(categories, "TAPE", "테이프", "📎", 2, chemical, 2);
        Category masking = category(categories, "MASKING_TAPE", "마스킹·보수테이프", "➰", 1, tape, 3);
        Category coating = category(categories, "PAINT_CLEAN", "페인트·세정", "🎨", 3, chemical, 2);
        Category rust = category(categories, "RUST_LUBE", "방청·윤활제", "🛢️", 1, coating, 3);

        Category safety = category(categories, "SAFETY", "안전·작업용품", "🦺", 8, null, 1);
        Category ppe = category(categories, "PPE", "보호구", "⛑️", 1, safety, 2);
        Category gloves = category(categories, "WORK_GLOVES", "작업장갑", "🧤", 1, ppe, 3);
        Category footwear = category(categories, "WORK_CLOTHING", "작업복·안전화", "🥾", 2, safety, 2);
        Category boots = category(categories, "SAFETY_BOOTS", "안전화", "🥾", 1, footwear, 3);
        Category ladder = category(categories, "LADDER_CARRY", "사다리·운반", "🪜", 3, safety, 2);
        Category stepLadder = category(categories, "STEP_LADDER", "A형 사다리", "🪜", 1, ladder, 3);
        Category welding = category(categories, "WELDING", "용접·산업", "🔥", 4, safety, 2);
        Category weldingMask = category(categories, "WELDING_MASK", "용접면·용접장갑", "🔥", 1, welding, 3);

        Category living = category(categories, "LIVING", "생활철물·공구함", "🏠", 9, null, 1);
        Category doors = category(categories, "DOOR_WINDOW", "도어·창호", "🚪", 1, living, 2);
        Category doorLock = category(categories, "DOOR_LOCK", "도어락·문고리", "🔐", 1, doors, 3);
        Category storage = category(categories, "TOOL_STORAGE", "수납·공구함", "🧰", 2, living, 2);
        Category toolBox = category(categories, "TOOL_BOX", "공구함·작업대", "🧰", 1, storage, 3);
        Category bath = category(categories, "BATH_KITCHEN", "욕실·주방", "🚿", 3, living, 2);
        Category drain = category(categories, "DRAIN", "배수구·환풍", "🌀", 1, bath, 3);

        products.saveAll(List.of(
                product(screwdrivers, "양날 정밀 드라이버 세트 6종", "PH0~PH3 / 자석팁", 15800, "세트", "스마토", "가정·현장 보수용 크롬바나듐 드라이버 세트", 18900, 4.8, 328, 1380, true, true, "driver"),
                product(wrenches, "몽키스패너 250mm", "최대 개구 30mm / 크롬바나듐", 18500, "개", "세신", "배관과 설비 작업에 쓰는 조절식 스패너", 22000, 4.7, 215, 960, true, true, "wrench"),
                product(saws, "다목적 접이식 톱 180mm", "교체형 톱날 / 잠금장치", 12900, "개", "스마토", "목재·PVC·얇은 금속 절단용 접이식 톱", 15000, 4.6, 87, 430, false, true, "saw"),
                product(tapes, "자동 잠금 줄자 5.5m", "폭 25mm / 양면 눈금", 8900, "개", "코메론", "정확한 현장 측정을 위한 양면 눈금 줄자", 11000, 4.9, 574, 3210, true, true, "tape"),
                product(cordless, "충전 드릴 드라이버 12V", "배터리 2개 / 토크 30Nm", 89000, "세트", "보쉬", "가정 수리와 목공 작업에 적합한 충전 드릴", 109000, 4.8, 146, 740, true, true, "drill"),
                product(hammer, "SDS PLUS 전기 함마드릴", "800W / 3모드 / 케이스 포함", 204700, "세트", "보쉬", "콘크리트 천공과 타공 작업용 전기 함마드릴", 360000, 4.9, 68, 270, false, true, "hammer"),
                product(grinder, "4인치 핸드 그라인더 720W", "안전커버 / 절단석 별도", 65000, "개", "마끼다", "금속 절단·연마 작업용 경량 그라인더", 79000, 4.7, 95, 520, true, false, "grinder"),
                product(drillBits, "철공 드릴비트 세트 19종", "HSS / 1~10mm", 19800, "세트", "디월트", "철재·목재 천공용 비트 세트", 24000, 4.6, 72, 390, false, true, "bit"),
                product(woodScrews, "목공피스 4x30mm 100입", "아연도금 / 목재용", 4500, "봉", "영진", "목재와 합판 고정용 십자 피스", 5200, 4.8, 1200, 8930, true, true, "screw"),
                product(hexBolt, "육각 볼트 M8x50 50입", "아연도금 / 너트 포함", 9800, "봉", "대진", "기계·철물 조립용 육각 볼트와 너트 구성", 11200, 4.7, 364, 2290, false, true, "bolt"),
                product(wallAnchor, "칼블럭 앵커 6mm 100입", "콘크리트 앵커 / 피스 호환", 5200, "봉", "피셔", "콘크리트와 벽돌 벽면 고정용 플라스틱 앵커", 6200, 4.8, 824, 6150, true, true, "anchor"),
                product(doorHinge, "스텐 도어 경첩 3인치 2개", "SUS304 / 무광", 6800, "세트", "국산", "방문과 수납장 설치용 스테인리스 경첩", 7900, 4.5, 143, 860, false, false, "hinge"),
                product(pvc, "PVC 배관 20mm 1m", "KS 규격 / 흰색", 3200, "본", "동양", "가정·상가 급수 배관용 PVC 파이프", 3800, 4.7, 302, 1720, true, true, "pipe"),
                product(faucet, "세면대 단일레버 수전", "황동 / 호스 포함", 42000, "개", "대림", "누수 보수와 교체에 쓰는 세면대용 레버 수전", 51000, 4.6, 164, 760, true, false, "faucet"),
                product(waterHose, "릴 호스 20m", "꼬임 방지 / 분사건 포함", 38900, "개", "스마토", "세차·정원·현장 청소용 자동 감김 호스", 45000, 4.7, 91, 410, false, false, "hose"),
                product(fan, "욕실용 환풍기 100mm", "자동 셔터 / 저소음", 14300, "개", "신일", "욕실과 다용도실 환기용 저소음 환풍기", 16900, 4.5, 88, 460, false, true, "fan"),
                product(vctf, "VCTF 전선 2C 1.5sq 10m", "연선 / 실내용", 15600, "롤", "대한전선", "멀티탭·조명 연장 작업용 유연한 전선", 18500, 4.8, 511, 2750, true, true, "cable"),
                product(outlet, "개별 스위치 멀티탭 4구 3m", "과부하 차단 / 접지", 12900, "개", "현대", "가정과 매장용 개별 스위치 멀티탭", 15900, 4.7, 669, 4210, true, true, "multitap"),
                product(led, "LED 전구 10W 주광색", "E26 / 900lm", 4800, "개", "금호", "기존 백열전구를 교체하는 절전형 LED 전구", 5800, 4.8, 940, 5470, true, true, "led"),
                product(cement, "보수용 시멘트 몰탈 5kg", "내·외부 보수용", 8900, "포", "쌍용", "균열과 파손 부위 보수용 급결 몰탈", 10500, 4.5, 115, 620, false, false, "cement"),
                product(insulation, "단열 보드 30T 900x1800", "XPS / 단열·방습", 15800, "장", "벽산", "내부 벽체와 바닥 단열 시공용 보드", 18000, 4.6, 76, 340, false, false, "insulation"),
                product(plywood, "합판 12T 910x1820", "E0 등급 / 재단 상담", 23800, "장", "동화", "가구 제작과 보수 공사용 일반 합판", 27000, 4.7, 133, 580, false, false, "plywood"),
                product(silicone, "욕실·주방 실리콘 300ml", "곰팡이 방지 / 백색", 5500, "개", "오공", "타일 틈과 수전 주변 마감용 실리콘 실란트", 6500, 4.8, 745, 4860, true, true, "silicone"),
                product(masking, "방수 보수 테이프 5cm x 5m", "고점착 / 은색", 7800, "롤", "3M", "배관·지붕·캠핑 장비의 빠른 틈새 보수용", 9200, 4.5, 153, 970, false, true, "tape"),
                product(rust, "다목적 방청 윤활제 360ml", "녹 방지 / 삐걱임 제거", 6900, "개", "WD-40", "금속 부품의 방청과 윤활에 사용하는 다목적 스프레이", 7900, 4.9, 1080, 7670, true, true, "lube"),
                product(gloves, "NBR 코팅 작업장갑 10켤레", "미끄럼 방지 / L", 9900, "묶음", "3M", "정밀 작업과 일반 현장 작업에 적합한 코팅 장갑", 12000, 4.8, 925, 6230, true, true, "gloves"),
                product(boots, "안전화 4인치 경량형", "KCS 인증 / 265mm", 90200, "켤레", "K2", "낙하물과 미끄럼을 대비한 현장용 경량 안전화", 105000, 4.7, 119, 540, false, false, "boots"),
                product(stepLadder, "알루미늄 A형 사다리 4단", "미끄럼방지 발판", 45900, "개", "스마토", "전구 교체와 실내 보수에 적합한 경량 사다리", 53000, 4.6, 191, 980, false, false, "ladder"),
                product(weldingMask, "자동 차광 용접면", "DIN 9~13 / 헤드밴드", 55900, "개", "오토스", "용접 아크 광원을 보호하는 자동 차광 용접면", 65000, 4.5, 67, 260, false, false, "welding"),
                product(doorLock, "방문용 원통형 도어락", "키 3개 / 우측·좌측 겸용", 21900, "개", "게이트맨", "방문과 사무실 문 교체용 원통형 도어락", 25000, 4.6, 227, 1210, false, true, "doorlock"),
                product(toolBox, "하드 공구함 19인치", "탈착 트레이 / 잠금장치", 24800, "개", "스탠리", "수공구와 소모품을 안전하게 보관하는 공구함", 29000, 4.8, 312, 1890, true, true, "toolbox"),
                product(drain, "스텐 욕실 배수구 트랩", "악취 차단 / 100mm", 12800, "개", "대림", "욕실 배수구 냄새와 벌레 유입을 막는 스텐 트랩", 15000, 4.5, 106, 650, false, true, "drain")));

        if (!seedUsers) {
            return;
        }

        users.save(new User("consumer@chulsooya.dev", "김소비", "010-1000-0001", UserRole.CONSUMER));
        users.save(new User("admin@chulsooya.dev", "운영자", "010-9000-0001", UserRole.ADMIN));
        seedSeoulMockStores(users, stores);
    }

    /** 개발·검증용 목데이터: 서울 10개 구에 구별 10개 판매점. */
    private void seedStoresIfNeeded(UserRepository users, StoreRepository stores, boolean seedUsers) {
        if (!seedUsers || stores.count() > 0) return;
        users.findByEmail("consumer@chulsooya.dev").orElseGet(() -> users.save(new User("consumer@chulsooya.dev", "김소비", "010-1000-0001", UserRole.CONSUMER)));
        users.findByEmail("admin@chulsooya.dev").orElseGet(() -> users.save(new User("admin@chulsooya.dev", "운영자", "010-9000-0001", UserRole.ADMIN)));
        seedSeoulMockStores(users, stores);
    }

    private void seedSeoulMockStores(UserRepository users, StoreRepository stores) {
        String[] districts = {"강남구", "강동구", "강서구", "관악구", "광진구", "마포구", "송파구", "영등포구", "용산구", "성동구"};
        String[] storeTypes = {"종합철물", "공구마켓", "배관설비", "전기자재", "건축자재", "안전용품", "생활철물", "프로공구", "설비상사", "철물센터"};
        String[] itemSets = {"전동공구,수공구,안전용품", "배관자재,수전,욕실용품", "전선,조명,전기자재", "시멘트,몰탈,단열재", "나사,볼트,접착제", "작업장갑,안전화,보호구", "페인트,실리콘,방수용품", "공구함,사다리,측정공구", "문고리,도어락,보수자재", "생활철물,청소용품,수납용품"};
        for (int districtIndex = 0; districtIndex < districts.length; districtIndex++) {
            String district = districts[districtIndex];
            for (int number = 1; number <= 10; number++) {
                String email = "store-" + (districtIndex + 1) + "-" + number + "@chulsooya.dev";
                String storeName = district + " " + storeTypes[number - 1];
                if (district.equals("강남구") && number == 1) { email = "seller1@chulsooya.dev"; storeName = "철수네 철물점"; }
                if (district.equals("강남구") && number == 2) { email = "seller2@chulsooya.dev"; storeName = "강남 종합공구"; }
                if (district.equals("강남구") && number == 3) { email = "seller3@chulsooya.dev"; storeName = "만능철물"; }
                String phone = "02-" + String.format("%04d", districtIndex * 10 + number) + "-" + String.format("%04d", 1000 + number);
                User owner = users.save(new User(email, storeName + " 사장", phone, UserRole.SELLER));
                SubscriptionTier tier = number <= 2 ? SubscriptionTier.PREMIUM : number <= 6 ? SubscriptionTier.STANDARD : SubscriptionTier.FREE;
                Store store = new Store(owner, storeName, guCode(district), "서울특별시 " + district + " 철수로 " + number, phone, tier);
                store.changeDirectoryProfile(storeName, "서울특별시", district, guCode(district), "서울특별시 " + district + " 철수로 " + number, phone, "https://placehold.co/640x420/e2e8f0/0f172a?text=Store-" + (districtIndex + 1) + "-" + number, itemSets[number - 1]);
                store.changeRating(3.8 + (number % 7) * 0.15);
                store.changeOperatingStatus(true, number != 10);
                store.changeConfiguredSlots(Math.min(number <= 3 ? 5 : 3, tier.getSlotCap()));
                store.adjustTrustScore((68 + number * 2) - store.getTrustScore());
                stores.save(store);
            }
        }
    }

    private Category category(CategoryRepository repository, String code, String name, String icon, int sort, Category parent, int level) {
        return repository.save(new Category(code, name, icon, sort, parent, level));
    }

    private Product product(Category category, String name, String spec, int price, String unit, String brand,
            String description, int originalPrice, double rating, int reviews, int sales, boolean featured, boolean quick, String imageKey) {
        String image = "https://placehold.co/800x800/eff6ff/1d4ed8?text=" + imageKey;
        return new Product(category, name, spec, price, unit, image)
                .catalogInfo(brand, description, spec, originalPrice, rating, reviews, sales, featured, quick, image);
    }

    private void seedSeller(UserRepository users, StoreRepository stores, String email, String storeName, String gu, String address,
            SubscriptionTier tier, double trustScore, int slots) {
        User owner = users.save(new User(email, storeName + " 사장", "010-2000-0000", UserRole.SELLER));
        Store store = new Store(owner, storeName, gu, address, "02-000-0000", tier);
        store.verify();
        store.changeConfiguredSlots(Math.min(slots, tier.getSlotCap()));
        store.adjustTrustScore(trustScore - store.getTrustScore());
        stores.save(store);
    }
}
