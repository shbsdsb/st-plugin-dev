// agent_plugin_dev/st-ui-slots/src/client-config.ts
// 前端插件配置(mount 侧读取);不含移动端逻辑。

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
