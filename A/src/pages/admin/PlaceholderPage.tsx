import type { ReactNode } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import { Card } from '../../components/ui/Card'
import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  subtitle?: string
  icon?: ReactNode
}

export function PlaceholderPage({ title, subtitle, icon = <Construction size={28} /> }: PlaceholderPageProps) {
  return (
    <div className="animate-fadeIn">
      <PageHeader title={title} subtitle={subtitle || '이 페이지는 준비 중입니다.'} />
      <Card>
        <EmptyState
          icon={icon}
          title={`${title} 페이지 준비 중`}
          description="Phase 2 이후에 구현됩니다. 기존 기능을 포함한 완전한 UI가 곧 적용됩니다."
        />
      </Card>
    </div>
  )
}
