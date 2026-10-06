#!/usr/bin/env node
// Genera los íconos de la PWA a partir de un logo (PNG o SVG, mejor cuadrado y de 512 px o más).
//   node icons.mjs <logo> [color-de-fondo] [carpeta-de-salida]
//   ej: node icons.mjs public/logo.png "#0f172a"
// Se corre desde la raíz del proyecto y usa el sharp del proyecto (npm i -D sharp si falta).
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const [logo, fondo = '#ffffff', salida = 'public/icons'] = process.argv.slice(2)
if (!logo) {
  console.error('Uso: node icons.mjs <logo> [color-de-fondo] [carpeta-de-salida]')
  process.exit(1)
}

// Resuelve sharp desde el proyecto donde se corre, no desde la carpeta de la skill.
const requireDelProyecto = createRequire(path.join(process.cwd(), 'package.json'))
let sharp
try {
  sharp = requireDelProyecto('sharp')
} catch {
  console.error('Falta sharp en este proyecto. Instálalo con: npm i -D sharp')
  process.exit(1)
}

const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 }
const leerLogo = () => sharp(logo, path.extname(logo).toLowerCase() === '.svg' ? { density: 300 } : {})

/** El logo centrado en un cuadrado de `lado` px, ocupando `escala` del lado, con o sin fondo. */
async function cuadrado(lado, escala, conFondo) {
  const tam = Math.round(lado * escala)
  const logoChico = await leerLogo().resize(tam, tam, { fit: 'contain', background: TRANSPARENTE }).png().toBuffer()
  return sharp({ create: { width: lado, height: lado, channels: 4, background: conFondo ? fondo : TRANSPARENTE } })
    .composite([{ input: logoChico, gravity: 'center' }])
    .png()
}

/** Silueta blanca del logo (Android la muestra en la barra de estado). Necesita logo con transparencia. */
async function badge(lado) {
  const tam = Math.round(lado * 0.8)
  const alfa = await leerLogo()
    .resize(tam, tam, { fit: 'contain', background: TRANSPARENTE })
    .ensureAlpha()
    .extractChannel('alpha')
    .png()
    .toBuffer()
  const silueta = await sharp({ create: { width: tam, height: tam, channels: 3, background: '#ffffff' } })
    .joinChannel(alfa)
    .png()
    .toBuffer()
  return sharp({ create: { width: lado, height: lado, channels: 4, background: TRANSPARENTE } })
    .composite([{ input: silueta, gravity: 'center' }])
    .png()
}

await mkdir(salida, { recursive: true })
const archivos = [
  ['icon-192.png', () => cuadrado(192, 0.9, true)],
  ['icon-512.png', () => cuadrado(512, 0.9, true)],
  // Android recorta el maskable en círculo, gota o cuadrado: el logo va dentro de la zona segura.
  ['icon-maskable-512.png', () => cuadrado(512, 0.7, true)],
  // iPhone rellena lo transparente con negro: siempre con fondo.
  ['apple-touch-icon.png', () => cuadrado(180, 0.8, true)],
  ['badge-72.png', () => badge(72)],
]
for (const [nombre, crear] of archivos) {
  await (await crear()).toFile(path.join(salida, nombre))
  console.log(`✔ ${path.join(salida, nombre)}`)
}
console.log('Listo. Si el badge salió como un cuadrado blanco, usa un logo PNG con fondo transparente.')
