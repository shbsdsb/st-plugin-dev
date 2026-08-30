// agent_plugin_dev/hot-reload-plugin/src/types.ts
import type { EntryOptions } from '@cordisjs/plugin-loader'

/** bootstrap 提供的 treeBuilder service(结构同 bootstrap/src/index.ts provide) */
export interface TreeBuilderService {
  build(opts: { stHome: string; profile?: string }): Promise<EntryOptions[]>
}
