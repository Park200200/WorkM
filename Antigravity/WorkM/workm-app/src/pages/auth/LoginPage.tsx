import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { useThemeStore } from '../../stores/themeStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Moon, Sun } from 'lucide-react'
import { getItem } from '../../utils/storage'

export function LoginPage() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const addToast = useToastStore((s) => s.add)
  const { theme, toggle: toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!userId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }

    // 기존 WorkM 유저 데이터에서 검색 (ws_users)
    const users = getItem<Array<Record<string, unknown>>>('ws_users', [])
    const found = users.find(
      (u) => (u.loginId === userId || u.email === userId) && u.pw === password,
    )

    if (found) {
      login({
        id: String(found.id),
        name: String(found.name || ''),
        email: String(found.email || ''),
        dept: String(found.dept || ''),
        rank: String(found.rank || ''),
        position: String(found.position || ''),
        phone: String(found.phone || ''),
        avatar: String(found.avatar || ''),
        color: String(found.color || '#4f6ef7'),
        status: '근무',
        role: found.role === 'admin' ? 'admin' : 'user',
      })
      addToast('success', `${found.name}님, 환영합니다! 👋`)
      navigate('/')
    } else {
      // 데모용: 아무 계정으로 로그인 허용
      login({
        id: '1',
        name: userId || '관리자',
        email: `${userId}@workm.kr`,
        dept: '경영지원팀',
        rank: '대리',
        color: '#4f6ef7',
        status: '근무',
        role: 'admin',
      })
      addToast('info', '데모 모드로 로그인되었습니다.')
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-4 relative">
      {/* 테마 토글 */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-sm transition-colors cursor-pointer"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* 배경 그라데이션 오브 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* 로그인 카드 */}
      <div className="relative w-full max-w-sm animate-slideUp">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white font-black text-2xl shadow-xl mb-4">
            W
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">WorkM</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">업무관리 시스템에 로그인하세요</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-lg space-y-4"
        >
          <Input
            label="아이디"
            placeholder="아이디를 입력하세요"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            error={error && !userId ? '필수 항목입니다' : undefined}
            autoFocus
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error && !password ? '필수 항목입니다' : undefined}
          />

          {error && userId && password && (
            <p className="text-xs text-danger font-medium text-center">{error}</p>
          )}

          <Button type="submit" className="w-full mt-2" size="lg">
            로그인
          </Button>
        </form>

        {/* 개발용 샘플 로그인 */}
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-[var(--border-default)]" />
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Dev Quick Login</span>
            <div className="flex-1 h-px bg-[var(--border-default)]" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(() => {
              const emojis = ['👔','🧑‍💼','👨‍💻','📊','📋','🤝','💡','⚙️','🎯','📌']
              const users = getItem<{ id: number; name: string; dept?: string; rank?: string; role?: string; color?: string }[]>('ws_users', [])
              return users.map((u, i) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  login({
                    id: String(u.id),
                    name: u.name,
                    email: `${u.name}@workm.kr`,
                    dept: u.dept,
                    rank: u.rank,
                    color: u.color,
                    status: '근무',
                    role: u.rank === '대표' || u.rank === '팀장' ? 'admin' : 'user',
                  })
                  addToast('success', `${u.name}님으로 로그인! 👋`)
                  navigate('/')
                }}
                className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{emojis[i % emojis.length]}</span>
                <span className="text-[11px] font-extrabold text-[var(--text-primary)]">{u.name}</span>
                <span className="text-[9px] text-[var(--text-muted)]">{u.rank || u.role || '-'}</span>
              </button>
              ))
            })()}
          </div>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] text-center mt-6">
          © 2026 WorkM. All rights reserved.
        </p>
      </div>
    </div>
  )
}
