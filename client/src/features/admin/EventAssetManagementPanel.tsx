import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { EventAsset, EventCampaign } from '@/types/api'

type AssetType = 'THEME' | 'ICON'
type SourceType = 'ADMIN_UPLOAD' | 'AI_GENERATED'
type EditState = { id: number; name: string; sortOrder: string; active: boolean } | null

const errorText = (error: unknown) =>
  error instanceof ApiError && error.status ? `처리하지 못했습니다. (HTTP ${error.status})` : '처리하지 못했습니다.'

const label = (asset: EventAsset) => (asset.assetType === 'THEME' ? '배너 테마' : '배너 아이콘')

export function EventAssetManagementPanel() {
  const [assets, setAssets] = useState<EventAsset[]>([])
  const [campaigns, setCampaigns] = useState<EventCampaign[]>([])
  const [type, setType] = useState<AssetType>('THEME')
  const [sourceType, setSourceType] = useState<SourceType>('ADMIN_UPLOAD')
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [file, setFile] = useState<File | null>(null)
  const [editing, setEditing] = useState<EditState>(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [nextAssets, nextCampaigns] = await Promise.all([adminApi.listEventAssets(), adminApi.listEventCampaigns()])
      setAssets(nextAssets)
      setCampaigns(nextCampaigns)
      setSelectedCampaignId(current => current || (nextCampaigns[0] ? String(nextCampaigns[0].id) : ''))
    } catch (error) {
      setMessage(errorText(error))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const upload = async () => {
    if (!name.trim() || !file) {
      setMessage('자산 이름과 이미지 파일을 입력해 주세요.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const created = await adminApi.uploadEventAsset({
        type,
        name: name.trim(),
        sourceType,
        sortOrder: Math.max(0, Number(sortOrder) || 0),
        file,
      })
      setAssets(current => [...current, created].sort((a, b) => a.assetType.localeCompare(b.assetType) || a.sortOrder - b.sortOrder || a.id - b.id))
      setName('')
      setSortOrder('0')
      setFile(null)
      setMessage('Storage에 저장했고, 행사 적용 목록에 바로 추가했습니다.')
    } catch (error) {
      setMessage(errorText(error))
    } finally {
      setSaving(false)
    }
  }

  const saveAsset = async () => {
    if (!editing || !editing.name.trim()) return
    setSaving(true)
    setMessage('')
    try {
      const updated = await adminApi.updateEventAsset(editing.id, {
        name: editing.name.trim(),
        sortOrder: Math.max(0, Number(editing.sortOrder) || 0),
        active: editing.active,
      })
      setAssets(current => current.map(asset => (asset.id === updated.id ? updated : asset)))
      setEditing(null)
      setMessage('자산 정보를 저장했습니다.')
    } catch (error) {
      setMessage(errorText(error))
    } finally {
      setSaving(false)
    }
  }

  const replaceFile = async (asset: EventAsset, nextFile: File | undefined) => {
    if (!nextFile) return
    setSaving(true)
    setMessage('')
    try {
      const updated = await adminApi.replaceEventAssetFile(asset.id, nextFile)
      setAssets(current => current.map(value => (value.id === updated.id ? updated : value)))
      setMessage('이미지를 교체하고 Storage URL을 갱신했습니다.')
    } catch (error) {
      setMessage(errorText(error))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (asset: EventAsset) => {
    if (!window.confirm(`“${asset.name}” 자산을 삭제할까요? 행사에 적용 중인 자산은 삭제할 수 없습니다.`)) return
    setSaving(true)
    setMessage('')
    try {
      await adminApi.deleteEventAsset(asset.id)
      setAssets(current => current.filter(value => value.id !== asset.id))
      setMessage('Storage와 자산 목록에서 삭제했습니다.')
    } catch (error) {
      setMessage(errorText(error))
    } finally {
      setSaving(false)
    }
  }

  const apply = async (asset: EventAsset) => {
    const campaign = campaigns.find(value => value.id === Number(selectedCampaignId))
    if (!campaign) {
      setMessage('적용할 행사를 선택해 주세요.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const updated = await adminApi.updateEventCampaign(campaign.id, {
        name: campaign.name,
        heroTitle: campaign.heroTitle,
        heroSubtitle: campaign.heroSubtitle,
        badgeText: campaign.badgeText,
        ctaText: campaign.ctaText,
        themeKey: campaign.themeKey,
        iconKey: campaign.iconKey,
        themeAssetId: asset.assetType === 'THEME' ? asset.id : campaign.themeAssetId,
        iconAssetId: asset.assetType === 'ICON' ? asset.id : campaign.iconAssetId,
        heroSort: campaign.heroSort,
        heroEnabled: campaign.heroEnabled,
      })
      setCampaigns(current => current.map(value => (value.id === updated.id ? updated : value)))
      setMessage(`${label(asset)}을 “${updated.name}” 행사에 적용했습니다.`)
    } catch (error) {
      setMessage(errorText(error))
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

  return (
    <section className="mt-6 rounded-3xl border border-violet-200 bg-violet-50/70 p-5 shadow-sm">
      <div>
        <p className="text-xs font-black tracking-wider text-violet-600">EVENT ASSET STUDIO</p>
        <h2 className="mt-1 text-xl font-black text-slate-900">배너 테마·아이콘 자산 편집</h2>
        <p className="mt-1 text-sm text-slate-600">관리자 제작 이미지와 AI 생성 이미지 파일을 업로드하면 Storage에 저장되고, 아래 행사 적용 목록에 즉시 활성화됩니다.</p>
      </div>

      {message ? <p role="status" className="mt-4 rounded-xl bg-white px-3 py-2 text-sm font-bold text-violet-700">{message}</p> : null}

      <div className="mt-5 grid gap-4 rounded-2xl border border-violet-200 bg-white p-4 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">자산 종류
            <select value={type} onChange={event => setType(event.target.value as AssetType)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
              <option value="THEME">배너 테마</option>
              <option value="ICON">배너 아이콘</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">등록 출처
            <select value={sourceType} onChange={event => setSourceType(event.target.value as SourceType)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
              <option value="ADMIN_UPLOAD">관리자 제작</option>
              <option value="AI_GENERATED">AI 생성 이미지</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">자산 이름
            <input value={name} maxLength={100} onChange={event => setName(event.target.value)} placeholder="예: 여름 사무용품 배너" className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" />
          </label>
          <label className="text-sm font-bold text-slate-700">표시 순서
            <input type="number" min="0" value={sortOrder} onChange={event => setSortOrder(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" />
          </label>
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">이미지 파일
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:font-bold file:text-violet-700" />
            <span className="mt-1 block text-xs font-normal text-slate-500">JPG·PNG·WebP, 최대 8MB. 배너는 가로형, 아이콘은 투명 배경 PNG/WebP 권장.</span>
          </label>
        </div>
        <button type="button" disabled={saving} onClick={() => void upload()} className="h-11 self-end rounded-xl bg-violet-600 px-5 text-sm font-black text-white transition hover:bg-violet-700 disabled:opacity-50">Storage 저장·활성화</button>
      </div>

      <div className="mt-5">
        <label className="text-sm font-bold text-slate-700">적용할 행사
          <select value={selectedCampaignId} onChange={event => setSelectedCampaignId(event.target.value)} className="ml-3 h-10 rounded-xl border border-slate-300 bg-white px-3 font-normal">
            {campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
        </label>
        <p className="mt-1 text-xs text-slate-500">자산 카드의 적용 버튼을 누르면 현재 행사 설정은 유지한 채 선택한 테마 또는 아이콘만 바뀝니다.</p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {(['THEME', 'ICON'] as const).map(group => (
          <div key={group} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900">{group === 'THEME' ? '등록 배너 테마' : '등록 배너 아이콘'}</h3>
              <span className="text-xs font-bold text-slate-500">{grouped[group].length}개</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {grouped[group].map(asset => (
                <article key={asset.id} className={'overflow-hidden rounded-xl border ' + (asset.active ? 'border-slate-200' : 'border-slate-200 opacity-60')}>
                  <div
                    className={asset.assetType === 'THEME' ? 'h-28 bg-slate-100' : 'grid h-28 place-items-center bg-slate-100'}
                    style={asset.assetType === 'THEME' ? { backgroundImage: 'url(' + asset.publicUrl + ')', backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
                  >
                    {asset.assetType === 'ICON' ? <img src={asset.publicUrl} alt="" className="h-20 w-20 object-contain" /> : null}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-slate-900">{asset.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{asset.sourceType === 'AI_GENERATED' ? 'AI 생성' : '관리자 제작'} · 순서 {asset.sortOrder}</p>
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
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void replaceFile(asset, event.target.files?.[0])} className="text-xs file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:font-bold" />
                        <div className="flex gap-2">
                          <button type="button" disabled={saving} onClick={() => void saveAsset()} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-black text-white">저장</button>
                          <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600">취소</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" disabled={!asset.active || saving || !selectedCampaignId} onClick={() => void apply(asset)} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-black text-white disabled:opacity-40">행사에 적용</button>
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
        ))}
      </div>
    </section>
  )
}
