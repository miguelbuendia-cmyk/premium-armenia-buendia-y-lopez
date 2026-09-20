// Verificación del tour 360 con Chrome headless vía CDP (sin dependencias, Node >= 22).
// Ejecuta un escenario JSON de pasos y guarda capturas en %TEMP%/cdp-shots.
//
//   node tools/tour-cdp.mjs escenario.json
//
// Formato del escenario:
// {
//   "width": 1280, "height": 820,
//   "steps": [
//     { "nav": "http://localhost:3000/tour/tipo-6?espacio=bano&yaw=90&pitch=-20" },
//     { "wait": 7000 },
//     { "shot": "bano" },
//     { "eval": "document.querySelectorAll('.pano-tour-hotspot')[0].click(); 'ok'" }
//   ]
// }
// Con width < 900 el visor usa las texturas 4K (ruta móvil).
import { spawn } from "node:child_process"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { setTimeout as sleep } from "node:timers/promises"
import os from "node:os"
import path from "node:path"

const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const PORT = 9333
const OUT_DIR = path.join(os.tmpdir(), "cdp-shots")
mkdirSync(OUT_DIR, { recursive: true })

const scenarioPath = process.argv[2]
if (!scenarioPath) {
  console.error("Uso: node tools/tour-cdp.mjs escenario.json")
  process.exit(1)
}
const scenario = JSON.parse(readFileSync(scenarioPath, "utf8"))

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${path.join(os.tmpdir(), "chrome-cdp-profile")}`,
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--hide-scrollbars",
    `--window-size=${scenario.width ?? 1280},${scenario.height ?? 820}`,
    `--remote-debugging-port=${PORT}`,
    "about:blank",
  ],
  { stdio: "ignore" }
)

async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (res.ok) return
    } catch {}
    await sleep(250)
  }
  throw new Error("Chrome no respondió en el puerto de depuración")
}

let nextId = 1
const pending = new Map()
const consoleErrors = []
let ws

function send(method, params = {}) {
  const id = nextId++
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

async function main() {
  await waitForChrome()
  const target = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })
  ).json()
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve) => (ws.onopen = resolve))
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) {
        reject(new Error(JSON.stringify(msg.error)))
      } else {
        resolve(msg.result)
      }
    } else if (msg.method === "Runtime.exceptionThrown") {
      const details = msg.params.exceptionDetails
      consoleErrors.push(`${details.text} ${details.exception?.description ?? ""}`)
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "))
    }
  }
  await send("Page.enable")
  await send("Runtime.enable")

  for (const step of scenario.steps) {
    if (step.nav) {
      await send("Page.navigate", { url: step.nav })
      console.log("nav", step.nav)
    } else if (step.wait) {
      await sleep(step.wait)
    } else if (step.eval) {
      const result = await send("Runtime.evaluate", {
        expression: step.eval,
        awaitPromise: true,
        returnByValue: true,
      })
      console.log("eval ->", JSON.stringify(result.result.value ?? result.result.description ?? null))
    } else if (step.shot) {
      const { data } = await send("Page.captureScreenshot", { format: "png" })
      const file = path.join(OUT_DIR, `${step.shot}.png`)
      writeFileSync(file, Buffer.from(data, "base64"))
      console.log("shot", file)
    }
  }
  console.log("console errors:", consoleErrors.length ? consoleErrors : "none")
  ws.close()
  chrome.kill()
}

main().catch((error) => {
  console.error(error)
  chrome.kill()
  process.exit(1)
})
