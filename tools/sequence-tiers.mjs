// Convierte los frames de la secuencia hero (PNG/WebP de D5 Render) en tiers
// WebP por ancho, renumerados desde 0000, para que el visor cargue solo la
// resolución que necesita cada pantalla.
//
//   node tools/sequence-tiers.mjs <carpetaOrigen> <carpetaSalida> [opciones]
//
//   --widths 1280,1920      anchos de salida (defecto)
//   --quality 78,80         calidad WebP por tier, en el mismo orden (defecto)
//   --crop-left 0.123       fracción del ancho original que se recorta a la
//   --crop-right 0.123      izquierda / derecha ANTES de escalar (defecto 0).
//                           Solo tiene sentido si el visor recorta con
//                           sourceInsetLeft/Right: hornearlo aquí evita guardar
//                           píxeles que nunca se muestran.
//   --prefix frame-         prefijo del nombre de salida (defecto)
//   --saturation -2         corrección de color aplicada a TODOS los frames,
//   --contrast -2           en escala tipo Lightroom/Photoshop (-100..100,
//   --brightness 0          0 = sin cambio). Se hornea antes de escalar.
//   --tint -1               tono como en Fotos de Windows (negativo = verde,
//                           positivo = magenta), misma escala -100..100
//   --sharpen 2             nitidez 0..100 (0 = sin cambio)
//   --preview N             solo escribe el frame N como tools/preview-*.webp
//                           (original vs corregido) para comparar antes de correr todo
//   --limit N               procesar solo los primeros N frames (pruebas)
//   --force                 reencodar aunque el archivo de salida ya exista
//
// Ejemplo (hero actual, frame entero sin recorte):
//   node tools/sequence-tiers.mjs "C:/Users/lenovo/Desktop/Torres360" public/hero
//
// Al terminar imprime el bloque frameTiers para lib/premium-content.ts.
import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

const args = process.argv.slice(2)
const positional = args.filter((arg, index) => !arg.startsWith("--") && !(args[index - 1] ?? "").startsWith("--"))
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? fallback : args[index + 1]
}

const [srcDir, outDir] = positional
if (!srcDir || !outDir) {
  console.error("Uso: node tools/sequence-tiers.mjs <carpetaOrigen> <carpetaSalida> [--widths 1280,1920] [--quality 78,80] [--crop-left f] [--crop-right f]")
  process.exit(1)
}

const widths = option("widths", "1280,1920").split(",").map(Number)
const qualities = option("quality", "78,80").split(",").map(Number)
const cropLeft = Number(option("crop-left", "0"))
const cropRight = Number(option("crop-right", "0"))
const prefix = option("prefix", "frame-")
const limit = Number(option("limit", "0"))
const force = args.includes("--force")
const saturation = Number(option("saturation", "0"))
const contrast = Number(option("contrast", "0"))
const brightness = Number(option("brightness", "0"))
const tint = Number(option("tint", "0"))
const sharpen = Number(option("sharpen", "0"))
const preview = option("preview", null)
const hasColor = saturation !== 0 || contrast !== 0 || brightness !== 0 || tint !== 0 || sharpen !== 0

// Escala -100..100 → factores de sharp. Saturación y brillo van a modulate();
// el contraste es una recta alrededor del gris medio (128): a*x + b.
const applyColor = (pipeline) => {
  if (!hasColor) return pipeline
  let out = pipeline.modulate({
    saturation: 1 + saturation / 100,
    brightness: 1 + brightness / 100,
  })
  if (contrast !== 0) {
    const a = 1 + contrast / 100
    out = out.linear(a, 128 * (1 - a))
  }
  if (tint !== 0) {
    // Tono: eje verde ↔ magenta. Sube el verde y baja rojo/azul (o al revés).
    const g = 1 - tint / 200
    const rb = 1 + tint / 400
    out = out.recomb([
      [rb, 0, 0],
      [0, g, 0],
      [0, 0, rb],
    ])
  }
  if (sharpen > 0) {
    out = out.sharpen({ sigma: 0.8, m1: sharpen / 50, m2: sharpen / 25 })
  }
  return out
}
const CONCURRENCY = 4

