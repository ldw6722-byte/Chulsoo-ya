import { Link } from 'react-router-dom'
import type { Product } from '@/types/api'
import { formatWon } from '@/components/format'

interface ToolProductCardProps {
  product: Product
  adding?: boolean
  onAdd?: (product: Product) => void
}

function Stars({ rating }: { rating: number }) {
  return <span className="text-amber-400">{'★'.repeat(Math.max(0, Math.min(5, Math.round(rating))))}{'☆'.repeat(Math.max(0, 5 - Math.round(rating)))}</span>
}

export function ToolProductCard({ product, adding = false, onAdd }: ToolProductCardProps) {
  const hasDiscount = Boolean(product.discountRate && product.discountRate > 0)
  return <article className="group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <Link to={`/product/${product.id}`} className="block" aria-label={`${product.name} 상품 상세 보기`}>
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-brand-50 via-white to-violet-100 dark:from-slate-800 dark:via-slate-900 dark:to-brand-950">
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="grid h-full place-items-center gap-2 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,.94),rgba(219,234,254,.88)_42%,rgba(196,181,253,.72))] text-center"><span className="text-5xl" aria-hidden="true">🔧</span><span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-slate-500 shadow-sm">상품 이미지 준비 중</span></div>}
        {product.quickFulfillment ? <span className="absolute left-2 top-2 rounded-full bg-sky-600 px-2 py-1 text-[10px] font-black text-white shadow-sm">⚡ 빠른 매칭</span> : null}
        {hasDiscount ? <span className="absolute right-2 top-2 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-black text-white shadow-sm">-{product.discountRate}%</span> : null}
      </div>
      <div className="space-y-2 p-3.5"><p className="line-clamp-1 text-[11px] font-semibold text-slate-400">{product.brand ?? product.categoryName}</p><h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800 transition group-hover:text-brand-600 dark:text-slate-100">{product.name}</h3><p className="line-clamp-1 text-xs text-slate-500">{product.specSummary ?? '표준 규격 상품'}</p><div className="pt-1">{product.originalPrice && product.originalPrice > product.price ? <p className="text-xs text-slate-400 line-through">{formatWon(product.originalPrice)}</p> : null}<p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{hasDiscount ? <span className="mr-1 text-rose-500">{product.discountRate}%</span> : null}{formatWon(product.price)}{product.unit ? <span className="ml-1 text-[11px] font-medium text-slate-500">/ {product.unit}</span> : null}</p></div><div className="flex items-center gap-1 text-[11px]"><Stars rating={product.rating} /><span className="text-slate-400">({product.reviewCount.toLocaleString()})</span></div></div>
    </Link>
    {onAdd ? <div className="border-t border-slate-100 p-3 dark:border-slate-800"><button type="button" disabled={adding} onClick={() => onAdd(product)} className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-black text-white transition hover:bg-brand-700 disabled:opacity-50">{adding ? '담는 중…' : '장바구니 담기'}</button></div> : null}
  </article>
}
