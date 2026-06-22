# Design Document — EcoSnap AI

## Overview

EcoSnap AI is a Next.js web application that enables users to report environmental pollution by uploading a photo along with a location and description. The system classifies the pollution, assigns an urgency level, generates recommended actions, persists the report to Supabase, and displays the results immediately.

The MVP is built in four phases to keep scope manageable and allow incremental delivery for the hackathon:

| Phase | Focus |
|-------|-------|
| 1 | Project setup, landing page, report form UI, dashboard UI (no backend) |
| 2 | Supabase database schema, report persistence, Supabase Storage file upload |
| 3 | Mock classifier, urgency scorer, action recommender |
| 4 | UI polish, UX improvements, demo readiness, hackathon README |

### Design Goals

- **Beginner-friendly**: flat folder structure, minimal abstractions, clear comments
- **Incrementally upgradeable**: mock classifier is a drop-in replacement for a real AI API
- **Simple data flow**: form → API route → classifier + scorer + recommender → Supabase → results page
- **No custom auth**: anonymous submissions for the MVP

---

## Architecture

The app follows the standard Next.js App Router architecture. All server-side logic lives in a single API route handler. The client renders pages, collects form input, and calls that API route.

```
┌─────────────────────────────────────────────────────┐
│                     Browser (Client)                │
│                                                     │
│  / (landing)   /report (form)   /dashboard          │
│        │               │               │            │
│        └───────────────┴───────────────┘            │
│                        │                            │
│              POST /api/reports                      │
└────────────────────────┬────────────────────────────┘
                         │  (multipart/form-data)
                         ▼
┌─────────────────────────────────────────────────────┐
│                 Next.js API Route                   │
│          app/api/reports/route.ts                   │
│                                                     │
│   1. Parse & validate request                       │
│   2. Upload photo → Supabase Storage                │
│   3. Classify  (Classifier)                         │
│   4. Score     (Scorer)                             │
│   5. Recommend (Recommender)                        │
│   6. Persist   → Supabase DB                        │
│   7. Return result JSON                             │
└─────────────────────────┬───────────────────────────┘
                          │
          ┌───────────────┴──────────────┐
          ▼                              ▼
┌─────────────────┐           ┌──────────────────────┐
│  Supabase DB    │           │  Supabase Storage    │
│  (reports tbl)  │           │  (photos bucket)     │
└─────────────────┘           └──────────────────────┘
```

### Key Decisions

- **Single API route (`POST /api/reports`)** — keeps all server logic in one place, easy to read and extend.
- **Mock-first classifier** — keyword matching on the description; swapping in a real AI model later only requires changing the classifier module.
- **Supabase for everything** — one SDK, one environment variable set, both database and file storage.
- **No authentication** — anonymous reports for the hackathon MVP; auth can be added later.

---

## Components and Interfaces

### Page Components

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Landing page |
| `/report` | `app/report/page.tsx` | Report submission form |
| `/report/[id]` | `app/report/[id]/page.tsx` | Results page after submission |
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard listing all reports |
| `*` (not found) | `app/not-found.tsx` | 404 page |

### Shared UI Components

```
components/
  Navbar.tsx          — persistent navigation bar (links to / and /dashboard)
  UrgencyBadge.tsx    — color-coded badge for urgency level
  ReportCard.tsx      — single report summary row for the dashboard list
```

### Server-Side Modules

```
lib/
  classifier.ts       — mock keyword-based classifier (upgradeable to AI)
  scorer.ts           — urgency scoring logic
  recommender.ts      — action recommendation logic
  supabase.ts         — Supabase client singleton (server-side)
  supabase-client.ts  — Supabase client singleton (browser-side)
```

### API Route

```
app/api/reports/route.ts   — POST handler: upload → classify → score → recommend → persist
```

### Module Interfaces

#### Classifier

```typescript
// lib/classifier.ts
export type PollutionCategory =
  | "plastic_waste"
  | "illegal_dumping"
  | "water_pollution"
  | "air_pollution"
  | "burning_waste";

export function classify(description: string): PollutionCategory;
```

The mock implementation scans the description for keyword patterns:

