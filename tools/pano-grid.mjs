// Genera recortes de una panorámica equirectangular con cuadrícula de grados
// (yaw en el eje X, pitch en el eje Y) para medir umbrales y calibrar hotspots.
//
//   node tools/pano-grid.mjs <pano.png> <salida.jpg> [yaw0 yaw1 pitch0 pitch1] [anchoSalida]
//
// Sin rango: vista completa (-180..180 / 90..-90). Ejemplo para la franja del piso:
//   node tools/pano-grid.mjs "C:/.../Panorama_5.png" strip.jpg -180 0 -5 -60 1800
import sharp from "sharp"

const [src, out, y0 = "-180", y1 = "180", p0 = "90", p1 = "-90", outWidth = "1800"] =
  process.argv.slice(2)

if (!src || !out) {
  console.error("Uso: node tools/pano-grid.mjs <pano> <salida> [yaw0 yaw1 pitch0 pitch1] [ancho]")
  process.exit(1)
}

const yaw0 = Number(y0)
const yaw1 = Number(y1)
const pitch0 = Number(p0)
const pitch1 = Number(p1)
const outW = Number(outWidth)

const meta = await sharp(src).metadata()
const W = meta.width
const H = meta.height
const left = Math.round(((yaw0 + 180) / 360) * W)
const width = Math.round(((yaw1 - yaw0) / 360) * W)
const top = Math.round(((90 - pitch0) / 180) * H)
const height = Math.round(((pitch0 - pitch1) / 180) * H)
const outH = Math.round((height * outW) / width)

const yawStep = yaw1 - yaw0 > 90 ? 10 : 5
const pitchStep = pitch0 - pitch1 > 90 ? 10 : 5

let svg = `<svg width="${outW}" height="${outH}" xmlns="http://www.w3.org/2000/svg">`
for (let yaw = Math.ceil(yaw0 / yawStep) * yawStep; yaw <= yaw1; yaw += yawStep) {
  const x = ((yaw - yaw0) / (yaw1 - yaw0)) * outW
  const major = yaw % 10 === 0
  svg += `<line x1="${x}" y1="0" x2="${x}" y2="${outH}" stroke="${major ? "#00e5ff" : "#ffd400"}" stroke-width="1" opacity="0.7"/>`
  if (major) svg += `<text x="${x + 2}" y="13" font-size="12" fill="#00e5ff">${yaw}</text>`
}
for (let pitch = Math.floor(pitch0 / pitchStep) * pitchStep; pitch >= pitch1; pitch -= pitchStep) {
  const y = ((pitch0 - pitch) / (pitch0 - pitch1)) * outH
  const major = pitch % 10 === 0
  svg += `<line x1="0" y1="${y}" x2="${outW}" y2="${y}" stroke="${major ? "#00e5ff" : "#ffd400"}" stroke-width="1" opacity="0.7"/>`
  svg += `<text x="2" y="${y - 2}" font-size="12" fill="${major ? "#00e5ff" : "#ffd400"}">${pitch}</text>`
}
svg += "</svg>"

await sharp(src)
  .extract({ left, top, width, height })
  .resize(outW, outH)
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 85 })
  .toFile(out)

console.log(`ok ${out} (${outW}x${outH}) yaw ${yaw0}..${yaw1}, pitch ${pitch0}..${pitch1}`)
