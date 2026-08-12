import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { productAPI, categoryAPI, type Product, type Category } from '../../lib/api';
import ProductCard from '../../components/shop/ProductCard';

const SORT_OPTIONS = [
  { value: 'popular', label: '인기순' },
  { value: 'newest', label: '최신순' },
  { value: 'price_asc', label: '낮은 가격순' },
  { value: 'price_desc', label: '높은 가격순' },
  { value: 'rating', label: '평점순' },
];

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const id = Number(categoryId);

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('popular');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryAPI.getById(id).then(setCategory).catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    productAPI.getByCategory(id, page, 20, sort)
      .then(r => {
        setProducts(r.content);
        setTotalElements(r.totalElements);
        setTotalPages(r.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, page, sort]);

  // 카테고리 변경 시 페이지 초기화
  useEffect(() => { setPage(0); }, [id, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-brand-600">홈</Link>
        <span>›</span>
        {category?.parentId && (
          <>
            <Link to={`/category/${category.parentId}`} className="hover:text-brand-600">상위 카테고리</Link>
            <span>›</span>
          </>
        )}
        <span className="text-gray-800 dark:text-gray-200 font-medium">{category?.name || '카테고리'}</span>
      </nav>

      {/* 카테고리 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{category?.name || '상품 목록'}</h1>
          <p className="text-sm text-gray-500 mt-1">총 {totalElements.toLocaleString()}개 상품</p>
        </div>
      </div>

      {/* 하위 카테고리 탭 */}
      {category?.children && category.children.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <Link
            to={`/category/${id}`}
            className="px-4 py-2 rounded-full text-sm font-medium bg-brand-500 text-white"
          >
            전체
          </Link>
          {category.children.map(child => (
            <Link
              key={child.id}
              to={`/category/${child.id}`}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* 정렬 옵션 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${sort === opt.value ? 'bg-brand-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 상품 그리드 */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-lg">이 카테고리에 상품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-brand-400 transition-colors"
          >
            이전
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
            const pageNum = Math.max(0, page - 5) + i;
            if (pageNum >= totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-10 h-10 rounded-lg text-sm transition-colors ${pageNum === page ? 'bg-brand-500 text-white' : 'border border-gray-200 hover:border-brand-400'}`}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-brand-400 transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
