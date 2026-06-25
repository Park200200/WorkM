import React, { useState, useMemo, useEffect } from 'react'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import { useToastStore } from '../../../stores/toastStore'
import type { BudgetCat, PayMethodItem } from './types'
import { Landmark, Coins, FileText, Ticket, Plus, Trash2, Search, ChevronDown } from 'lucide-react'


export default function AcctIncomeMethods({ catId }: { catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [newName, setNewName] = useState('')
  const [activeCategory, setActiveCategory] = useState<'계좌' | '현금' | '어음' | '상품권'>('계좌')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const addToast = useToastStore(s => s.add)
  const staffList = useMemo(() => getItem<any[]>('ws_users', []), [])

  const currentYear = new Date().getFullYear()
  const activeYear = parseInt(new URLSearchParams(window.location.hash.split('?')[1] || '').get('year') || '') || parseInt(localStorage.getItem('acct_active_year') || '') || currentYear

  const budgetCats = useMemo(() => {
    const all = getItem<BudgetCat[]>('acct_budget_cats', [])
    return all.filter(c => {
      const cy = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0, 4)) : currentYear)
      return cy === activeYear
    })
  }, [refresh, activeYear])

  const selectedCatId = catId || (budgetCats.length > 0 ? String(budgetCats[0].id) : '')
  const selectedCatName = budgetCats.find(c => String(c.id) === selectedCatId)?.name || ''

  void refresh
  const allItems: PayMethodItem[] = useMemo(() => {
    try {
      const raw = localStorage.getItem('acct_income_methods')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  }, [refresh])

  const filteredItems = selectedCatId
    ? allItems.filter(i => String(i.budgetCatId) === selectedCatId)
    : allItems
  const catItems = filteredItems.filter(i => i.category === activeCategory)
  const activeCatInfo = INCOME_CATEGORIES.find(c => c.key === activeCategory)!

  const defaultManager = useMemo(() => {
    const cat = budgetCats.find(c => String(c.id) === selectedCatId)
    if (cat?.users && cat.users.length > 0) return cat.users[0]
    return ''
  }, [budgetCats, selectedCatId])

  const saveAll = (updated: PayMethodItem[]) => {
    setItem('acct_income_methods', updated)
    setRefresh(r => r + 1)
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    const isDuplicate = allItems.some(i =>
      i.name === newName.trim() &&
      i.category === activeCategory &&
      String(i.budgetCatId) === selectedCatId
    )
    if (isDuplicate) {
      addToast('error', '이 예산구분에 이미 존재하는 입금계정입니다')
      return
    }
    const newItem: PayMethodItem = {
      id: Date.now(),
      name: newName.trim(),
      category: activeCategory,
      budgetCatId: selectedCatId || undefined,
      manager: activeCategory === '계좌' ? defaultManager : undefined,
      custodian: activeCategory === '현금' ? defaultManager : undefined,
      noteManager: activeCategory === '어음' ? defaultManager : undefined,
      voucherManager: activeCategory === '상품권' ? defaultManager : undefined,
    }
    saveAll([...allItems, newItem])
    addToast('success', `"${newName.trim()}" 추가됨`)
    setNewName('')
    setExpandedId(newItem.id)
  }

  const handleDelete = (id: number) => {
    const item = allItems.find(i => i.id === id)
    if (!item) return
    if (!confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) return
    saveAll(allItems.filter(i => i.id !== id))
    addToast('warning', `"${item.name}" 삭제됨`)
    if (expandedId === id) setExpandedId(null)
  }

  const updateField = (id: number, field: keyof PayMethodItem, value: string) => {
    saveAll(allItems.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            🏦 입금계정 관리
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">상단에서 예산구분을 선택하여 입금계정을 관리합니다</p>
        </div>
        <span className="text-xs font-bold text-white bg-emerald-500 px-3 py-1.5 rounded-full">
          {selectedCatName || '전체'} {filteredItems.length}건
        </span>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2">
        {INCOME_CATEGORIES.map(cat => {
          const count = filteredItems.filter(i => i.category === cat.key).length
          const isActive = activeCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setExpandedId(null) }}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer ${
                isActive
                  ? `${cat.bg} ${cat.border} shadow-sm`
                  : 'bg-[var(--bg-surface)] border-transparent hover:border-[var(--border-default)]'
              }`}
            >
              <div className="flex flex-col items-center">
                <cat.Icon size={18} style={{ color: isActive ? cat.color : undefined }} />
                <div className={`text-[12px] font-extrabold mt-1 ${isActive ? '' : 'text-[var(--text-secondary)]'}`} style={isActive ? { color: cat.color } : undefined}>
                  {cat.label}
                </div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{count}건</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 선택된 카테고리 영역 */}
      <div className={`rounded-2xl border-2 ${activeCatInfo.border} ${activeCatInfo.bg} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <activeCatInfo.Icon size={20} style={{ color: activeCatInfo.color }} />
            <div>
              <h3 className="text-sm font-extrabold" style={{ color: activeCatInfo.color }}>{activeCatInfo.label}</h3>
              <p className="text-[10px] text-[var(--text-muted)]">{activeCatInfo.desc}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>
            {catItems.length}건
          </span>
        </div>

        {/* 추가 폼 */}
        <div className="flex gap-2 mb-4">
          <input
            placeholder={`새 ${activeCatInfo.label} 입금계정 입력...`}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-white dark:bg-gray-900 text-sm text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)]"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all cursor-pointer hover:shadow-md flex items-center gap-1.5"
            style={{ background: activeCatInfo.color }}
          >
            <Plus size={14} /> 추가
          </button>
        </div>

        {/* 항목 리스트 */}
        {catItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)] rounded-xl border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/50">
            등록된 {activeCatInfo.label} 입금계정이 없습니다
          </div>
        ) : (
          <div className="space-y-1.5">
            {catItems.map((item, idx) => {
              const isOpen = expandedId === item.id
              return (
                <div key={item.id} className={`rounded-xl transition-all border ${isOpen ? 'border-[var(--border-default)] bg-white dark:bg-gray-900/60 shadow-sm' : 'border-transparent bg-white/70 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-800/50 hover:border-[var(--border-default)]'}`}>
                  <div
                    className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer group"
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                  >
                    <span className="text-[10px] font-bold w-5 text-center shrink-0 rounded-full py-0.5" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>
                      {idx + 1}
                    </span>
                    <input value={item.name} onChange={e => { e.stopPropagation(); updateField(item.id, 'name', e.target.value) }} onClick={e => e.stopPropagation()} placeholder="이름 입력" className="text-sm font-semibold text-[var(--text-primary)] flex-1 bg-transparent border-none outline-none focus:bg-[var(--bg-muted)] focus:px-2 focus:rounded-md transition-all" />
                    {activeCategory === '현금' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 whitespace-nowrap">1-01-01 현금</span>
                    )}
                    {activeCategory === '상품권' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-900/20 text-pink-600 whitespace-nowrap">1-01-08 상품권</span>
                    )}
                    {activeCategory === '계좌' && item.bankName && !isOpen && (
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">
                        {item.bankName} {item.accountNumber ? `• ${item.accountNumber}` : ''}
                      </span>
                    )}
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* 상세 필드 (계좌) */}
                  {isOpen && activeCategory === '계좌' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>은행명 *</label>
                          <input value={item.bankName || ''} onChange={e => updateField(item.id, 'bankName', e.target.value)} placeholder="국민은행" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>계좌번호 *</label>
                          <input value={item.accountNumber || ''} onChange={e => updateField(item.id, 'accountNumber', e.target.value)} placeholder="110-234-567890" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>예금주 *</label>
                          <input value={item.accountHolder || ''} onChange={e => updateField(item.id, 'accountHolder', e.target.value)} placeholder="(주)문화재청" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>계좌관리자 *</label>
                          <select value={item.manager || ''} onChange={e => updateField(item.id, 'manager', e.target.value)} className={DETAIL_INPUT}>
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>용도</label>
                          <input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="보조금 수입, 사업비 등" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 상세 필드 (현금) */}
                  {isOpen && activeCategory === '현금' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보관처 *</label>
                          <input value={item.storageLocation || ''} onChange={e => updateField(item.id, 'storageLocation' as any, e.target.value)} placeholder="사무실 금고 등" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보관책임자 *</label>
                          <select value={item.custodian || ''} onChange={e => updateField(item.id, 'custodian' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>용도</label>
                          <input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="현금 수납 등" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 상세 필드 (어음) */}
                  {isOpen && activeCategory === '어음' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>구분 *</label>
                          <select value={item.noteType || ''} onChange={e => updateField(item.id, 'noteType' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">선택하세요</option>
                            <option value="수신">수신 (받을어음)</option>
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                          <select value={item.noteManager || ''} onChange={e => updateField(item.id, 'noteManager' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 상세 필드 (상품권) */}
                  {isOpen && activeCategory === '상품권' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>금액 *</label>
                          <input
                            value={item.voucherAmount ? item.voucherAmount.toLocaleString() : ''}
                            onChange={e => {
                              const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                              saveAll(allItems.map(i => i.id === item.id ? { ...i, voucherAmount: num } : i))
                            }}
                            placeholder="50,000"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                          <select value={item.voucherManager || ''} onChange={e => updateField(item.id, 'voucherManager' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