// Orden natural por el número del nombre (D5 numera desde el frame de la línea
// de tiempo, p. ej. torres360.0095.png), renumerando desde 0000 en la salida.
const frameNumber = (name) => Number((name.match(/(\d+)(?!.*\d)/) ?? [])[1] ?? -1)
let files = fs
  .readdirSync(srcDir)
  .filter((name) => /\.(png|webp|jpe?g)$/i.test(name))
  .sort((a, b) => frameNumber(a) - frameNumber(b))
if (limit > 0) files = files.slice(0, limit)
if (files.length === 0) {
  console.error(`No hay imágenes en ${srcDir}`)
  process.exit(1)
}

for (const width of widths) fs.mkdirSync(path.join(outDir, String(width)), { recursive: true })

const totals = Object.fromEntries(widths.map((width) => [width, 0]))
const heights = {}
let done = 0
const started = Date.now()

const processFrame = async (name, index) => {
  const padded = String(index).padStart(4, "0")
  const outputs = widths.map((width) => path.join(outDir, String(width), `${prefix}${padded}.webp`))
  if (!force && outputs.every((file) => fs.existsSync(file))) {
    for (const [i, file] of outputs.entries()) {
      totals[widths[i]] += fs.statSync(file).size
      heights[widths[i]] ??= (await sharp(file).metadata()).height
    }
    return
  }

  // Un solo decode del PNG; cada tier es un clone del pipeline. El alfa de D5
  // viene opaco, se aplana para no arrastrar un canal inútil al WebP.
  const source = path.join(srcDir, name)
  const { width: srcWidth, height: srcHeight } = await sharp(source, { limitInputPixels: false }).metadata()
  const left = Math.round(srcWidth * cropLeft)
  const right = Math.round(srcWidth * cropRight)
  const input = applyColor(
    sharp(source, { limitInputPixels: false })
      .flatten({ background: "#ffffff" })
      .extract({ left, top: 0, width: srcWidth - left - right, height: srcHeight })
  )

  await Promise.all(
    widths.map(async (width, i) => {
      const info = await input
        .clone()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: qualities[i] ?? qualities.at(-1), effort: 6, smartSubsample: true })
        .toFile(outputs[i])
      totals[width] += info.size
      heights[width] ??= info.height
    })
  )
}

if (preview !== null) {
  const name = files[Number(preview)] ?? files[0]
  const base = sharp(path.join(srcDir, name), { limitInputPixels: false }).flatten({ background: "#ffffff" }).resize({ width: 1920 })
  await base.clone().webp({ quality: 90 }).toFile("tools/preview-original.webp")
  await applyColor(base.clone()).webp({ quality: 90 }).toFile("tools/preview-corregido.webp")
  console.log(`Preview de ${name}: tools/preview-original.webp vs tools/preview-corregido.webp (sat ${saturation}, con ${contrast}, bri ${brightness}, tint ${tint}, sharp ${sharpen})`)
  process.exit(0)
}

const queue = files.map((name, index) => () => processFrame(name, index))
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      await queue.shift()()
      done += 1
      if (done % 20 === 0 || done === files.length) {
        process.stdout.write(`  ${done}/${files.length} frames (${((Date.now() - started) / 1000).toFixed(0)}s)\n`)
      }
    }
  })
)

console.log(`\n${files.length} frames → ${outDir} (recorte ${cropLeft} / ${cropRight}${hasColor ? `, sat ${saturation} con ${contrast} bri ${brightness} tint ${tint} sharp ${sharpen}` : ""})`)
for (const width of widths) {
  const mb = totals[width] / 1048576
  console.log(`  ${width}px: ${mb.toFixed(1)} MB total, ${(totals[width] / files.length / 1024).toFixed(0)} KB/frame`)
}
console.log("\nframeTiers para lib/premium-content.ts:")
for (const width of widths) {
  console.log(`  { width: ${width}, height: ${heights[width]}, dir: "/${path.basename(outDir)}/${width}" },`)
}
