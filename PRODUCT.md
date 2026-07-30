# Product

## Platform

iOS + Android (Expo/React Native). Native companion to `refresh-web`, same backend, same users — not a separate product.

## Users

Employees, brewers, and admins within a single company/office deployment (not multi-tenant SaaS) — identical roles to web.

- **Employee** — places drink orders (coffee, chai, green tea, black coffee, or any admin-added beverage) for their floor during service hours.
- **Brewer** — fulfills the incoming order queue.
- **Admin** — manages floors, staff, service hours, beverage catalog, and settings.

## Product Purpose

Give employees, brewers, and admins the same order → queue → fulfillment workflow as `refresh-web`, but as a native app: faster to open, native sign-in, and (eventually) push notifications for order events — things a browser tab can't do well.

## Positioning

Not a redesign and not a reduced "mobile-lite" version — full feature parity with the web app, native-first interactions (system share sheets, native pickers, haptics) instead of web-adapted ones.

## Operating Context

Same as web, ported as-is:
- Orders are placed per floor, during configured service hours (default 09:00–18:00, overridable via named service-hour windows, each with its own days-of-week).
- Beverage catalog is admin-managed (enable/disable, custom icon per drink) — not a hardcoded list.
- Orders carry a sugar level, a strength (Mild/Normal/Strong), an optional note, a status, and optional post-fulfillment feedback (1–5 rating + comments).
- A configurable cooldown limits how soon an employee can place another order.
- Single internal deployment — no multi-company/tenant concerns.

## Capabilities and Constraints

- Expo Router, React Native, TypeScript; same Supabase project as web (Postgres + Realtime + Auth) — no separate backend, no data migration.
- All business logic that lives server-side on web (order placement rules, cooldowns, service-hour enforcement, optimistic-concurrency status updates) stays server-side — the native app calls the same RPCs (`place_order`, `claim_profile`), it does not reimplement the rules client-side.
- Auth differs from web by necessity: native Google Sign-In (`@react-native-google-signin/google-signin` + `signInWithIdToken`) instead of the web's browser-redirect OAuth, for a proper native account-picker experience. See `../AGENTS.md` for why.
- Phase 1 notifications are in-app only (realtime-driven banners/toasts, matching web's "new order received" behavior). Push notifications (`expo-notifications`) are a deferred, not-yet-scoped phase 2 — do not build against them until specifically prioritized.

## Brand Commitments

Inherited from web, unchanged:
- Name is **Refresh** (not "BrewDesk").
- Strict black / zinc / white palette only, light and dark mode — no accent colors.
- No emoji anywhere in the UI.
- Icon library: **Hugeicons** as the primary/only icon set (native package, not the web `hugeicons-react` package — confirm the correct RN package at install time).
- Design should read as minimalist but creative — not generic or templated, and should feel *native*, not like a web page in a WebView.

## Evidence on Hand

No customer evidence, testimonials, or usage data on hand. Do not fabricate any.

## Product Principles

1. Parity first: every action available on web (place/cancel/edit an order, claim/advance/mark-not-found a queue item, manage floors/staff/hours/catalog) must exist natively before adding anything mobile-exclusive.
2. Business rules live in Postgres, not in the app — the native client is a thin, native-feeling shell over the same RPCs and tables as web.
3. Native means native: system components (native pickers, native share, haptics, native auth) over web-style recreations of them.
4. Visual restraint is a brand commitment, not just a current preference: black/zinc/white, no emoji, Hugeicons only — carried over unchanged from web.

## Accessibility & Inclusion

No product-specific accessibility requirement established yet — inherit whatever baseline is set for web until stated otherwise.
