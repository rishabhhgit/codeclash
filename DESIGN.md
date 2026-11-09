# CodeClash Design System & UI Baseline

This document defines the governing design principles, token standards, interaction contracts, and component constraints for CodeClash Pro. Derived from `ui-skills` and modern design engineering standards (`baseline-ui`).

---

## 1. Principles & Design Philosophy

1. **Information Density with Purpose:**
   - CodeClash is a competitive algorithmic arena. Combatants need instant clarity on problem descriptions, countdown clocks, test case results, and opponent telemetry.
   - Avoid visual slop: no loud rainbow gradients, no distracting heavy box-shadow glows, and no artificial neon borders.
2. **Deterministic Motion & Performance:**
   - Interaction feedback must never exceed `200ms`.
   - Never animate layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`). Animate only GPU compositor properties (`transform`, `opacity`).
   - Honor `prefers-reduced-motion` for all entrance and transition effects.
3. **Typographic Discipline:**
   - **Headings:** MUST use `text-balance` to avoid typographic orphans.
   - **Body & Editorial Copy:** MUST use `text-pretty` for clean line wrapping without hanging words.
   - **Numerical Data & Clocks:** MUST use `tabular-nums font-mono` to prevent horizontal layout shift as timers tick and scores increment.
4. **Cohesive Color Palette & Tokens:**
   - Standard HSL design tokens (`hsl(var(--primary))`, `hsl(var(--card))`, `hsl(var(--muted))`, `hsl(var(--border))`).
   - Limit accent colors to one dominant focal accent per view with semantic status indicators (Emerald for Accepted/Safe, Rose for WA/Stamina Loss, Amber for Warnings/Ready-Check).

---

## 2. Color Palette & Semantic Tokens

| Token | Dark Mode HSL | Role / Usage |
| :--- | :--- | :--- |
| `--background` | `240 10% 3.9%` | Core viewport background (`#09090b`) |
| `--foreground` | `0 0% 98%` | Primary high-contrast text (`#fafafa`) |
| `--card` | `240 10% 6.5%` | Panels, code containers, problem panels |
| `--border` | `240 3.7% 15.9%` | Subtle structural dividing lines |
| `--muted` | `240 3.7% 15.9%` | Tab rail backgrounds, inactive pills |
| `--muted-foreground`| `240 5% 64.9%` | Secondary descriptions, timestamps, subtitles |
| `--primary` | `217.2 91.2% 59.8%` | Primary brand blue/violet interactive affordances |
| `--emerald` (Status) | `160 84% 39%` | Accepted verdict, safe zone, ready confirmed |
| `--rose` (Status) | `0 84% 60%` | Wrong Answer, compile error, damage infliction |
| `--amber` (Status) | `38 92% 50%` | Ready check in-flight, phase countdown warning |

---

## 3. Component & Layout Constraints

1. **Square & Icon Elements:**
   - MUST use `size-*` instead of separate `w-* h-*` utility classes (e.g. `size-3.5`, `size-4`, `size-8`).
2. **Mobile Viewport Bounds:**
   - NEVER use `h-screen` on mobile interfaces; use `h-dvh` to account for dynamic address bars.
3. **Segmented Controls & Tabs:**
   - Pill tabs use `bg-muted/50 p-1 rounded-xl border border-border` with active item `bg-card text-foreground font-bold shadow-sm`.
4. **Button & Interaction States:**
   - Primary interactive triggers use `active:scale-[0.98] transition-transform duration-150` for crisp tactile response.
   - Destructive actions require explicit confirmation dialogs.
5. **Accessibility:**
   - All icon-only buttons must carry an explicit `aria-label`.
   - Focus rings must use `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`.

---

## 4. Problem & Arena Surfaces

1. **Question Directory (`/problems`):**
   - High-density filter bar with instant search, difficulty drop-downs, and category segmented pill controls.
   - Preset tracks: All Solvable Questions (`3,129`), Top 75, Core 150, Mastery 250, Curated Track.
2. **Battle Creation (`/battle/create`):**
   - Direct mode selection (Knockout Arena, 1v1 Blitz Duel, High-Precision Sprint, Best of 3, Speedrun, Topic Draft).
   - Topic selector with multi-select tags and difficulty segment switches.
   - Clear banner when targeting a specific problem challenge with instant dismissal affordance.
3. **Battle Arena (`/battle/[code]`):**
   - Synchronized header clock with monospaced `tabular-nums`.
   - Authoritative live telemetry: stamina meters, test case progress badges, and live code broadcast.
