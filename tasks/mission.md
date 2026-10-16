# Estado - GoDatalize "Secretos"

Fork de Onetime Secret con marca GoDatalize. Detalle técnico en `.claude.md`,
historial en `CHANGELOG.md`, diseño en `SDD.md`.

## Hecho (2026-10-15)
- Arreglo de la caída en producción (`@` sin escapar en traducciones) + test de sintaxis i18n.
- Generador: mínimo 6 caracteres, recuerda configuración por navegador.
- Plantillas en menú desplegable (8), sin sobrescribir texto.
- Medidor de fuerza quitado de la pantalla de revelado; textos fijos en español pasados a i18n.
- Footers muestran www.godatalize.com (versión en tooltip).
- Recibo: cuenta regresiva + "Copiar mensaje" (WhatsApp / correo).
- Inicio: recuadro "Envíanos una clave" (`/incoming`) si `INCOMING_ENABLED=true`.
- Formulario: interruptor "Avisarme cuando abran mis secretos" (preferencia de cuenta existente).
- Sentry documentado (`.env.example`).

## Pendiente
- Ejecutar Vitest y los tests Ruby (en este PC no hay `node_modules`, Python ni git en PATH).
- Push desde GitHub Desktop y redeploy en Easypanel.
- En Easypanel: `INCOMING_ENABLED`, `INCOMING_RECIPIENT_1`, SMTP, `DIAGNOSTICS_ENABLED`, `SENTRY_DSN`, `SENTRY_SAMPLE_RATE=1.0`.
- Al activar Sentry, revisar la consola del navegador por bloqueos CSP hacia el dominio de Sentry.

## Descartado
- Adjuntar archivos (decisión del usuario).
