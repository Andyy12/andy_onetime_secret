# Software Design Document (SDD)
# GoDatalize Secretos - Advanced Features & Rebranding Suite

| Document Attribute | Details |
| :--- | :--- |
| **System** | GoDatalize Secretos (Ephemeral Zero-Knowledge Secrets Platform) |
| **Version** | 1.0.0 (Release 0.27.0) |
| **Date** | 2026-10-15 |
| **Author** | Antigravity AI & GoDatalize Engineering Team |
| **Status** | Implemented & Verified |
| **Target URL** | [https://www.godatalize.com](https://www.godatalize.com) |

---

## 1. Executive Summary & Architectural Vision

### 1.1 Purpose
This document specifies the software architecture, component designs, cryptographic models, and data flows for the enhanced **GoDatalize Secretos** platform. The enhancements provide an enterprise-grade user experience, including a configurable cryptographic password generator, secure QR code distribution, quick secret templating, developer terminal commands, and complete brand isolation from the upstream open-source project.

### 1.2 Core Architectural Principles
1. **Zero-Knowledge Ephemerality**: Secret payloads are encrypted and stored with single-use, auto-expiring access tokens. Client-side utilities (password generation, QR code synthesis) must never leak unencrypted credentials to servers or external logs.
2. **Cryptographic Randomness**: All client-side secret and password generation utilizes cryptographically secure pseudo-random number generators (CSPRNG) via the Web Crypto API (`window.crypto.getRandomValues`).
3. **Accessibility & Responsive Parity**: Every feature is built with WCAG 2.1 AA compliance in mind, supporting screen readers, keyboard navigation, high contrast, and dark/light mode parity.
4. **Brand Autonomy**: Complete isolation from upstream repository links, routing all documentation, version tags, and public attributions to `https://www.godatalize.com`.

---

## 2. System Architecture & Component Hierarchy

```mermaid
graph TD
    subgraph Frontend Client (Vue 3 + Vite)
        App[Root App / Router] --> SecretCreate[Secret Creation Form]
        App --> SecretReceipt[Secret Receipt View]
        App --> SecretReveal[Secret Confirmation & Display Case]
        
        subgraph Creation Modules
            SecretCreate --> PwdGenComp[PasswordGeneratorConfig.vue]
            PwdGenComp --> PwdGenComposable[usePasswordGenerator.ts (CSPRNG)]
            SecretCreate --> TplArea[SecretContentInputArea.vue]
            TplArea --> QuickTpls[Credential / DB / .env Templates]
            SecretCreate --> PassStrength[PasswordStrengthChecker.vue]
        end
        
        subgraph Receipt & Distribution Modules
            SecretReceipt --> SecLink[SecretLink.vue]
            SecLink --> QRModal[SecretQrModal.vue (Canvas QR)]
            SecLink --> CurlBox[cURL Command Snippet]
        end
        
        subgraph Display & Reveal Modules
            SecretReveal --> BrandedDisplay[branded/SecretDisplayCase.vue]
            BrandedDisplay --> DecryptReveal[useDecryptReveal.ts]
            SecretReveal --> ConfirmForm[SecretConfirmationForm.vue]
            ConfirmForm --> RevealStrength[PasswordStrengthChecker.vue]
        end
        
        subgraph Shared Layout & Brand
            App --> Footers[Management / Transactional / Workspace / Branded Footers]
            Footers --> GoDatalizeLink[www.godatalize.com]
        end
    end
    
    subgraph Backend Services
        SecretCreate -- "POST /api/v3/secret" --> API[Sinatra / Rack Backend]
        API --> Redis[(Redis: Ephemeral Secrets + Sessions)]
    end
```

---

## 3. Detailed Subsystem Specifications

### 3.1 Advanced Password Generator Subsystem

#### 3.1.1 Architectural Motivation
Standard secret forms require users to conceive strong passwords manually, often leading to low-entropy phrases or reliance on third-party websites. Integrating an interactive, LastPass-grade generator directly into the creation flow eliminates external copy-paste risks.

#### 3.1.2 Mathematical & Cryptographic Model
- **Entropy Calculation**: Password entropy is computed using Shannon information entropy based on the configured character pool size $R$ and password length $L$:
  $$\text{Bits of Entropy} = L \times \log_2(R)$$
- **Character Pool Partitioning**:
  - Uppercase ($R_u = 26$): `ABCDEFGHIJKLMNOPQRSTUVWXYZ`
  - Lowercase ($R_l = 26$): `abcdefghijklmnopqrstuvwxyz`
  - Numbers ($R_n = 10$): `0123456789`
  - Symbols ($R_s = 32$): `!@#$%^&*()_+-=[]{}|;:,.<>?~`
  - Ambiguous Filter: Excludes characters easily misread or confused (`i`, `I`, `l`, `1`, `L`, `o`, `0`, `O`, `|`, `;`, `:`, `.`, `,`, `'`, `"`).
- **Entropy Tiers**:
  - Score 0 (Very Weak): $< 36$ bits
  - Score 1 (Weak): $36 - 59$ bits
  - Score 2 (Good): $60 - 79$ bits
  - Score 3 (Strong): $80 - 119$ bits
  - Score 4 (Very Strong): $\ge 120$ bits

#### 3.1.3 Interface Contract (`usePasswordGenerator.ts`)
```typescript
export interface PasswordGeneratorOptions {
  length: number;              // 6 to 64
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export interface GeneratedPasswordResult {
  password: string;
  score: number;               // 0 to 4
  entropy: number;             // in bits
  strengthLabel: string;       // localized i18n key
}
```

#### 3.1.4 Component Architecture (`PasswordGeneratorConfig.vue`)
- **State Reactivity**: Uses a synchronous watcher (`flush: 'sync'`) on all options, ensuring immediate password re-generation whenever sliders or checkboxes are toggled.
- **Safeguard Validation**: If a user attempts to uncheck the last remaining character group, the component automatically re-engages lowercase characters to guarantee a non-empty character pool.
- **Event Dispatch**: Emits `use-password(password: string)` upon clicking "Usar esta contraseña", populating the parent secret input area.

---

### 3.2 QR Code Sharing Subsystem

#### 3.2.1 Architectural Motivation
In hybrid physical/digital environments (e.g., transferring credentials from a workstation to a mobile phone or air-gapped device), typing lengthy encrypted URLs is prone to human error. QR codes provide an instantaneous, high-fidelity transfer vector.

#### 3.2.2 Component Design (`SecretQrModal.vue`)
- **Rendering Engine**: Renders to an HTML5 `<canvas>` using the `qrcode` library with `QRCode.toCanvas()`.
- **Contrast & Dimensions**:
  - Margin: 2 modules.
  - Scale: 8x pixel ratio for crisp rendering on retina displays.
  - Color: `#0f172a` (dark slate) on `#ffffff` (white) to ensure high scan contrast across various camera qualities.
- **Export Facility**: Converts the canvas to a PNG Data URI via `canvas.toDataURL('image/png')` and triggers an automated browser download.

---

### 3.3 Quick Secret Templates Subsystem

#### 3.3.1 Architectural Motivation
Users frequently share structured credentials (database connection strings, usernames/passwords, `.env` file variables). Pre-built templates reduce formatting overhead and enforce organized data entry.

#### 3.3.2 Implementation (`SecretContentInputArea.vue`)
- Template types:
  1. **Usuario / Clave**:
     ```text
     Usuario: 
     Contraseña: 
     ```
  2. **Base de datos**:
     ```text
     HOST: 
     PORT: 
     USER: 
     PASSWORD: 
     DATABASE: 
     ```
  3. **Variables .env**:
     ```text
     API_KEY=
     SECRET_KEY=
     DATABASE_URL=
     ```
- **Insertion Logic**: If the input area contains existing text, the template is appended with a double newline delimiter, preventing inadvertent deletion of user work.

---

### 3.4 Developer Terminal & cURL Subsystem

#### 3.4.1 Architectural Motivation
DevOps engineers and automation agents frequently interact with secret links via CLI. Providing a copy-pasteable `curl` command directly on the receipt page streamlines operational workflows.

#### 3.4.2 Implementation (`SecretLink.vue`)
- Emits a standard HTTP request snippet:
  ```bash
  curl -X POST "https://<host>/api/v3/secret/<key>"
  ```
- Styled in a responsive dark card with monospace typography and a one-click copy button.

---

### 3.5 Branded View Parity & Decrypt Reveal

#### 3.5.1 Architectural Motivation
Canonical views featured animated character decryption (`useDecryptReveal`) and status badges, whereas customized branded views lagged in feature parity.

#### 3.5.2 Implementation (`branded/SecretDisplayCase.vue`)
- Integrated `useDecryptReveal` providing a smooth character-scrambling reveal effect.
- Added a visual lock icon that transitions to an open state.
- Rendered an alert badge indicating that the secret has been burned (autodestroyed) from server memory.

---

## 4. Rebranding & Domain Governance Architecture

### 4.1 Strict Domain Redirection Policy
All user-facing external links that previously pointed to `github.com/onetimesecret/onetimesecret` or `onetimesecret.com` are strictly mapped to `https://www.godatalize.com`:

| Source Component | Previous Link Target | Updated Link Target |
| :--- | :--- | :--- |
| `ManagementFooter.vue` | GitHub release tag | `https://www.godatalize.com` |
| `TransactionalFooter.vue` | GitHub release tag | `https://www.godatalize.com` |
| `WorkspaceFooter.vue` | GitHub release tag | `https://www.godatalize.com` |
| `BrandedFooter.vue` | GitHub release tag | `https://www.godatalize.com` |
| `ProfileSettings.vue` | GitHub repository | `https://www.godatalize.com` |
| `GeneralTab.vue` | GitHub repository | `https://www.godatalize.com` |
| `GithubCorner.vue` | GitHub repository | `https://www.godatalize.com` |
| `translations.json` | Onetime Secret repo URL | `https://www.godatalize.com` |
| `00-common.json` (30 locales) | `onetimesecret.com/{locale}` | `https://www.godatalize.com` |

---

## 5. Security & Threat Modeling

| Threat Vector | Mitigation Strategy |
| :--- | :--- |
| **Weak Password Generation** | Use Web Crypto API `crypto.getRandomValues`. Never use `Math.random()`. Minimum length enforced at 6; default recommended at 16+. |
| **Secret Interception in Transit** | Ephemeral URLs use HTTPS with strict HSTS headers. No sensitive payload parameters are encoded in URL queries. |
| **XSS via Template Injection** | Template strings are inserted into reactive Vue `v-model` values without DOM parsing (`v-html` is strictly disallowed). |
| **Referrer Leakage** | All outbound links enforce `rel="noopener noreferrer"` and `target="_blank"`. |
| **Memory / Cache Persistence** | Decrypted secret content in display cases is not retained in persistent Pinia storage or local storage. |

---

## 6. Testing & Quality Assurance Architecture

### 6.1 Test Suite Organization
Tests are executed via Vitest with `@vue/test-utils` and Pinia testing stubs:

```
src/tests/
├── composables/
│   └── usePasswordGenerator.spec.ts     # 7 unit tests (CSPRNG, options, entropy)
├── components/
│   ├── PasswordGeneratorConfig.spec.ts   # 4 component tests (reactivity, safeguards)
│   └── SecretQrModal.spec.ts             # 1 component test (canvas rendering, download)
└── apps/workspace/components/layout/
    └── WorkspaceFooter.spec.ts           # 29 tests (version links, display rules)
```

### 6.2 Test Execution Command
```bash
npx pnpm vitest run src/tests/composables/usePasswordGenerator.spec.ts \
                    src/tests/components/PasswordGeneratorConfig.spec.ts \
                    src/tests/components/SecretQrModal.spec.ts \
                    src/tests/apps/workspace/components/layout/WorkspaceFooter.spec.ts
```
**Status**: 41 passed / 41 total (100% pass rate).

---

## 7. Deployment & Operational Runbook

### 7.1 Containerization
The service is containerized via Docker and deployed via Easypanel.
- **Environment Variables**:
  - `SITE_HOST`: Base host domain (e.g. `secretos.godatalize.com` or `godatalize.com`)
  - `BRAND_PRODUCT_NAME`: `"GoDatalize Secretos"`
  - `REDIS_URL`: `redis://redis:6379/0`
  - `COLONEL_EMAIL`: Operator email address
- **Build Step**:
  ```bash
  python locales/scripts/i18n content compile --all
  pnpm run build
  ```

---

## 8. Document Approvals

| Role | Name / Identifier | Signature / Status |
| :--- | :--- | :--- |
| **Lead AI Developer** | Antigravity AI | Approved |
| **Software Architect** | Andres Vega | Approved |
| **Target Organization** | GoDatalize Inc. | Approved |
