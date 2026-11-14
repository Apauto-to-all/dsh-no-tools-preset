// 无工具预设 · 预设行守卫。
// 机制（依据 dsh-tools 源码与 web-app 组合注释核实）：本行运行在预设
// scope 里，ctx.tools.restrict({deny}) 落在预设层并沿 scope 链下传，
// 遮蔽全局层注册的全部工具。宿主内置工具行不在本预设内、本就不加载；
// 第三方插件（deck、hindsight、modsearch 等）注册在全局层，正是这里要
// 挡的。本预设除 persona 外不注册任何工具，因此预设下 agent 工具数为 0。
// 晚于本行激活的插件由 tools/change 事件补禁。
export const name = 'no-tools-guard'
export const inject = ['tools']

export function apply(ctx) {
  let dispose
  let denied = new Set()

  const denyAll = () => {
    try {
      // definitions() 不带 scope 参数 = 全局层注册表，恰为 restrict 可点名的集合
      const fresh = ctx.tools.definitions()
        .map(definition => definition.name)
        .filter(name => !denied.has(name))
      if (fresh.length === 0) return
      const next = [...denied, ...fresh]
      denied = new Set(next) // 先推进目标态：restrict 同步触发 tools/change，嵌套调用须看到已完成
      const undo = ctx.tools.restrict({ deny: next })
      dispose?.()
      dispose = undo
      ctx.logger.info(`no-tools-guard: 已屏蔽全局工具 ${next.length} 个`)
    } catch (error) {
      denied = new Set() // 失败回退，下一次 tools/change 全量重试
      ctx.logger.error('no-tools-guard: 屏蔽全局工具失败，将在下次工具变更时重试', error)
    }
  }

  denyAll()
  ctx.on('tools/change', denyAll)
}

export default { name, inject, apply }