| Keywords (case-insensitive) | Category |
|-----------------------------|----------|
| `burn`, `fire`, `smoke`, `ash` | `burning_waste` |
| `dump`, `illegal`, `discard`, `abandon` | `illegal_dumping` |
| `water`, `river`, `lake`, `ocean`, `stream` | `water_pollution` |
| `air`, `smog`, `fume`, `exhaust`, `haze` | `air_pollution` |
| `plastic`, `bottle`, `bag`, `wrapper` | `plastic_waste` |
| *(no match)* | `plastic_waste` (default) |

#### Scorer

```typescript
// lib/scorer.ts
import { PollutionCategory } from "./classifier";

export type UrgencyLevel = "Low" | "Medium" | "High" | "Critical";

export function score(category: PollutionCategory, description: string): UrgencyLevel;
```

Scoring rules (evaluated in priority order):

| Condition | Urgency |
|-----------|---------|
| category === `burning_waste` | `Critical` |
| (category === `illegal_dumping` OR `water_pollution`) AND description contains proximity signal | `High` |
| category === `air_pollution` | `Medium` |
| category === `plastic_waste` | `Low` |
| all other combinations | `Medium` |

Proximity signals: `near water`, `near homes`, `next to`, `beside`, `adjacent`.

#### Recommender

```typescript
// lib/recommender.ts
import { PollutionCategory } from "./classifier";
import { UrgencyLevel } from "./scorer";

export function recommend(
  category: PollutionCategory,
  urgency: UrgencyLevel
): string[];
```

Action pool:
- `"Document the location with additional photos"`
- `"Notify local authorities"`
- `"Avoid direct contact with the pollutant"`
- `"Organize a community cleanup"`
- `"Escalate to environmental emergency services"`

Selection rules:
- `Critical` → always includes `"Notify local authorities"` + `"Escalate to environmental emergency services"`
- `High` → always includes `"Notify local authorities"`
- `Low` → always includes `"Organize a community cleanup"`
- The result list has 1–4 items

---

## Data Models

### Report (TypeScript type)

```typescript
// types/report.ts
export type PollutionCategory =
  | "plastic_waste"
  | "illegal_dumping"
  | "water_pollution"
  | "air_pollution"
  | "burning_waste";

export type UrgencyLevel = "Low" | "Medium" | "High" | "Critical";

export interface Report {
  id: string;                      // UUID, assigned by Supabase
  photo_url: string;               // Public URL from Supabase Storage
  location: string;                // Free-text location from user
  description: string;             // Free-text description from user
  pollution_category: PollutionCategory;
  urgency_level: UrgencyLevel;
  recommended_actions: string[];   // 1–4 strings from the action pool
  created_at: string;              // ISO 8601 timestamp, set by Supabase
}
```

### Supabase Database Schema

```sql
create table reports (
  id                  uuid primary key default gen_random_uuid(),
  photo_url           text not null,
  location            text not null,
  description         text not null default '',
  pollution_category  text not null,
  urgency_level       text not null,
  recommended_actions text[] not null,
  created_at          timestamptz not null default now()
);
```

### Supabase Storage

- Bucket name: `report-photos`
- Access: public (photos served via public URL)
- File path pattern: `{uuid}/{original-filename}`

### API Payload

**Request** — `POST /api/reports` (`multipart/form-data`):

| Field | Type | Required |
|-------|------|----------|
| `photo` | File (JPEG / PNG / WebP, ≤ 10 MB) | Yes |
| `location` | string | Yes |
| `description` | string | No |

**Response** — `200 OK` (JSON):

