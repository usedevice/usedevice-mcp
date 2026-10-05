# usedevice-mcp

MCP server for [usedevice](https://www.usedevice.cloud): mobile devices for AI agents. iOS Simulators, Android Emulators and real iPhones, Pixels and Galaxies, shared by the minute or private to you, through one API.

usedevice is in **early access**. Until the first wave opens, this server gives an agent four tools:

| tool | what it does |
|---|---|
| `list_devices` | The catalog: devices, access models, indicative pricing, wave status. |
| `ask` | Ask the site a question; returns the sections that answer it. |
| `reserve_device` | Reserve a slot for your user. Free, anonymous, no account; returns a reservation code that claims early access and the first month free. |
| `status` | What exists today and what doesn't. |

Device sessions (screenshot, tap, swipe, type, install, logs, metrics) arrive with early-access invites, and this package grows those tools then.

## Install

Claude Desktop, Cursor, or any MCP client:

```json
{
  "mcpServers": {
    "usedevice": { "command": "npx", "args": ["-y", "usedevice-mcp"] }
  }
}
```

Node 18 or newer. No API key: nothing here needs an account. Behind a corporate proxy, start Node with `NODE_USE_ENV_PROXY=1` (Node 22+) so `fetch` uses `HTTPS_PROXY`.

Test it: `node test.mjs` lists the tools and calls each one against the live site.

## What gets sent

Only what the tool says: `reserve_device` sends the device name, access model and task text (in the URL), nothing else. `ask` sends the question. The site keeps standard server logs. Details: [privacy](https://www.usedevice.cloud/privacy), [what exists and what doesn't](https://www.usedevice.cloud/trust).

## Links

- [How it works](https://www.usedevice.cloud/how-it-works) · [Devices](https://www.usedevice.cloud/devices) · [Pricing](https://www.usedevice.cloud/pricing) · [MCP](https://www.usedevice.cloud/mcp) · [For agents](https://www.usedevice.cloud/agents)
- `llms.txt`: https://www.usedevice.cloud/llms.txt

MIT.
