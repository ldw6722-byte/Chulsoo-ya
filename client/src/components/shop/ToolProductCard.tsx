import { Link } from 'react-router-dom'
import type { Product } from '@/types/api'
import { formatWon } from '@/components/format'

interface ToolProductCardProps {
  product: Product
  adding?: boolean
  onAdd?: (product: Product) => void
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))
  return <span className="tracking-tight text-amber-400">{'\u2605'.repeat(filled)}{'\u2606'.repeat(5 - filled)}</span>
}

function ToolPlaceholder() {
  return <div className="grid h-full place-items-center bg-slate-50 text-slate-300 dark:bg-slate-800/70 dark:text-slate-600"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12"><path strokeLinecap="round" strokeLinejoin="round" d="m14.7 6.3-6.9 6.9m0 0L4.5 9.9m3.3 3.3 3.3 3.3m0 0 6.9-6.9m0 0 1.8 1.8a2.1 2.1 0 0 1 0 3l-3.3 3.3a2.1 2.1 0 0 1-3 0L11 16.5m0 0-3.3 3.3a2.1 2.1 0 0 1-3 0l-1.5-1.5a2.1 2.1 0 0 1 0-3L6.5 12" /></svg></div>
}

export function ToolProductCard({ product, adding = false, onAdd }: ToolProductCardProps) {
  const hasDiscount = Boolean(product.discountRate && product.discountRate > 0)
  const category = product.brand ?? product.categoryName

  return <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
    <Link to={`/product/${product.id}`} className="flex min-h-0 flex-1 flex-col" aria-label={`${product.name} \uC0C1\uD488 \uC0C1\uC138 \uBCF4\uAE30`}>
      <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800">
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.035]" /> : <ToolPlaceholder />}
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          {product.quickFulfillment ? <span className="rounded-md bg-slate-950 px-2 py-1 text-[10px] font-black text-white shadow-sm dark:bg-white dark:text-slate-950">{'\uBE60\uB978 \uB9E4\uCE6D'}</span> : <span />}
          {hasDiscount ? <span className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-black text-white shadow-sm">-{product.discountRate}%</span> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-1 text-[11px] font-bold tracking-wide text-slate-400">{category}</p>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800 transition group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">{product.name}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{product.specSummary ?? '\uD45C\uC900 \uADDC\uACA9 \uC0C1\uD488'}</p>
        <div className="mt-auto pt-4">
          {product.originalPrice && product.originalPrice > product.price ? <p className="mb-0.5 text-[11px] text-slate-400 line-through">{formatWon(product.originalPrice)}</p> : null}
          <div className="flex items-end justify-between gap-2">
            <p className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{hasDiscount ? <span className="mr-1 text-rose-600">{product.discountRate}%</span> : null}{formatWon(product.price)}</p>
            {product.unit ? <span className="mb-0.5 shrink-0 text-[11px] font-medium text-slate-400">/ {product.unit}</span> : null}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px]"><Stars rating={product.rating} /><span className="text-slate-400">({product.reviewCount.toLocaleString()})</span></div>
        </div>
      </div>
    </Link>
    {onAdd ? <div className="border-t border-slate-100 p-3 dark:border-slate-800"><button type="button" disabled={adding} onClick={() => onAdd(product)} className="w-full rounded-lg bg-slate-950 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-brand-300">{adding ? '\uB2F4\uB294 \uC911\u2026' : '\uC7A5\uBC14\uAD6C\uB2C8 \uB2F4\uAE30'}</button></div> : null}
  </article>
}