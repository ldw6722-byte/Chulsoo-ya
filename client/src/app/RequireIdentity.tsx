import type { ReactNode } from 'react'
import { useIdentity } from './useIdentity'
import { EmptyView } from '@/components/StateViews'
import type { UserRole } from '@/types/api'

const ROLE_LABEL: Record<UserRole, string> = {
  CONSUMER: '소비자',
  SELLER: '판매자',
  ADMIN: '관리자',
}

/** 지정 역할이 아니면 화면을 렌더링하지 않는다. */
export function RequireIdentity({
  roles,
  children,
}: {
  roles: UserRole[]
  children: ReactNode
}) {
  const { identity } = useIdentity()

  if (!identity) {
    return (
      <div className="page">
        <EmptyView
          title="계정을 선택해 주세요"
          description="상단의 개발 계정 전환 바에서 사용할 계정을 선택하면 화면이 표시됩니다."
        />
      </div>
    )
  }

  if (!roles.includes(identity.role)) {
    return (
      <div className="page">
        <EmptyView
          title="접근 권한이 없습니다"
          description={`이 화면은 ${roles.map((r) => ROLE_LABEL[r]).join(' 또는 ')} 계정으로만 이용할 수 있습니다.`}
        />
      </div>
    )
  }

  return <>{children}</>
}
