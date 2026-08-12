package com.chulsooya.server.domain.catalog;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "categories")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    /** 메가 메뉴와 홈 카테고리 카드에 표시하는 아이콘. */
    @Column(length = 50)
    private String iconKey;

    @Column(length = 500)
    private String imageUrl;

    @Column(nullable = false)
    private int sortOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private final List<Category> children = new ArrayList<>();

    /** 1=대분류, 2=중분류, 3=소분류. */
    @Column(nullable = false)
    private int level = 1;

    @Column(nullable = false)
    private boolean active = true;

    public Category(String code, String name, String iconKey, int sortOrder) {
        this(code, name, iconKey, sortOrder, null, 1);
    }

    public Category(String code, String name, String iconKey, int sortOrder, Category parent, int level) {
        if (level < 1 || level > 3) {
            throw new IllegalArgumentException("카테고리 깊이는 1~3만 허용됩니다.");
        }
        this.code = code;
        this.name = name;
        this.iconKey = iconKey;
        this.sortOrder = sortOrder;
        this.parent = parent;
        this.level = level;
        if (parent != null) {
            parent.children.add(this);
        }
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
