import { useCallback, useEffect, useMemo, useState } from 'react'
import { notify } from '@/lib/notify'
import { adminApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { EventAsset } from '@/types/api'

type AssetType = 'THEME' | 'ICON'

type EditState = { id: number; name: string; sortOrder: string; active: boolean } | null

const errorText = (error: unknown) =>
  error instanceof ApiError && error.status ? `처리하지 못했습니다. (HTTP ${error.status})` : '처리하지 못했습니다.'

export function EventAssetManagementPanel() {
  const [assets, setAssets] = useState<EventAsset[]>([])
  const [type, setType] = useState<AssetType>('THEME')
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [file, setFile] = useState<File | null>(null)
  const [editing, setEditing] = useState<EditState>(null)
  const [selectedThemeAssetId, setSelectedThemeAssetId] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const nextAssets = await adminApi.listEventAssets()
      setAssets(nextAssets)
      setSelectedThemeAssetId(current => (
        nextAssets.some(asset => asset.assetType === 'THEME' && String(asset.id) === current)
          ? current
          : String(nextAssets.find(asset => asset.assetType === 'THEME')?.id ?? '')
      ))
    } catch (error) {
      notify(errorText(error), 'error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const upload = async () => {
    if (!name.trim() || !file) {
      notify('자산 이름과 이미지 파일을 입력해 주세요.', 'error')
      return
    }
    setSaving(true)

    try {
      const created = await adminApi.uploadEventAsset({
        type,
        name: name.trim(),
        sourceType: 'ADMIN_UPLOAD',
        sortOrder: Math.max(0, Number(sortOrder) || 0),
        file,
      })
      setAssets(current => [...current, created].sort((a, b) => a.assetType.localeCompare(b.assetType) || a.sortOrder - b.sortOrder || a.id - b.id))
      if (created.assetType === 'THEME') setSelectedThemeAssetId(String(created.id))
      window.dispatchEvent(new Event('chulsooya:event-assets-updated'))
      setName('')
      setSortOrder('0')
      setFile(null)
      notify('이미지를 Storage에 저장하고 자산 목록에 추가했습니다.')
    } catch (error) {
      notify(errorText(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveAsset = async () => {
    if (!editing || !editing.name.trim()) {
      notify('자산 이름을 입력해 주세요.', 'error')
      return
    }
    setSaving(true)

    try {
      const updated = await adminApi.updateEventAsset(editing.id, {
        name: editing.name.trim(),
        sortOrder: Math.max(0, Number(editing.sortOrder) || 0),
        active: editing.active,
      })
      setAssets(current => current.map(asset => (asset.id === updated.id ? updated : asset)))
      window.dispatchEvent(new Event('chulsooya:event-assets-updated'))
      setEditing(null)
      notify('자산 정보를 저장했습니다.')
    } catch (error) {
      notify(errorText(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const replaceFile = async (asset: EventAsset, nextFile: File | undefined) => {
    if (!nextFile) return
    setSaving(true)

    try {
      const updated = await adminApi.replaceEventAssetFile(asset.id, nextFile)
      setAssets(current => current.map(value => (value.id === updated.id ? updated : value)))
      window.dispatchEvent(new Event('chulsooya:event-assets-updated'))
      notify('이미지를 교체했습니다.')
    } catch (error) {
      notify(errorText(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (asset: EventAsset) => {
    if (!window.confirm(`“${asset.name}” 자산을 삭제할까요? 행사에 적용 중인 자산은 삭제할 수 없습니다.`)) return
    setSaving(true)

    try {
      await adminApi.deleteEventAsset(asset.id)
      setAssets(current => current.filter(value => value.id !== asset.id))
      setSelectedThemeAssetId(current => current === String(asset.id) ? '' : current)
      window.dispatchEvent(new Event('chulsooya:event-assets-updated'))
      notify('자산을 삭제했습니다.')
    } catch (error) {
      notify(errorText(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const grouped = useMemo(
    () => ({
      THEME: assets.filter(asset => asset.assetType === 'THEME'),
      ICON: assets.filter(asset => asset.assetType === 'ICON'),
    }),
    [assets],
  )
  const selectedThemeAsset = grouped.THEME.find(asset => asset.id === Number(selectedThemeAssetId))

  return (
    <section className="event-asset-studio mt-6 rounded-3xl border border-violet-200 bg-violet-50/70 p-5 shadow-sm">
      <div>
        <p className="text-xs font-black tracking-wider text-violet-600">EVENT ASSET STUDIO</p>
        <h2 className="mt-1 text-xl font-black text-slate-900">배너 테마·아이콘 자산 관리</h2>
        <p className="mt-1 text-sm text-slate-600">이미지는 Storage에 저장해 자산 목록으로 관리합니다. 새 행사 등록·수정에서는 이 목록의 테마와 아이콘을 직접 선택합니다.</p>
      </div>

      <details className="event-asset-section mt-5 overflow-hidden rounded-2xl border border-violet-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition hover:bg-brand-50">
          <span className="font-black text-slate-900">새 이미지 등록</span>
          <span className="text-xs font-bold text-violet-700">접기 / 펼치기</span>
        </summary>
        <div className="border-t border-slate-200 p-4">
          <div className="event-asset-upload grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">자산 종류
                <select value={type} onChange={event => setType(event.target.value as AssetType)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                  <option value="THEME">배너 테마</option>
                  <option value="ICON">배너 아이콘</option>
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700">자산 이름
                <input value={name} maxLength={100} onChange={event => setName(event.target.value)} placeholder="예: 여름 사무용품 배너" className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" />
              </label>
              <label className="text-sm font-bold text-slate-700">자산 목록 순서
                <input type="number" min="0" value={sortOrder} onChange={event => setSortOrder(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" />
                <span className="mt-1 block text-xs font-normal text-slate-500">낮은 숫자부터 자산 목록에 표시됩니다.</span>
              </label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">이미지 파일
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:font-bold file:text-violet-700" />
                <span className="mt-1 block text-xs font-normal text-slate-500">{type === 'THEME' ? '배너 테마 권장 원본: 1,920 × 640px (3:1), 최소 1,440 × 480px · JPG·PNG·WebP · 최대 8MB. 제목 영역을 고려해 핵심 이미지는 오른쪽 여백에 배치해 주세요.' : '배너 아이콘 권장 원본: 512 × 512px (1:1), 최소 256 × 256px · 투명 배경 PNG·WebP 권장 · 최대 8MB.'}</span>
              </label>
            </div>
            <button type="button" disabled={saving} onClick={() => void upload()} className="h-11 self-end rounded-xl bg-violet-600 px-5 text-sm font-black text-white transition hover:bg-violet-700 disabled:opacity-50">Storage 저장·활성화</button>
          </div>
        </div>
      </details>

      {(['THEME', 'ICON'] as const).map(group => (
        <details key={group} className="event-asset-section mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition hover:bg-brand-50">
            <span className="font-black text-slate-900">{group === 'THEME' ? '등록 배너 테마' : '등록 배너 아이콘'} <span className="ml-1 text-sm text-slate-500">{grouped[group].length}개</span></span>
            <span className="text-xs font-bold text-violet-700">접기 / 펼치기</span>
          </summary>
          <div className="border-t border-slate-200 p-4">
            {group === 'THEME' ? (
              <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50/70 p-3">
                <label className="text-sm font-bold text-slate-700">등록 배너 테마 관리
                  <div className="mt-1 flex gap-2">
                    <select value={selectedThemeAssetId} onChange={event => setSelectedThemeAssetId(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 font-normal">
                      <option value="">삭제할 테마 선택</option>
                      {grouped.THEME.map(asset => <option key={asset.id} value={asset.id}>{asset.name}{asset.active ? '' : ' (비활성)'}</option>)}
                    </select>
                    <button type="button" disabled={!selectedThemeAsset || saving} onClick={() => selectedThemeAsset && void remove(selectedThemeAsset)} className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-600 transition hover:border-rose-300 hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">테마 삭제</button>
                  </div>
                  <span className="mt-1 block text-xs font-normal text-slate-500">삭제하면 Storage와 새 행사 등록의 업로드 배너 테마 목록에서 함께 제거됩니다.</span>
                </label>
              </div>
            ) : null}

            <div className="event-asset-library grid gap-3 sm:grid-cols-2">
              {grouped[group].map(asset => (
                <article key={asset.id} className={'event-asset-card overflow-hidden rounded-xl border ' + (asset.active ? 'border-slate-200' : 'border-slate-200 opacity-60')}>
                  <div
                    className={asset.assetType === 'THEME' ? 'event-asset-preview h-28 bg-slate-100' : 'event-asset-preview grid h-28 place-items-center bg-slate-100'}
                    style={asset.assetType === 'THEME' ? { backgroundImage: `url(${asset.publicUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
                  >
                    {asset.assetType === 'ICON' ? <img src={asset.publicUrl} alt="" className="h-20 w-20 object-contain" /> : null}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-slate-900">{asset.name}</p>
                        <p className="mt-1 text-xs text-slate-500">자산 순서 {asset.sortOrder}</p>
                      </div>
                      <span className={asset.active ? 'rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700' : 'rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500'}>{asset.active ? '활성' : '비활성'}</span>
                    </div>
                    {editing?.id === asset.id ? (
                      <div className="mt-3 grid gap-2">
                        <input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} className="h-9 rounded-lg border border-slate-300 px-2 text-sm" />
                        <div className="flex gap-2">
                          <input type="number" min="0" value={editing.sortOrder} onChange={event => setEditing({ ...editing, sortOrder: event.target.value })} className="h-9 w-20 rounded-lg border border-slate-300 px-2 text-sm" />
                          <label className="inline-flex items-center gap-1 text-xs font-bold text-slate-600"><input type="checkbox" checked={editing.active} onChange={event => setEditing({ ...editing, active: event.target.checked })} />활성</label>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-violet-200 bg-violet-50 px-3 text-xs font-black text-violet-700 transition hover:border-violet-300 hover:bg-violet-600 hover:text-white">
                            이미지 교체
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void replaceFile(asset, event.target.files?.[0])} className="sr-only" />
                          </label>
                          <span className="text-xs text-slate-500">파일 선택 뒤 Storage 이미지가 바로 교체됩니다.</span>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" disabled={saving} onClick={() => void saveAsset()} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-black text-white">저장</button>
                          <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600">취소</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setEditing({ id: asset.id, name: asset.name, sortOrder: String(asset.sortOrder), active: asset.active })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">편집</button>
                        <button type="button" disabled={saving} onClick={() => void remove(asset)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">삭제</button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {grouped[group].length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">등록된 {group === 'THEME' ? '배너 테마' : '아이콘'}이 없습니다.</p> : null}
            </div>
          </div>
        </details>
      ))}
    </section>
  )
}
