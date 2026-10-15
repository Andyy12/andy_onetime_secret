# Plan de Mejoras - GoDatalize "Secretos"

## Estado Actual
- Fork de Onetime Secret personalizado con identidad de marca GoDatalize.

### Mejoras Completadas:
1. **Generador de Contraseñas Avanzado (Estilo LastPass)**:
   - Composable `usePasswordGenerator.ts`: generación con `crypto.getRandomValues`, cálculo de entropía/fuerza (débil a muy fuerte) y soporte de opciones completas.
   - Componente `PasswordGeneratorConfig.vue`:
     - Visualizador monoespaciado en tiempo real con botón de regenerar / re-roll (con animación de giro).
     - Botón de copiado directo con feedback "¡Copiado!".
     - Barra visual de fuerza de contraseña segmentada con colores temáticos de GoDatalize.
     - Slider de longitud interactivo sincronizado con input numérico (rango 6-64 caracteres).
     - Checklist de caracteres: Mayúsculas (A-Z), Minúsculas (a-z), Números (0-9), Símbolos (!@#$), y opción para evitar caracteres ambiguos/confusos (il1Lo0O).
   - Integrado en `SecretForm.vue` y `WorkspaceSecretForm.vue`.
   - Pruebas unitarias completas en `usePasswordGenerator.spec.ts` y `PasswordGeneratorConfig.spec.ts`.

2. **Código QR para Enlaces de Secretos**:
   - Componente `SecretQrModal.vue`: genera código QR de alta resolución con contraste adaptado para lectura óptima por cámara móvil, con opción de descarga de imagen.
   - Integrado en `SecretLink.vue` con botón de acceso directo junto al botón de copiar.
   - Prueba unitaria en `SecretQrModal.spec.ts`.

3. **Paridad en Vista Branded (`branded/SecretDisplayCase.vue`)**:
   - Integrado `useDecryptReveal` con animación de desencriptado carácter a carácter, badge de candado desbloqueándose y aviso de autodestrucción (burned notice).

4. **Medidor de Fuerza de Frase de Contraseña**:
   - Integrado `PasswordStrengthChecker.vue` tanto en la creación (`SecretForm.vue`) como en la pantalla de revelado (`SecretConfirmationForm.vue`).

5. **Plantillas Rápidas de Secretos**:
   - Agregada barra de chips en `SecretContentInputArea.vue` para insertar rápidamente esqueletos de: "Usuario / Clave", "Base de datos" y "Variables .env".

6. **Fragmento cURL / Terminal**:
   - Agregado acordeón desplegable en `SecretLink.vue` con el comando cURL listo para consultar desde la consola.

7. **Internacionalización y Compilación de Locales**:
   - Nuevas claves añadidas en `locales/content/es/secret-manage.json` y `locales/content/en/secret-manage.json`.
   - Compiladas las 30 variantes lingüísticas con `python locales/scripts/i18n content compile --all`.

8. **Reemplazo de Referencias al Repositorio Original por www.godatalize.com**:
   - Actualizados todos los enlaces del repositorio original y versión en:
     - `ManagementFooter.vue`, `TransactionalFooter.vue`, `WorkspaceFooter.vue`, `BrandedFooter.vue`
     - `ProfileSettings.vue` y `GeneralTab.vue`
     - `GithubCorner.vue` y `translations.json`
   - Actualizada la URL web base `web.COMMON.website_url` en los 30 locales a `https://www.godatalize.com`.
   - Recompilados todos los locales con `python locales/scripts/i18n content hashes --apply` y `python locales/scripts/i18n content compile --all`.

9. **Verificación de Tests**:
   - 41 pruebas unitarias ejecutadas y aprobadas en Vitest (incluyendo tests actualizados de `WorkspaceFooter.spec.ts`).

10. **Documentación Completa**:
    - Creado [.claude.md](file:///c:/Users/Andres%20Vega/OneDrive%20-%20Omnisalud/Documentos/Dev/PERSONAL/ONE_TIME_SECRET/andy_onetime_secret/.claude.md) con guías de arquitectura, invariantes, flujos y comandos para Claude y agentes.
    - Creado [CHANGELOG.md](file:///c:/Users/Andres%20Vega/OneDrive%20-%20Omnisalud/Documentos/Dev/PERSONAL/ONE_TIME_SECRET/andy_onetime_secret/CHANGELOG.md) siguiendo Keep a Changelog v1.1.0 detallando la versión 0.27.0.
    - Creado [SDD.md](file:///c:/Users/Andres%20Vega/OneDrive%20-%20Omnisalud/Documentos/Dev/PERSONAL/ONE_TIME_SECRET/andy_onetime_secret/SDD.md) con especificaciones de diseño de software, modelos matemáticos de entropía, seguridad CSPRNG y diagramas de componentes.

## Siguientes Pasos Opcionales
- Preparar commit limpio y desplegar a Easypanel cuando el usuario lo solicite.
