# Identidad GoDatalize en este fork ("Secretos")

Este fork de Onetime Secret se presenta como **Secretos**, un sistema de
GoDatalize. La fuente de verdad de la marca es el documento
*Identidad de marca para otros sistemas de GoDatalize* (aprobado el
2026-10-07). Esta nota dice **dónde** se aplicó cada parte y qué falta validar.

## Dónde vive cada cosa

| Parte | Archivo |
|---|---|
| Brand pack (logos, favicon, íconos, manifest, `brand.yaml`) | `public/branding/godatalize/` |
| Logos SVG aprobados (13, copia literal del apéndice) | `public/branding/godatalize/brand/` + `favicon.svg` |
| Generador de PNG / `.ico` / social preview | `scripts/branding/godatalize-assets.mjs` |
| Fuentes autoalojadas (Sora 600/700, Inter variable, JetBrains Mono 500; OFL) | `src/assets/fonts/godatalize/` |
| Paleta, fuentes, tokens semánticos, foco, movimiento reducido | `src/assets/style.css` |
| Paleta compilada (no generada) para `#0A7F6C` | `src/shared/composables/useBrandTheme.ts` (`GODATALIZE_PRIMARY`) |
| Tema oscuro por defecto + Claro + Automático | `src/shared/composables/useTheme.ts`, `apps/web/core/templates/{index,admin}.rue` |
| Selector de tema (Ajustes → General) | `src/shared/components/modals/settings/GeneralTab.vue` |
| Encabezado co-marca `[GoDatalize] │ Secretos` | `src/shared/components/layout/MastHead.vue` |
| Pack activado por defecto en la imagen Docker | `Dockerfile` (`ARG BRAND_PACK=godatalize`) |

## Cómo se aplicó la paleta sin tocar cada componente

La UI usa clases de Tailwind (`bg-gray-*`, `bg-brand-*`, `dark:`). En vez de
reescribir cientos de componentes, se **remapearon las escalas** en
`@theme static`:

- `gray-*` → tinta y grises azulados (900 = `#0A0E14` fondo oscuro,
  800 = `#121823` superficie, 700 = `#2A3446` borde, 400 = `#9AA6B8` texto
  secundario, 50 = `#F5F7FA` fondo claro).
- `brand-*` → teal. `brand-600` = `#0A7F6C` (botón principal, 4.9:1 con
  texto blanco) y `brand-400` = `#36D7B7` (enlaces y acentos en oscuro).
- `brandcomp-*` → ámbar. `400` = `#FFB547`, `600` = `#B45309`.
- Los tokens semánticos de la sección 12 (`--color-bg`, `--color-text-muted`,
  `--color-focus`…) también están definidos, con la clase `.dark` en lugar de
  `data-theme`, porque así cambia el tema esta app.

## Para desplegar (Easypanel / Docker)

1. Compilar la imagen normalmente: el `Dockerfile` ya hornea el pack
   `godatalize` (para volver al neutro: `--build-arg BRAND_PACK=default`).
2. Variables de entorno recomendadas:
   - `LOGO_SHOW_NAME=true` → muestra "Secretos" junto al logo (co-marca).
   - `BRAND_PRODUCT_DOMAIN` y `BRAND_SUPPORT_EMAIL` con los valores reales.
   - Opcional: `BRAND_LOGO_URL` con una URL **absoluta** del logo para que
     también aparezca en los correos (los correos no aceptan rutas relativas).

Para regenerar los PNG tras cambiar el símbolo:

```bash
npm --prefix scripts/branding install
node scripts/branding/godatalize-assets.mjs
```

## Pendiente de validar con el fundador (marcado "Propuesta" en la marca)

- Tema claro y opción Automático.
- Co-marca y nombre "Secretos".
- Equivalencias de la escala de grises para estados de UI que el sitio no
  tenía (bordes de campos, hover).

## Limitaciones conocidas

- `icon-maskable-512.png` se genera pero el servidor no lo sirve todavía (no
  está en `BRAND_PACK_URLS`); el manifest usa `icon-512.png` como *maskable*.
- En modo oscuro el botón principal es teal profundo con texto blanco (no el
  teal brillante con texto tinta del sitio), porque los componentes fijan
  `text-white` sobre `bg-brand-600`. Cumple AA. Cambiarlo exige tocar cada botón.
- Los colores de estado de Tailwind (`red-*`, `green-*`, `amber-*`, `blue-*`)
  siguen siendo los de Tailwind; no se remapearon.
- Textos de la interfaz: no se revisaron contra la guía de voz y tono
  (sección 10) más allá de los nuevos.
