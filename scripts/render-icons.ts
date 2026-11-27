// Renders the PNG app icons in public/icons/, src/app/apple-icon.png and src/app/favicon.ico from the brand mark. Run
// after changing the logo: pnpm icons:render. The files are committed; this is not part of the build.
import { readFile, writeFile } from 'node:fs/promises'
import { createElement } from 'react'
import { ImageResponse } from 'next/og.js'

// Full-bleed light tile (docs/design/brand/logo/moneyverse-icon-light.svg without the rounded
// corners: the phone applies its own mask). `scale` is the mark's share of the tile; 0.6 keeps
// it inside the maskable safe zone (a centred circle of 80 %).
function iconSvg(scale: number): string {
  const size = 120 * scale
  const offset = (120 - size) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e4ff"/></linearGradient><radialGradient id="hl" cx=".85" cy=".1" r=".7"><stop offset="0" stop-color="#22d3ee" stop-opacity=".10"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient><clipPath id="ta"><circle cx="37" cy="39" r="24"/></clipPath><clipPath id="tb"><circle cx="63" cy="39" r="24"/></clipPath></defs>
<rect width="120" height="120" fill="url(#bg)"/><rect width="120" height="120" fill="url(#hl)"/>
<svg x="${offset}" y="${offset}" width="${size}" height="${size}" viewBox="0 0 100 100">
<circle cx="37" cy="39" r="24" fill="#5b5bf7"/><circle cx="63" cy="39" r="24" fill="#ec4899"/><circle cx="50" cy="62" r="24" fill="#22d3ee"/>
<circle cx="63" cy="39" r="24" fill="#f389fc" clip-path="url(#ta)"/><circle cx="50" cy="62" r="24" fill="#71e3fe" clip-path="url(#ta)"/><circle cx="50" cy="62" r="24" fill="#eedff8" clip-path="url(#tb)"/><g clip-path="url(#ta)"><circle cx="50" cy="62" r="24" fill="#fbf5ff" clip-path="url(#tb)"/></g>
</svg></svg>`
}

const icons = [
  { file: 'icon-192.png', size: 192, scale: 0.66 },
  { file: 'icon-512.png', size: 512, scale: 0.66 },
  { file: 'maskable-512.png', size: 512, scale: 0.6 },
]

async function renderPng(svg: string, size: number): Promise<Buffer> {
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  const image = new ImageResponse(
    createElement('img', { src, width: size, height: size }),
    { width: size, height: size },
  )
  return Buffer.from(await image.arrayBuffer())
}

for (const { file, size, scale } of icons) {
  await writeFile(
    new URL(`../public/icons/${file}`, import.meta.url),
    await renderPng(iconSvg(scale), size),
  )
  console.log(`public/icons/${file}`)
}

// Next links app/apple-icon.png itself; setting metadata.icons would hide the file icons.
await writeFile(
  new URL('../src/app/apple-icon.png', import.meta.url),
  await renderPng(iconSvg(0.66), 180),
)
console.log('src/app/apple-icon.png')

// favicon.ico: the rounded light tile (src/app/icon.svg) at 16, 32 and 48 px, stored as PNGs
// inside the ICO container, which every current browser reads.
const tile = (
  await readFile(new URL('../src/app/icon.svg', import.meta.url), 'utf8')
).replace(/<metadata>[\s\S]*<\/metadata>/, '')
const sizes = [16, 32, 48]
const pngs = await Promise.all(sizes.map((size) => renderPng(tile, size)))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(sizes.length, 4)
let offset = 6 + 16 * sizes.length
const entries = sizes.map((size, i) => {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size, 0) // width
  entry.writeUInt8(size, 1) // height
  entry.writeUInt8(0, 2) // no palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // colour planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(pngs[i].length, 8)
  entry.writeUInt32LE(offset, 12)
  offset += pngs[i].length
  return entry
})
await writeFile(
  new URL('../src/app/favicon.ico', import.meta.url),
  Buffer.concat([header, ...entries, ...pngs]),
)
console.log('src/app/favicon.ico')
