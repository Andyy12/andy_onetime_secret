# Página de servicio caído (GoDatalize)

Reemplaza la página "Service is not reachable" de Easypanel por una página
con la marca GoDatalize y el minijuego "Señal" mientras el servicio vuelve.
La página revisa el servicio cada 15 s y se recarga sola cuando responde.

- `index.html`: página autónoma (logo, fuentes Sora/Inter e íconos van
  incrustados). Tiene que ser así: Traefik la muestra en la URL del sitio
  caído, así que cualquier archivo aparte también fallaría.
- `nginx.conf` + `Dockerfile`: servidor mínimo que entrega `index.html` en
  cualquier ruta.
- `licencias-fuentes/`: licencias SIL OFL de Sora e Inter.

## Instalación en Easypanel

### 1. Crear el servicio

En el proyecto `godatalize`: **+ → App**, nombre `pagina-caida`.

- Source: GitHub → este repositorio, rama `main`.
- Build: **Dockerfile**, con *Build path* / contexto `deploy/pagina-caida`.
- No necesita dominio público ni variables de entorno.
- Deploy.

Anota su **hostname interno** (Easypanel lo muestra en el servicio; suele ser
`godatalize_pagina-caida`).

### 2. Registrar el middleware en Traefik

En el servidor, edita `/etc/easypanel/traefik/config/custom.yaml`
(o en Easypanel: Settings → Traefik → Custom config) y agrega:

```yaml
http:
  middlewares:
    pagina-caida:
      errors:
        # Solo "no se puede llegar al servicio". Los 500 propios de cada
        # aplicación se siguen mostrando como cada una los diseñó.
        status:
          - "502-504"
        service: pagina-caida
        query: "/"
  services:
    pagina-caida:
      loadBalancer:
        servers:
          - url: "http://godatalize_pagina-caida:80"
```

Cambia `godatalize_pagina-caida` si el hostname interno es otro.
Reinicia Traefik (Settings → restart) y revisa sus logs por errores.

### 3. Activarla en cada dominio

En cada servicio que quieras cubrir: **Domains → editar → Middlewares** y
agrega `pagina-caida@file`. Hazlo dominio por dominio (no a nivel global): así
solo afecta a los sitios que elijas.

### 4. Probar

Detén el servicio (Stop) y abre su dominio: debe salir la página de GoDatalize.
Vuelve a iniciarlo: en menos de 15 s la página se recarga sola.

## Cambiar el texto o el juego

Edita `index.html` directamente (el CSS y el JS están dentro), haz push y
redespliega `pagina-caida`. Si cambias el logo o las fuentes, vuelve a
incrustarlos como `data:` URI.
