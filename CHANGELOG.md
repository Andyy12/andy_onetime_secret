# Changelog - GoDatalize Secretos

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.27.0] - 2026-10-15

### Added
- **Interactive LastPass-Style Password Generator**:
  - `src/shared/composables/usePasswordGenerator.ts`: Cryptographically secure random password generation powered by `crypto.getRandomValues`.
  - Entropy calculator calculating Shannon bits and categorizing strength into 5 granular tiers (Very Weak, Weak, Good, Strong, Very Strong).
  - `src/shared/components/forms/PasswordGeneratorConfig.vue`: Interactive generator UI with:
    - Real-time monospace preview bar with animated rotate/re-roll button.
    - One-click clipboard copy button with visual "¡Copiado!" feedback.
    - Segmented, theme-aware visual strength meter.
    - Synchronized length slider and numeric input (range: 6 to 64 characters).
    - Granular character checklist: Uppercase (`A-Z`), Lowercase (`a-z`), Numbers (`0-9`), Special Symbols (`!@#$%^&*...`), and Ambiguous characters exclusion (`il1Lo0O|;:` etc.).
    - Automatic validation preventing deselecting all character categories.
    - Primary "Usar esta contraseña" insertion action.
  - Integration into both canonical (`SecretForm.vue`) and workspace (`WorkspaceSecretForm.vue`) secret forms.

- **QR Code Sharing Modal**:
  - `src/shared/components/ui/SecretQrModal.vue`: High-contrast QR code rendering modal using the `qrcode` library.
  - Automatically sizes and centers the QR code with instant download option as high-resolution PNG for air-gapped or mobile sharing.
  - Trigger button placed in `SecretLink.vue` alongside the standard link copy button.

- **Quick Secret Templates**:
  - `src/apps/secret/components/form/SecretContentInputArea.vue`: Quick template chips allowing one-click structure insertion:
    - **Usuario / Clave**: Pre-populates username and password fields.
    - **Base de datos**: Pre-populates connection parameters (`HOST`, `PORT`, `USER`, `PASSWORD`, `DATABASE`).
    - **Variables .env**: Pre-populates environment variable skeletons (`API_KEY`, `SECRET_KEY`, `DATABASE_URL`).
  - Non-destructive insertion that preserves existing text if already typed.

- **Developer Terminal / cURL Command Snippet**:
  - `src/apps/secret/components/receipt/SecretLink.vue`: Added an interactive accordion card displaying the formatted `curl` command to retrieve metadata or burn secrets directly from the terminal.
  - One-click copy for command execution.

- **Passphrase Strength Validation on Secret Reveal**:
  - `src/apps/secret/components/canonical/SecretConfirmationForm.vue`: Added the real-time `PasswordStrengthChecker` component to inform users about the robustness of their entered passphrase before decrypting secrets.

- **Branded Secret View Parity**:
  - `src/apps/secret/components/branded/SecretDisplayCase.vue`: Integrated the `useDecryptReveal` composable for character-by-character decryption animation.
  - Added visual lock/unlock badge indicators and prominent "Secret burned / destroyed" alerts matching the canonical display case UX.

### Changed
- **GoDatalize Branding & Repository Links**:
  - Removed all hardcoded external links leading to the original upstream repository (`github.com/onetimesecret/onetimesecret`).
  - Redirected all footer version tags, release notes links, translation project links, and navigation corners to `https://www.godatalize.com`:
    - `ManagementFooter.vue`
    - `TransactionalFooter.vue`
    - `WorkspaceFooter.vue`
    - `BrandedFooter.vue`
    - `ProfileSettings.vue`
    - `GeneralTab.vue`
    - `GithubCorner.vue`
    - `translations.json`
  - Updated `web.COMMON.website_url` across all 30 language bundles in `locales/content/*/00-common.json` to `https://www.godatalize.com`.

- **Internationalization (i18n)**:
  - Added new localized strings in English and Spanish for all generator controls, templates, and QR modals.
  - Recompiled 30 locale target packages using the automated python CLI pipeline (`locales/scripts/i18n content compile --all`) with synchronized cryptographic content hashes.

### Tested
- Created 12 new comprehensive unit test cases in Vitest:
  - `src/tests/composables/usePasswordGenerator.spec.ts`: Tests CSPRNG generation, character set adherence, ambiguous filter behavior, and entropy tiers.
  - `src/tests/components/PasswordGeneratorConfig.spec.ts`: Tests slider/input synchronization, character toggle safeguards, re-roll reactivity, and emit payloads.
  - `src/tests/components/SecretQrModal.spec.ts`: Tests QR canvas rendering, visibility toggling, and download callbacks.
- Updated `src/tests/apps/workspace/components/layout/WorkspaceFooter.spec.ts` to assert against `godatalize.com` version links (all 29 tests passing).
- Verified full test suite execution with 41 passing tests.
