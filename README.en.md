# DSH No-Tools Preset

[简体中文](README.md) · **English**

A "give it nothing" agent preset for DeepSeek Harness: every tool is denied — no code execution, no file access, no web — leaving only the model's own reasoning. Useful when you want the model to think a problem through purely, and as a bare-baseline for model comparison.

## What it does

- **Zero tools.** The preset row calls `ctx.tools.restrict({deny})` in the preset scope, shadowing every tool registered at the global layer (third-party plugin tools included); host built-in tool rows are not part of this preset in the first place
- **Late arrivals too.** A `tools/change` listener denies tools registered by plugins that activate after the preset
- **Persona only.** The preset registers no tools of its own apart from persona, so the agent's tool count under it is 0

## Install

```bash
dsh plugin --profile web add dsh-no-tools-preset
```

On the Desktop build, search `dsh-no-tools-preset` in the Plugins page. After installing, pick the no-tools preset from the model/preset menu.

## Known limitations

- No tools means the model cannot verify any fact — answers come entirely from training memory. Good for reasoning and writing; not for anything needing current information
- This preset denies **tools**; the model still converses and reasons normally

## License

MIT, see [LICENSE](LICENSE).
