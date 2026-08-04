---
name: Refresh (native)
description: Office beverage ordering & queue system, native iOS/Android port — black, white, and zinc only.
colors:
  ink: "#09090b"
  charcoal: "#18181b"
  slate-zinc: "#27272a"
  steel-zinc: "#3f3f46"
  mid-zinc: "#52525b"
  quiet-zinc: "#71717a"
  soft-zinc: "#a1a1aa"
  hairline-zinc: "#d4d4d4"
  divider-zinc: "#e5e5e5"
  surface-zinc: "#f5f5f5"
  paper: "#fafafa"
  white: "#ffffff"
  black: "#000000"
typography:
  headline:
    fontFamily: "Inter"
    fontWeight: "800"
    fontSize: 28
    lineHeight: 34
    letterSpacing: -0.4
  title:
    fontFamily: "Inter"
    fontWeight: "700"
    fontSize: 18
    lineHeight: 24
    letterSpacing: 0
  body:
    fontFamily: "Inter"
    fontWeight: "400"
    fontSize: 14
    lineHeight: 21
    letterSpacing: 0
  label:
    fontFamily: "Inter"
    fontWeight: "700"
    fontSize: 11
    lineHeight: 12
    letterSpacing: 0.9
    textTransform: "uppercase"
radii:
  sm: 6
  md: 8
  lg: 12
  xl: 16
  full: 9999
spacing:
  xs: 4
  sm: 8
  md: 16
  lg: 24
  xl: 32
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    borderRadius: "{radii.md}"
    paddingVertical: 12
    paddingHorizontal: 20
  button-primary-pressed:
    backgroundColor: "{colors.charcoal}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.slate-zinc}"
    borderRadius: "{radii.md}"
    borderColor: "{colors.hairline-zinc}"
  status-badge-neutral:
    backgroundColor: "{colors.surface-zinc}"
    textColor: "{colors.mid-zinc}"
    borderRadius: "{radii.full}"
  status-badge-final:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    borderRadius: "{radii.full}"
---

# Design System: Refresh (native)

## Overview

Same creative north star as `refresh-web`: **"The Service Counter"** — a stamped ticket, a queue board, a chalkboard status list. Nothing decorative between the person and their order. This document ports those tokens and rules to React Native conventions (StyleSheet values, native elevation, native fonts) — it is not a redesign. When in doubt, match `refresh-web/DESIGN.md` and only diverge where a web CSS concept has no native equivalent (documented below).

**Key Characteristics (unchanged from web):**
- Pure black / white / zinc palette — no accent hue anywhere, light or dark mode.
- Status and semantic meaning carried by icon + zinc tonal weight, never by color.
- No emoji, anywhere. Hugeicons line icons are the only iconography.
- Flat-by-default surfaces; elevation reserved for overlays (modals, toasts, action sheets).
- Restrained, administrative type voice: tight tracking on headlines, wide tracking on uppercase labels.

## Colors

Identical ramp to web — see the `colors` frontmatter above for hex values. Define these once as a shared constants module (e.g. `constants/colors.ts`) and reference everywhere; never inline hex strings in components. Support both light and dark mode via `useColorScheme()` — do not hardcode the light-mode ramp for dark surfaces.

### Named Rules
**The No-Hue Rule.** No color with a hue ever ships — not for success, warning, or error. A state stands out through darker fill, a heavier border, or a distinct icon, never through red/amber/green/blue.

**The Weight-Is-Meaning Rule.** Tonal darkness maps to a state's finality: lighter zinc = earlier/pending, Ink/Black = confirmed/final. A Pending badge is barely-there; a Delivered badge is solid Ink.

## Typography

**Font:** Inter — load via `expo-font`/`useFonts` (Inter isn't a system font on either platform; don't fall back to the system sans permanently). Fall back to `System` only while fonts are loading.
**Mono:** Geist Mono, same rule — used for order numbers/timestamps/service-hour ranges so they read as stamped data, not prose.

### Hierarchy
- **Headline** (800, 28/34, -0.4 tracking): screen titles ("Place a Beverage Order").
- **Title** (700, 18/24): card and section headers ("Brewers Board", "Queue Overview").
- **Body** (400, 14/21): form copy, descriptions, order metadata.
- **Label** (700, 11/12, uppercase, +0.9 tracking): status labels, field captions, badge text.

Native note: RN `letterSpacing` is in points, not em — the values above are pre-converted from the web em-based tracking at these font sizes; don't reuse the raw `em` numbers from `refresh-web/DESIGN.md`.

## Layout

No `max-w-7xl` centered-container concept on a phone screen — content fills the safe area (`react-native-safe-area-context`, already a dependency) with 16px horizontal padding, matching web's mobile breakpoint padding rather than its desktop one. Vertical rhythm stays on the same 8px-multiple scale (8/16/24/32). Card interiors use 24px padding (`spacing.lg`); modals/sheets use 32px (`spacing.xl`).

