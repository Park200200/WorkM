import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { cn } from '../../utils/cn'
import { getItem, setItem } from '../../utils/storage'
import { useThemeStore } from '../../stores/themeStore'
import { ThemePanel } from './SettingsPage'
import { LogOut } from 'lucide-react'

/* ── 타입 ── */
interface UserItem {
  id: number; name: string; color?: string; avatar?: string
  dept?: string; role?: string; pos?: string; email?: string; status?: string
}
interface TaskItem {
  id: number; assigneeIds?: number[]; assigneeId?: number; assignerId?: number; status: string
}

/* ── 알림 항목 ── */
const notifItems = [
  { id: 'n1', label: '신규 업무 지시 알림', desc: '업무를 할당받으면 즉시 알림' },
  { id: 'n2', label: '마감 D-3 사전 알림', desc: '마감 3일 전 자동 알림' },
  { id: 'n3', label: '상태 변경 알림', desc: '담당 업무 상태 변경 시 알림' },
  { id: 'n4', label: '지시 결과 알림', desc: '업무 지시 완료 후 즉시 알림' },
  { id: 'n5', label: '완료 보고 알림', desc: '지시한 업무가 완료되면 알림' },
]


export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notif' | 'theme'>('profile')

  /* 유저 데이터 */
  const users = getItem<UserItem[]>('ws_users', [])
  const currentUser = users[0] || { id: 0, name: '사용자', color: '#4f6ef7', dept: '-', role: '-', email: '-', status: '재직' }

  /* 업무 통계 */
  const tasks = getItem<TaskItem[]>('ws_tasks', [])
  const myTasks = tasks.filter(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
    return ids.includes(currentUser.id)
  })
  const doneCnt = myTasks.filter(t => t.status === 'done').length
  const instrCnt = tasks.filter(t => t.assignerId === currentUser.id).length

  /* 알림 설정 */
  const [notifs, setNotifs] = useState<Record<string, boolean>>(() => {
    const saved = getItem<Record<string, boolean>>('ws_notif_settings', {})
    const defaults: Record<string, boolean> = {}
    notifItems.forEach(n => { defaults[n.id] = saved[n.id] !== undefined ? saved[n.id] : true })
    return defaults
  })
  const toggleNotif = (id: string) => {
    const updated = { ...notifs, [id]: !notifs[id] }
    setNotifs(updated)
    setItem('ws_notif_settings', updated)
  }

  /* 테마 설정 */
  const themeStore = useThemeStore()

  const tabs = [
    { key: 'profile' as const, label: '프로필 설정' },
    { key: 'notif' as const, label: '알림 설정' },
    { key: 'theme' as const, label: 'UI 테마' },
  ]

  return (
    <div className="animate-fadeIn">
      <PageHeader title="개인설정" subtitle="프로필 및 알림을 설정합니다" />

      <div className="grid md:grid-cols-[320px_1fr] gap-4">
        {/* ── 좌측: 프로필 카드 ── */}
        <Card className="p-6 text-center">
          <div className="mx-auto mb-4">
            <Avatar name={currentUser.name} color={currentUser.color} size="lg" />
          </div>
          <div className="text-lg font-extrabold text-[var(--text-primary)] mb-1">{currentUser.name}</div>
          <div className="text-[12px] text-[var(--text-secondary)] mb-0.5">
            {currentUser.dept} · {currentUser.role}{currentUser.pos ? ` | ${currentUser.pos}` : ''}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mb-5">{currentUser.email}</div>

          {/* 통계 */}
          <div className="flex justify-center gap-0 mb-5">
            <div className="text-center px-5 border-r border-[var(--border-default)]">
              <div className="text-xl font-extrabold text-primary-500">{myTasks.length}</div>
              <div className="text-[10px] text-[var(--text-muted)]">담당 업무</div>
            </div>
            <div className="text-center px-5 border-r border-[var(--border-default)]">
              <div className="text-xl font-extrabold text-green-500">{doneCnt}</div>
              <div className="text-[10px] text-[var(--text-muted)]">완료</div>
            </div>
            <div className="text-center px-5">
              <div className="text-xl font-extrabold text-primary-500">{instrCnt}</div>
              <div className="text-[10px] text-[var(--text-muted)]">지시</div>
            </div>
          </div>

          <Button className="w-full" icon={<LogOut size={15} />}>로그아웃</Button>
        </Card>

        {/* ── 우측: 탭 콘텐츠 ── */}
        <Card className="p-0 overflow-hidden">
          {/* 탭 바 */}
          <div className={cn(
            'flex',
            (themeStore.tabStyle || 'underline') === 'underline' && 'border-b border-[var(--border-default)]',
            (themeStore.tabStyle || 'underline') !== 'underline' && 'gap-1 p-2',
          )}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.key
              const ts = themeStore.tabStyle || 'underline'
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold transition-all cursor-pointer',
                    ts === 'underline' && [
                      isActive
                        ? 'text-[var(--tab-active-color)] border-b-2 border-[var(--tab-active-color)]'
                        : 'text-[var(--text-muted)]',
                    ],
                    ts === 'box' && [
                      'rounded-[var(--radius-md)]',
                      isActive
                        ? 'text-[var(--tab-active-color)] bg-[var(--tab-active-bg)] border border-[var(--tab-active-color)]/20'
                        : 'text-[var(--text-muted)]',
                    ],
                    ts === 'pill' && [
                      'rounded-[var(--radius-md)]',
                      isActive
                        ? 'bg-[var(--btn-save-bg)] text-white'
                        : 'text-[var(--text-muted)]',
                    ],
                  )}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--color-primary-500)'
                      if (ts !== 'underline') e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary-500) 8%, transparent)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = ''; e.currentTarget.style.background = ''
                  }}
                >{tab.label}</button>
              )
            })}
          </div>

          <div className="p-5">
            {/* ═════ 프로필 설정 ═════ */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="이름" value={currentUser.name} />
                  <FieldRow label="부서" value={currentUser.dept || '-'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="직급" value={currentUser.role || '-'} />
                  <FieldRow label="직책" value={currentUser.pos || '-'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="이메일" value={currentUser.email || '-'} />
                  <FieldRow label="상태" value={currentUser.status || '재직'} />
                </div>
                <Button>저장</Button>
              </div>
            )}

            {/* ═════ 알림 설정 ═════ */}
            {activeTab === 'notif' && (
              <div className="space-y-0">
                {notifItems.map(n => (
                  <div key={n.id} className="flex items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0">
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--text-primary)]">{n.label}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{n.desc}</div>
                    </div>
                    <button
                      onClick={() => toggleNotif(n.id)}
                      className={cn(
                        'relative w-[42px] h-[24px] rounded-full transition-colors cursor-pointer shrink-0',
                        notifs[n.id] ? 'bg-primary-500' : 'bg-[var(--bg-subtle)]',
                      )}
                    >
                      <span className={cn(
                        'absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full transition-all shadow-sm',
                        notifs[n.id] ? 'left-[20px]' : 'left-[2px]',
                      )} />
                    </button>
                  </div>
                ))}
                <Button className="mt-4">설정 저장</Button>
              </div>
            )}

            {/* ═════ UI 테마 ═════ */}
            {activeTab === 'theme' && (
              <ThemePanel />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* 읽기 전용 필드 */
function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">{label}</label>
      <input
        value={value}
        readOnly
        className="w-full px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] text-[13px] text-[var(--text-primary)] outline-none"
      />
    </div>
  )
}
