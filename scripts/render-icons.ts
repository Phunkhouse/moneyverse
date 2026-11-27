// Renders the PNG app icons in public/icons/ from the brand mark. Run after changing the logo:
// pnpm icons:render. The PNGs are committed; this is not part of the build.
import { writeFile } from 'node:fs/promises'
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
  { file: 'apple-touch-icon.png', size: 180, scale: 0.66 },
]

for (const { file, size, scale } of icons) {
  const src = `data:image/svg+xml;base64,${Buffer.from(iconSvg(scale)).toString('base64')}`
  const image = new ImageResponse(
    createElement('img', { src, width: size, height: size }),
    { width: size, height: size },
  )
  await writeFile(
    new URL(`../public/icons/${file}`, import.meta.url),
    Buffer.from(await image.arrayBuffer()),
  )
  console.log(`public/icons/${file}`)
}