The web's two-column order screen (form + live tracker) collapses to a single scrollable column, in the same top-to-bottom order as the web mobile breakpoint already uses — this is a direct port, not a new layout decision. Web's bottom tab bar (Order / Queue / Dashboard, role-dependent) maps directly to Expo Router's native `Tabs`/NativeTabs.

## Elevation & Depth

Flat by default, same as web. Standing surfaces (cards, screen background) carry no shadow beyond a 1px zinc hairline border (`borderWidth: 1, borderColor: hairline-zinc`) — depth comes from the Paper → White step, not shadow.

Native shadow implementation differs by platform — don't reuse a single `shadow-sm`/`shadow-lg` CSS class mentally:
- **iOS:** `shadowColor: ink, shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: {0,1}` for resting cards; increase opacity/radius/offset for overlays (modals, toasts).
- **Android:** `elevation: 1` resting, `elevation: 8`+ for overlays. Android elevation always renders as a gray/black shadow regardless of `shadowColor` — don't expect the iOS tuning to visually match 1:1, tune each platform independently to the same *feel* (barely-there vs. clearly floating).

### Named Rules
**The Flat-By-Default Rule.** A surface earns elevation only by floating above other content (modal, toast, action sheet). A card in normal scroll flow never exceeds the resting values above.

## Shapes

Consistently rounded, never sharp, never pill-heavy except where a pill is semantically a badge or an avatar. Buttons/inputs: `borderRadius: 12` (`radii.lg`). Cards: `radii.lg`–`radii.xl` (12–16px), largest for sheets/modals. Status badges, the sugar-preference toggle's active state, and avatars: `radii.full`. Borders always 1px, always a zinc hairline — never black, never absent on an interactive control.

## Components

### Buttons
- **Shape:** 12px corners, 1px border on secondary/ghost, none on primary.
- **Primary:** Ink fill, white text, bold — one per screen ("Place Order", "Sign In", "Start Preparing"). Use `Pressable` with a pressed-state style (`charcoal` fill), not `TouchableOpacity`'s default opacity fade — opacity fade reads as "disabled," not "pressed," in a flat monochrome system.
- **Secondary / Ghost:** White fill, zinc border, charcoal text; `surface-zinc` fill on press.

### Status Badges (no hue — carried over exactly from web)
- **Pending:** Surface Zinc bg, Mid Zinc text/border, clock/hourglass Hugeicon.
- **Ready:** Slate Zinc bg, white text, a check/bell Hugeicon.
- **Delivered:** Ink bg, white text, filled check-circle Hugeicon — the one "solid black" badge, signaling finality.
- **Not Found / Error:** White bg, Black text, doubled 2px Ink border (not a color) + alert-triangle Hugeicon.

### Cards / Containers
- Corner: `radii.lg` standard, `radii.xl` for sheets/modals.
- Background: White on Paper screen background (dark mode: invert per the shared color constants, don't hand-pick new dark-mode colors).
- Border: 1px Divider Zinc.
- Padding: 24px standard, 32px sheets/modals.

### Inputs / Fields
- White fill, 1px Hairline Zinc border, `radii.md`.
- Focus (on-device: `onFocus`): border → Ink.
- Disabled: Surface Zinc fill, Quiet Zinc text.
- Prefer native controls over recreated web ones: native `Switch` for toggles, a native date/segmented picker for floor/strength selection where it fits, rather than rebuilding web's custom pill-button groups pixel-for-pixel — see the `expo-native-ui` skill for HIG-correct native control choices. Only recreate the web's custom pill/segmented style where a native control can't express the same choice (e.g. the beverage picker grid).

### Navigation
Native bottom `Tabs` (Order / Queue / Dashboard, role-gated same as web's proxy-level RBAC, enforced client-side via `currentUser.role` since there's no server middleware on native). Active tab: Ink icon + label; inactive: Quiet Zinc. Icons from the native Hugeicons package — never emoji, never `@expo/vector-icons` as a substitute for a missing Hugeicon (source a custom SVG via `react-native-svg` instead if one is truly missing).

### Avatar
Circular, 1px Hairline Zinc border (→ Ink on press, since native has no hover). No-photo fallback: Black fill, white initials — the one place pure Black (not Ink) is used.

## Do's and Don'ts

### Do:
- Convey every status/alert/emphasis through icon + tonal weight — never hue.
- Use the native Hugeicons package exclusively; no emoji anywhere, including toast/notification copy.
- Reserve elevation for content floating above the page (modal, toast, action sheet).
- Keep one Ink-filled primary action per screen.
- Prefer native components (native pickers, `Switch`, action sheets, haptics via `expo-haptics` which is already installed) over rebuilding web's HTML-based controls.

### Don't:
- Don't introduce amber, sky, emerald, red, or any hued color for status/warning/success.
- Don't use emoji as a stand-in for an icon or status indicator.
- Don't hardcode the light-mode color ramp in a component that should respond to `useColorScheme()`.
- Don't add shadow/elevation to a card sitting in normal scroll flow "for polish" — flat is the resting state.
- Don't reimplement server-side business rules (cooldowns, service-hour gating, order-claim concurrency) client-side "to match the UI faster" — call the same Supabase RPCs as web.
