import React from 'react'

const MOBILE_QUERY = '(max-width: 768px)'

/** 移动端检测:matchMedia (max-width: 768px),监听 change;matchMedia 不可用或服务端渲染时返回 false */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = React.useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(MOBILE_QUERY).matches
      : false,
  )
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setMobile(mql.matches)
    mql.addEventListener('change', onChange)
    setMobile(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return mobile
}

/** 前端插件配置(mount 侧读取) */
export interface SlotsFrontConfig {
  showCollapsedRail: boolean
}

const DEFAULT_FRONT: SlotsFrontConfig = { showCollapsedRail: true }

/** 读 window.__CLIENT_CONFIG__[id];无 window / id 缺失返回默认 */
export function readClientConfig(id: string): SlotsFrontConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_FRONT }
  const w = window as unknown as { __CLIENT_CONFIG__?: Record<string, SlotsFrontConfig | undefined> }
  const cfg = w.__CLIENT_CONFIG__?.[id]
  return { showCollapsedRail: cfg?.showCollapsedRail ?? true }
}
