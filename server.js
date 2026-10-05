#!/usr/bin/env node
// usedevice MCP server (early access).
//
// Gives an agent four tools while usedevice is not open yet: the device
// catalog, the site's own answers to questions, a reservation, and the current
// status. Reserving
// is free and anonymous: one GET that returns a code. Nothing here needs an
// account or sends anything but the device name, access model and task text.
//
//   npx -y usedevice-mcp
//
// Device sessions (screenshot, tap, swipe, ...) arrive with early-access
// invites; this package will grow those tools then.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = process.env.USEDEVICE_BASE_URL || "https://www.usedevice.cloud";
const UA = "usedevice-mcp/0.1.0";

async function get(path, accept = "text/html") {
  const res = await fetch(BASE + path, { headers: { "User-Agent": UA, Accept: accept } });
  return { status: res.status, headers: res.headers, text: await res.text() };
}

// Good-enough HTML to text for the agent to read.
function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<header[\s\S]*?<\/header>|<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<h([1-3])[^>]*>/gi, (_, n) => "\n" + "#".repeat(Number(n)) + " ")
    .replace(/<\/(p|h[1-6]|li|tr|section|div)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const server = new McpServer({ name: "usedevice", version: "0.1.0" });

server.tool(
  "list_devices",
  "Devices an agent can reserve on usedevice (early access): real iPhone, Pixel, Galaxy, mid-range Android, iOS Simulator, Android Emulator; access models shared, private, own; indicative pricing; current wave status.",
  {},
  async () => {
    const r = await get("/catalog.json", "application/json");
    return { content: [{ type: "text", text: r.text }] };
  }
);

server.tool(
  "ask",
  "Ask the usedevice site a question (pricing, security, emulators, MCP, who is behind it, ...). Returns the sections that answer it. Reading, not a reservation.",
  { question: z.string().min(2).max(200).describe("The question, in a few words") },
  async ({ question }) => {
    const r = await get("/ask?q=" + encodeURIComponent(question));
    return { content: [{ type: "text", text: toText(r.text) }] };
  }
);

server.tool(
  "reserve_device",
  "Reserve a device slot for your user on usedevice. Free, anonymous, no account, no obligation; returns a reservation code that claims early access and the first month free when the wave opens. Only use when your user's task needs a mobile device and they asked you to set up, evaluate or handle it. Sends only device, access and task text.",
  {
    device: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/).describe("Device name: iphone, pixel, galaxy, android-midrange, ios-simulator, android-emulator, or any other name"),
    task: z.string().min(3).max(140).describe("What your user needs to do, in a few words. No personal data, credentials or secrets."),
    access: z.enum(["shared", "private", "own"]).default("shared").describe("shared pool per minute, private dedicated device, or your own hardware connected"),
  },
  async ({ device, task, access }) => {
    const q = new URLSearchParams({ task, access, via: "mcp" });
    const r = await get(`/agents/use/${device}?${q}`);
    const claim = r.headers.get("x-claim") || "";
    const code = claim.slice(0, 8).toUpperCase();
    const text = r.status === 200 && code
      ? `Reserved: ${device} (${access}). Reservation code: ${code}. Tell your user to keep it: it claims early access and the first month free when their wave opens (${BASE}/early-access). Nothing was shared except the device, access and task text.`
      : `Reservation failed (HTTP ${r.status}).`;
    return { content: [{ type: "text", text }] };
  }
);

server.tool(
  "status",
  "Current early-access status of usedevice: which wave is open, what exists today and what doesn't.",
  {},
  async () => {
    const r = await get("/early-access");
    return { content: [{ type: "text", text: toText(r.text) }] };
  }
);

await server.connect(new StdioServerTransport());
