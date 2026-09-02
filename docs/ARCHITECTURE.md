# Triply Frontend Structure

This repository starts from the approved Figma Make export. The structure is intentionally feature-oriented while preserving the generated UI and behavior.

## Current structure

```text
src/
├── app/
│   └── App.tsx                 # Current application orchestration/prototype state
├── features/
│   ├── auth/
│   │   └── Auth.tsx
│   ├── tours/
│   │   ├── CreateTour.tsx
│   │   ├── InviteAccept.tsx
│   │   ├── InviteMembers.tsx
│   │   ├── MemberSetup.tsx
│   │   └── TourList.tsx
│   └── expenses/
│       ├── AddExpense.tsx
│       └── components/
│           ├── CategorySheet.tsx
│           ├── DateSheet.tsx
│           ├── PaidBySheet.tsx
│           └── SplitBetweenSheet.tsx
├── styles/
│   └── index.css
├── main.tsx
└── vite-env.d.ts
```

## Why this shape

- Organize product code by feature rather than by generic file type.
- Keep feature-specific UI close to the feature that owns it.
- Keep application bootstrapping/orchestration under `app/`.
- Avoid premature `shared/`, `services/`, or state abstractions before real reuse exists.
- Preserve the Figma-generated visual implementation while creating clear extraction boundaries for agents.

## Next structural refactors

Do these incrementally and with zero intentional visual changes:

1. Extract Home, Members, and Settlements from the large `app/App.tsx` into their own feature modules.
2. Move domain types into feature/domain type files once multiple modules need them.
3. Extract the financial calculation engine into pure functions after UI extraction.
4. Add real routing under `app/`.
5. Add `lib/supabase/` only when Supabase integration starts.
6. Add `lib/offline/` only when IndexedDB/sync work starts.
7. Create shared UI folders only for components proven to be reused across features.

Do not perform these as one large refactor.
