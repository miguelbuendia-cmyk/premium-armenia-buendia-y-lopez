// Dibuja sobre un frame del hero qué parte se verá en cada tipo de pantalla con
// el ajuste "cover" del visor, para validar el encuadre de un render ANTES de
// renderizar los 190 frames (mandar primero el 0095 y pasarlo por aquí).
//
//   node tools/hero-safe-area.mjs <frame.png> [salida.png]
//
// Regla práctica: torres + podio dentro del rectángulo rojo (navegador
// maximizado) con aire de sobra; en celular vertical solo se ve la franja
// central (azul), así que el edificio debe estar centrado.
import sharp from "sharp"

const [src, out = "hero-safe-area.png"] = process.argv.slice(2)
if (!src) {
  console.error("Uso: node tools/hero-safe-area.mjs <frame.png> [salida.png]")
  process.exit(1)
}

const VIEWPORTS = [
  { name: "Escritorio 16:9 (pantalla completa)", aspect: 16 / 9, color: "#2ecc40" },
  { name: "Navegador maximizado ~2.08:1 (Edge/Chrome con pestañas y barra)", aspect: 2.08, color: "#ff2a2a" },
  { name: "Ultrawide 21:9", aspect: 2.37, color: "#ffb400" },
  { name: "Celular vertical 9:19.5", aspect: 9 / 19.5, color: "#2a8cff" },
]

const meta = await sharp(src).metadata()
const { width: W, height: H } = meta
const frameAspect = W / H
const OUT_W = 1280
const scale = OUT_W / W
const OUT_H = Math.round(H * scale)

const rects = VIEWPORTS.map((v) => {
  // cover: el frame se escala hasta llenar el viewport; sobra en un eje.
  let x = 0, y = 0, w = W, h = H
  if (v.aspect > frameAspect) {
    h = W / v.aspect
    y = (H - h) / 2
  } else {
    w = H * v.aspect
    x = (W - w) / 2
  }
  const cropX = ((W - w) / W) * 100
  const cropY = ((H - h) / H) * 100
  return { ...v, x, y, w, h, cropX, cropY }
})

console.log(`${src}: ${W}x${H} (${frameAspect.toFixed(3)}:1)`)
for (const r of rects) {
  const what = r.cropY > 0.05 ? `recorta ${r.cropY.toFixed(1)}% del alto (${(r.cropY / 2).toFixed(1)}% arriba y abajo)` : r.cropX > 0.05 ? `recorta ${r.cropX.toFixed(1)}% del ancho (${(r.cropX / 2).toFixed(1)}% por lado)` : "sin recorte"
  console.log(`  ${r.name}: ${what}`)
}

const svgRects = rects
  .map((r) => `<rect x="${r.x * scale}" y="${r.y * scale}" width="${r.w * scale}" height="${r.h * scale}" fill="none" stroke="${r.color}" stroke-width="4"/>`)
  .join("")
const LEGEND_H = 26 * rects.length + 12
const legend = rects
  .map((r, i) => `<rect x="10" y="${OUT_H + 10 + i * 26}" width="18" height="18" fill="${r.color}"/><text x="36" y="${OUT_H + 24 + i * 26}" font-family="Arial" font-size="16" fill="#fff">${r.name}${r.cropY > 0.05 ? ` — recorta ${(r.cropY / 2).toFixed(1)}% arriba y abajo` : r.cropX > 0.05 ? ` — solo se ve el ${(100 - r.cropX).toFixed(0)}% central del ancho` : " — frame completo"}</text>`)
  .join("")
const overlay = Buffer.from(`<svg width="${OUT_W}" height="${OUT_H + LEGEND_H}"><rect x="0" y="${OUT_H}" width="${OUT_W}" height="${LEGEND_H}" fill="#111"/>${svgRects}${legend}</svg>`)

await sharp({ create: { width: OUT_W, height: OUT_H + LEGEND_H, channels: 3, background: "#111" } })
  .composite([{ input: await sharp(src).flatten().resize(OUT_W, OUT_H).png().toBuffer(), left: 0, top: 0 }, { input: overlay, left: 0, top: 0 }])
  .png()
  .toFile(out)
console.log(`→ ${out}`)
