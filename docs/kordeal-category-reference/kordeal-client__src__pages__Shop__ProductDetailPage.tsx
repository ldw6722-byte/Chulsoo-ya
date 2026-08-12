import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { productAPI, type Product } from "../../lib/api";
import { useCart } from "../../context/CartContext";
import { getPlaceholderImage, handleImageError } from "../../components/shop/NoImage";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'detail' | 'review' | 'qna'>('detail');

  useEffect(() => {
    if (!productId) return;
    
    // 핵심: 새로운 데이터를 불러올 때 로딩 상태만 true로 하고 product는 유지하여 404 방지
    setLoading(true);
    
    productAPI.getById(Number(productId))
      .then(p => {
        setProduct(p);
        setSelectedImage(0);
        setQuantity(1);
      })
      .catch((err) => {
        console.error("Failed to fetch product:", err);
        setProduct(null); // 에러 발생 시에만 null 처리
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      const go = confirm('장바구니에 담겼습니다!\n장바구니로 이동하시겠습니까?');
      if (go) navigate('/cart');
    } catch (err: any) {
      if (err.message === "LOGIN_REQUIRED") {
        alert('로그인이 필요한 서비스입니다.');
        navigate('/signin');
      } else {
        alert('장바구니 담기에 실패했습니다.');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      await addToCart(product.id, quantity);
      navigate('/checkout');
    } catch (err: any) {
      if (err.message === "LOGIN_REQUIRED") {
        alert('로그인이 필요한 서비스입니다.');
        navigate('/signin');
      } else {
        alert('구매 처리에 실패했습니다.');
      }
    }
  };

  // 1. 최초 로딩 시 (데이터가 아예 없을 때) 스켈레톤 표시
  if (loading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-6">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  // 2. 로딩이 끝났는데 데이터가 없으면 그때서야 404 표시
  if (!loading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-lg text-gray-600 dark:text-gray-400">상품을 찾을 수 없습니다.</p>
        <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  // 안전장치: product가 있을 때만 렌더링
  if (!product) return null;

  const images = product.images?.length > 0
    ? product.images
    : [getPlaceholderImage(500, 500, product.name.substring(0, 15))];

  return (
    <div className={`max-w-7xl mx-auto px-4 py-6 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-brand-600">홈</Link>
        <span>›</span>
        {product.categoryId && (
          <>
            <Link to={`/category/${product.categoryId}`} className="hover:text-brand-600">{product.categoryName}</Link>
            <span>›</span>
          </>
        )}
        <span className="text-gray-800 dark:text-gray-200 truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* 이미지 영역 */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 mb-3 border border-gray-100 dark:border-gray-700">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => handleImageError(e, 500)}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-brand-500' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div>
          {product.rocketDelivery && (
            <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
              🚀 코딜배송
            </span>
          )}
          <p className="text-sm text-gray-400 mb-1">{product.brand}</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-snug">{product.name}</h1>

          {/* 평점 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-400">
              {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
            </div>
            <span className="text-sm text-gray-500">{product.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-400">({product.reviewCount.toLocaleString()}개 리뷰)</span>
          </div>

          {/* 가격 */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 mb-6 border border-gray-100 dark:border-gray-700">
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-400 line-through">{product.originalPrice.toLocaleString()}원</span>
                <span className="text-sm font-bold text-red-500">{product.discountRate}% 할인</span>
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{product.price.toLocaleString()}</span>
              <span className="text-lg font-medium text-gray-900 dark:text-white">원</span>
            </div>
            {product.rocketDelivery && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">🚀 코딜배송 · 내일 도착 · 30,000원 이상 무료배송</p>
            )}
          </div>

          {/* 판매자 */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <span>판매자:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{product.seller || product.brand}</span>
          </div>

          {/* 수량 선택 */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">수량</span>
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
              >−</button>
              <span className="w-12 text-center text-sm font-medium dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
              >+</button>
            </div>
            <span className="text-sm text-gray-400">재고 {product.stock}개</span>
          </div>

          {/* 합계 */}
          <div className="flex items-center justify-between mb-6 p-4 bg-brand-50 dark:bg-brand-900/10 rounded-xl">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">총 상품금액</span>
            <span className="text-2xl font-bold text-brand-600">
              {(product.price * quantity).toLocaleString()}원
            </span>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock === 0}
              className="flex-1 py-4 border-2 border-brand-500 text-brand-600 font-bold rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all disabled:opacity-50"
            >
              {addingToCart ? '담는 중...' : '장바구니 담기'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              {product.stock === 0 ? '품절' : '바로 구매'}
            </button>
          </div>
        </div>
      </div>

      {/* 상세 탭 */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800">
          {(['detail', 'review', 'qna'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-sm font-bold transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {tab === 'detail' ? '상품 상세' : tab === 'review' ? `리뷰 (${product.reviewCount.toLocaleString()})` : 'Q&A'}
            </button>
          ))}
        </div>
        <div className="py-10">
          {activeTab === 'detail' && (
            <div className="max-w-4xl mx-auto">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">
                {product.description || '상품 상세 정보가 없습니다.'}
              </p>
            </div>
          )}
          {activeTab === 'review' && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-lg">아직 작성된 리뷰가 없습니다.</p>
            </div>
          )}
          {activeTab === 'qna' && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">❓</div>
              <p className="text-lg">등록된 문의사항이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
