import { useState } from 'react'
import { catalogApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import type { CategoryTreeNode } from '@/types/api'

interface Props {
  open: boolean
  onSelect: (code: string) => void
}

export function CategoryMegaMenu({ open, onSelect }: Props) {
  const tree = useAsync<CategoryTreeNode[]>(() => catalogApi.categoryTree(), [])
  const roots = tree.data ?? []
  const [rootCode, setRootCode] = useState<string | null>(null)
  const [middleCode, setMiddleCode] = useState<string | null>(null)
  const selectedRoot = roots.find((root) => root.code === rootCode)
  const selectedMiddle = selectedRoot?.children.find((middle) => middle.code === middleCode)

  const showRoot = (root: CategoryTreeNode) => {
    setRootCode(root.code)
    setMiddleCode(null)
  }

  if (!open) return null

  return <div className="category-mega-menu absolute left-0 top-full z-60 mt-2 flex min-w-[min(780px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
    <aside className="w-46 shrink-0 border-r border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-2 px-2 text-xs font-bold text-slate-400">대분류</p>
      <div className="space-y-0.5">{roots.map((root) => <button key={root.code} type="button" onMouseEnter={() => showRoot(root)} onFocus={() => showRoot(root)} onClick={() => onSelect(root.code)} className={selectedRoot?.code === root.code ? 'block w-full rounded-lg bg-brand-50 px-3 py-2 text-left text-sm font-bold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950/50 dark:text-brand-200 dark:ring-brand-700' : 'category-hover-item block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-700 hover:ring-1 hover:ring-brand-200 dark:text-slate-200 dark:hover:!bg-brand-950/50 dark:hover:text-brand-200 dark:hover:ring-brand-700'}>{root.name}</button>)}</div>
    </aside>

    {selectedRoot ? <section className="flex min-h-80 flex-1 bg-white dark:bg-slate-900">
      <div className="w-52 shrink-0 border-r border-slate-100 p-4 dark:border-slate-700">
        <div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs font-bold text-slate-400">중분류</p><button type="button" onClick={() => onSelect(selectedRoot.code)} className="text-xs font-bold text-brand-600 hover:text-brand-800">전체 보기</button></div>
        <div className="space-y-1">{selectedRoot.children.map((middle) => <button key={middle.code} type="button" onMouseEnter={() => setMiddleCode(middle.code)} onFocus={() => setMiddleCode(middle.code)} onClick={() => onSelect(middle.code)} className={selectedMiddle?.code === middle.code ? 'block w-full rounded-lg bg-brand-50 px-3 py-2 text-left text-sm font-bold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950/50 dark:text-brand-200 dark:ring-brand-700' : 'category-hover-item block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700 hover:ring-1 hover:ring-brand-200 dark:text-slate-200 dark:hover:!bg-brand-950/50 dark:hover:text-brand-200 dark:hover:ring-brand-700'}>{middle.name}</button>)}</div>
      </div>
      <div className="min-w-72 flex-1 bg-slate-50/60 p-4 dark:bg-slate-900">
        {selectedMiddle ? <><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-400">소분류</p><h3 className="mt-1 text-base font-black text-slate-900 dark:text-white">{selectedMiddle.name}</h3></div><button type="button" onClick={() => onSelect(selectedMiddle.code)} className="shrink-0 text-xs font-bold text-brand-600 hover:text-brand-800">전체 보기</button></div>{selectedMiddle.children.length ? <div className="grid grid-cols-2 gap-x-6 gap-y-1">{selectedMiddle.children.map((small) => <button key={small.code} type="button" onClick={() => onSelect(small.code)} className="category-hover-item rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700 hover:ring-1 hover:ring-brand-200 dark:text-slate-200 dark:hover:!bg-brand-950/50 dark:hover:text-brand-200 dark:hover:ring-brand-700">{small.name}</button>)}</div> : <button type="button" onClick={() => onSelect(selectedMiddle.code)} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-brand-50 hover:text-brand-700 hover:ring-1 hover:ring-brand-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:!bg-brand-950/50 dark:hover:text-brand-200 dark:hover:ring-brand-700">{selectedMiddle.name} 상품 보기</button>}</> : null}
      </div>
    </section> : <section className="grid min-h-80 min-w-130 flex-1 place-items-center bg-slate-50/60 p-8 text-sm text-slate-400 dark:bg-slate-900 dark:text-slate-400">대분류에 마우스를 올려 상품 분류를 찾아보세요.</section>}
  </div>
}
