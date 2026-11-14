// 无工具预设 · 宿主行守卫（保险层，与预设行守卫互补）。
// 在 profile 根监听 agent/created、agent/disposed、tools/change：凡是组合
// 在 no-tools 预设下的 agent，按 dsh-tools 报错信息点名的官方位点
// agent.ctx.tools.restrict({deny}) 逐个遮蔽全部全局工具。预设行守卫生效
// 时这里是同一 deny 的交集，幂等无害；预设行守卫失效时由这里兜底。
// agent 换出预设或销毁时自动撤销，不影响其他预设的 agent。
export const name = 'no-tools-host-guard'
export const inject = ['tools', 'agents', 'agentPresets']

export function apply(ctx) {
  // agent.id -> { sig: 本次 deny 集合签名, undo: 撤销句柄 }
  const held = new Map()

  const sweep = () => {
    const names = ctx.tools.definitions().map(definition => definition.name)
    const sig = names.slice().sort().join('\u0000')
    const live = new Set()
    for (const agent of ctx.agents.list()) {
      live.add(agent.id)
      const on = ctx.agentPresets.composedPreset(agent.ctx) === 'no-tools'
      if (!on) {
        const previous = held.get(agent.id)
        if (previous) { previous.undo(); held.delete(agent.id) }
        continue
      }
      const current = held.get(agent.id)
      if (current && current.sig === sig) continue
      if (current) current.undo()
      // 占位：restrict 同步触发 tools/change，嵌套 sweep 须看到目标态，否则递归
      held.set(agent.id, { sig, undo: () => {} })
      try {
        const undo = agent.ctx.tools.restrict({ deny: names })
        held.set(agent.id, { sig, undo })
        ctx.logger.info(`no-tools-host-guard: agent 已屏蔽全局工具 ${names.length} 个`)
      } catch (error) {
        held.delete(agent.id)
        ctx.logger.error(`no-tools-host-guard: agent ${agent.id} 屏蔽失败`, error)
      }
    }
    for (const [id, entry] of [...held]) {
      if (!live.has(id)) { entry.undo(); held.delete(id) }
    }
  }

  const safe = () => {
    try { sweep() } catch (error) { ctx.logger.error('no-tools-host-guard: sweep 失败', error) }
  }
  ctx.on('agent/created', safe)
  ctx.on('agent/disposed', safe)
  ctx.on('tools/change', safe)
  safe()
}

export default { name, inject, apply }
