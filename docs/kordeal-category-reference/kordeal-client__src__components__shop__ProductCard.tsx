import { Link } from 'react-router';
import type { Product } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import { getPlaceholderImage, handleImageError } from './NoImage';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id);
      alert('장바구니에 담겼습니다!');
    } catch {
      alert('로그인이 필요합니다.');
    }
  };

  return (
    <Link to={`/product/${product.id}`} className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* 상품 이미지 */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.thumbnail || getPlaceholderImage(300, 300, product.name.substring(0, 10))}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => handleImageError(e, 300)}
        />
        {product.rocketDelivery && (
          <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            🚀 코딜배송
          </span>
        )}
        {product.discountRate && product.discountRate > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{product.discountRate}%
          </span>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="p-3">
        <p className="text-xs text-gray-400 mb-1 truncate">{product.brand}</p>
        <h3 className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug mb-2 group-hover:text-brand-600 transition-colors">
          {product.name}
        </h3>

        {/* 가격 */}
        <div className="mb-2">
          {product.originalPrice && product.originalPrice > product.price && (
            <p className="text-xs text-gray-400 line-through">
              {product.originalPrice.toLocaleString()}원
            </p>
          )}
          <p className="text-base font-bold text-gray-900 dark:text-white">
            {product.discountRate && product.discountRate > 0 && (
              <span className="text-red-500 mr-1">{product.discountRate}%</span>
            )}
            {product.price.toLocaleString()}원
          </p>
        </div>

        {/* 평점 */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex text-yellow-400 text-xs">
            {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
          </div>
          <span className="text-xs text-gray-400">({product.reviewCount.toLocaleString()})</span>
        </div>

        {/* 장바구니 버튼 */}
        <button
          onClick={handleAddToCart}
          className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          장바구니 담기
        </button>
      </div>
    </Link>
  );
}