```json
{
  "id": "uuid",
  "photo_url": "https://...",
  "location": "string",
  "description": "string",
  "pollution_category": "plastic_waste",
  "urgency_level": "Low",
  "recommended_actions": ["..."],
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error responses**:

| Status | Meaning |
|--------|---------|
| 400 | Validation failure (missing field, bad file type/size) |
| 500 | Classifier, storage, or database error |

---


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Required field validation blocks submission

*For any* combination of form inputs where at least one required field (photo or location) is absent, the form SHALL be invalid and SHALL display an inline error message identifying each missing required field by name. Submission SHALL only be permitted when both required fields have values.

**Validates: Requirements 2.3, 2.4**

---

### Property 2: Invalid file type triggers error message

*For any* file whose MIME type is not one of `image/jpeg`, `image/png`, or `image/webp`, selecting that file in the upload field SHALL cause the App to display an error message that names the accepted formats. No report shall be submitted when an invalid file type is selected.

**Validates: Requirements 3.2**

---

### Property 3: Oversized file triggers error message

*For any* file whose size in bytes exceeds 10,485,760 (10 MB), selecting that file in the upload field SHALL cause the App to display an error message that states the maximum allowed file size. No report shall be submitted when an oversized file is selected.

**Validates: Requirements 3.3**

---

### Property 4: Classifier always returns a valid category

*For any* description string (including the empty string, strings with no recognizable keywords, and strings with unusual characters), the `classify` function SHALL return exactly one value that is a member of the set `{ "plastic_waste", "illegal_dumping", "water_pollution", "air_pollution", "burning_waste" }`.

**Validates: Requirements 4.1**

---

### Property 5: Classifier defaults to plastic_waste on no match

*For any* description string that contains none of the defined keyword patterns, the `classify` function SHALL return `"plastic_waste"`.

**Validates: Requirements 4.2**

---

### Property 6: Scorer always returns a valid urgency level

*For any* `PollutionCategory` value and any description string, the `score` function SHALL return exactly one value that is a member of the set `{ "Low", "Medium", "High", "Critical" }`.

**Validates: Requirements 5.1**

---

### Property 7: Scorer applies rules correctly

*For any* description string:
- When category is `burning_waste`, `score` SHALL return `"Critical"`.
- When category is `illegal_dumping` or `water_pollution` AND the description contains a proximity signal (`"near water"`, `"near homes"`, `"next to"`, `"beside"`, `"adjacent"`), `score` SHALL return `"High"`.
- When category is `air_pollution` and the above Critical/High conditions do not apply, `score` SHALL return `"Medium"`.
- When category is `plastic_waste` and the above conditions do not apply, `score` SHALL return `"Low"`.

**Validates: Requirements 5.2**

---

### Property 8: Recommender output is within bounds and drawn from the action pool

*For any* valid `PollutionCategory` and `UrgencyLevel` pair, the `recommend` function SHALL return a list whose length is between 1 and 4 (inclusive), and every string in that list SHALL be a member of the defined action pool:
- `"Document the location with additional photos"`
- `"Notify local authorities"`
- `"Avoid direct contact with the pollutant"`
- `"Organize a community cleanup"`
- `"Escalate to environmental emergency services"`

**Validates: Requirements 6.1, 6.2**

---

### Property 9: Recommender includes required actions per urgency level

*For any* `PollutionCategory` value:
- When urgency is `Critical`, the result SHALL contain both `"Notify local authorities"` and `"Escalate to environmental emergency services"`.
- When urgency is `High`, the result SHALL contain `"Notify local authorities"`.
- When urgency is `Low`, the result SHALL contain `"Organize a community cleanup"`.

**Validates: Requirements 6.3, 6.4, 6.5**

---

### Property 10: Results page renders all report fields

*For any* valid `Report` object, the results page render SHALL contain the report's `pollution_category`, `urgency_level`, each string in `recommended_actions`, and the report's unique `id`.

**Validates: Requirements 7.1, 7.3**

---

### Property 11: Urgency badge renders distinct styles per level

*For any* two different `UrgencyLevel` values, the `UrgencyBadge` component SHALL render them with different CSS class names (so each level is visually distinct).

**Validates: Requirements 7.2**

---

### Property 12: Report persistence includes all required fields

*For any* valid `Report` object, calling the persistence function SHALL invoke the Supabase insert with all required fields present: `photo_url`, `location`, `description`, `pollution_category`, `urgency_level`, `recommended_actions`, and `created_at`.

**Validates: Requirements 8.1**

---

### Property 13: Dashboard report card renders all required fields

*For any* valid `Report` object, the `ReportCard` component render SHALL contain the report's `created_at` timestamp, `location`, `pollution_category`, and `urgency_level`.

**Validates: Requirements 9.2**

---

### Property 14: Dashboard list is sorted by most recent first

*For any* non-empty list of `Report` objects with distinct `created_at` timestamps, the dashboard SHALL render the reports in descending order by `created_at`, such that each report appears before all reports with an earlier timestamp.

**Validates: Requirements 9.3**

---

## Error Handling

### Client-Side Validation Errors

All validation runs before the API call, providing immediate feedback:

| Scenario | User-Visible Response |
|----------|----------------------|
| Photo field empty on submit | Inline error: "Photo is required" |
| Location field empty on submit | Inline error: "Location is required" |
| Invalid file type selected | Inline error: "Only JPEG, PNG, and WebP files are accepted" |
| File exceeds 10 MB | Inline error: "File must be smaller than 10 MB" |

These messages are displayed adjacent to the relevant form field so the user knows exactly what to fix.

### API and Server Errors

Errors surfaced from the API route are displayed as a top-level alert on the form page:

| Scenario | HTTP Status | User-Visible Response |
|----------|------------|----------------------|
| Supabase Storage upload fails | 500 | "Failed to upload photo. Please try again." |
| Classifier error | 500 | "Classification failed. Please try again." |
| Database write fails | 500 | "Failed to save report. Please try again." |
| Unknown server error | 500 | "Something went wrong. Please try again." |

When the database write fails after the AI processing step has already completed, the client retains the report data (classification, urgency, actions) in component state so the user can retry without re-uploading the photo or re-classifying.

### 404 / Navigation Errors

Unknown routes are caught by `app/not-found.tsx`, which renders a simple 404 page with a link to the landing page.

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

Unit tests cover specific examples, edge cases, and error conditions.

**Modules to unit test:**

| Module | What to test |
|--------|-------------|
| `lib/classifier.ts` | Each keyword group maps to the correct category; empty string returns `plastic_waste`; mixed-keyword strings return the first-matched category |
| `lib/scorer.ts` | Each scoring rule; proximity signals trigger `High`; absence of proximity signal keeps `Medium`; all five categories covered |
| `lib/recommender.ts` | Each urgency level includes the required actions; output length is 1–4; all output strings are from the action pool |
| `components/UrgencyBadge.tsx` | Each level renders with a distinct CSS class |
| `components/ReportCard.tsx` | All four required fields are present in the render |
| `app/report/page.tsx` | Required field validation; error messages; loading state; file type and size rejection |
| `app/dashboard/page.tsx` | Empty state; list sort order; nav links |
| `app/report/[id]/page.tsx` | All report fields displayed; link to /report present |

### Property-Based Tests (fast-check)

Property-based tests verify universal properties using the [fast-check](https://github.com/dubzzz/fast-check) library (TypeScript-native, well-maintained, compatible with Vitest).

Each property test runs a minimum of **100 iterations** to exercise the input space.

Each test is tagged with a comment in the format:
```
// Feature: ecosnap-ai, Property N: <property text>
```

**Properties to implement as property-based tests:**

| Property | fast-check Arbitraries |
|----------|----------------------|
| P4: Classifier always returns valid category | `fc.string()` for description |
| P5: Classifier defaults to plastic_waste | `fc.string()` filtered to exclude all keyword patterns |
| P6: Scorer always returns valid urgency | `fc.constantFrom(...categories)` × `fc.string()` |
| P7: Scorer scoring rules | `fc.constantFrom(...categories)` × crafted string arbitraries per rule |
| P8: Recommender output bounds and pool | `fc.constantFrom(...categories)` × `fc.constantFrom(...urgencies)` |
| P9: Recommender required inclusions per urgency | `fc.constantFrom(...categories)` × specific urgency values |
| P11: UrgencyBadge distinct styles | `fc.uniqueArray(fc.constantFrom(...urgencies), {minLength: 2, maxLength: 2})` |
| P13: ReportCard renders all fields | `fc.record({...})` generating random Report objects |
| P14: Dashboard sort order | `fc.array(fc.record({...}), {minLength: 1})` with random timestamps |

Properties P1, P2, P3 (form validation) are tested via React Testing Library with programmatic input; fast-check generates the invalid input values.

Properties P10 and P12 (results page, persistence) use mocked Supabase client with fast-check generating random Report objects.

### Integration Tests

These verify that the components are wired correctly to external services:

| Scenario | Approach |
|----------|----------|
| `POST /api/reports` with a real Supabase test project | Manual or CI smoke test |
| Photo URL is stored and publicly accessible | Manual check after Phase 2 |
| Dashboard loads real data from Supabase | Manual check after Phase 2 |

### Test Configuration

```json
// vitest.config.ts (key settings)
{
  "test": {
    "environment": "jsdom",
    "setupFiles": ["./vitest.setup.ts"]
  }
}
```

```bash
# Run all tests (single execution, no watch mode)
npx vitest --run
```
