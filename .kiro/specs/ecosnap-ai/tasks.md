# Tasks

## Phase 1: Project Setup and UI Scaffolding

- [x] 1.1 Initialize Next.js project with TypeScript and Tailwind CSS
  - [x] 1.1.1 Run `create-next-app` with TypeScript, Tailwind CSS, App Router, and ESLint
  - [x] 1.1.2 Remove boilerplate content from `app/page.tsx`, `app/globals.css`
  - [x] 1.1.3 Verify project builds and runs without errors

- [x] 1.2 Create shared `Navbar` component
  - [x] 1.2.1 Create `components/Navbar.tsx` with links to `/` and `/dashboard`
  - [x] 1.2.2 Import and render `Navbar` in `app/layout.tsx` so it appears on all pages
  - [x] 1.2.3 Style with Tailwind (responsive, simple)

- [x] 1.3 Build the Landing Page (`/`)
  - [x] 1.3.1 Create `app/page.tsx` with a headline, brief description, and CTA button linking to `/report`
  - [x] 1.3.2 Apply responsive Tailwind layout (mobile and desktop)

- [x] 1.4 Build the Report Submission Form UI (`/report`)
  - [x] 1.4.1 Create `app/report/page.tsx` with a `<form>` containing a file upload field, location text input, and description text input
  - [x] 1.4.2 Add client-side required-field validation (photo and location) with inline error messages
  - [x] 1.4.3 Add file type validation (JPEG, PNG, WebP only) with inline error message
  - [x] 1.4.4 Add file size validation (max 10 MB) with inline error message
  - [x] 1.4.5 Display an image preview when a valid photo is selected
  - [x] 1.4.6 Show a loading indicator while the form is being submitted (disable submit button during loading)

- [x] 1.5 Build the Dashboard UI (`/dashboard`)
  - [x] 1.5.1 Create `app/dashboard/page.tsx` with a placeholder list layout
  - [x] 1.5.2 Create `components/ReportCard.tsx` that displays timestamp, location, pollution category, and urgency level for a single report
  - [x] 1.5.3 Create `components/UrgencyBadge.tsx` that renders a color-coded badge (`Low`=green, `Medium`=yellow, `High`=orange, `Critical`=red)
  - [x] 1.5.4 Add an empty-state message with a link to `/report` when there are no reports

- [x] 1.6 Build the Results Page UI (`/report/[id]`)
  - [x] 1.6.1 Create `app/report/[id]/page.tsx` with placeholder layout
  - [x] 1.6.2 Display pollution category, urgency badge, list of recommended actions, and report ID
  - [x] 1.6.3 Add a navigation link back to `/report`

- [x] 1.7 Create 404 page
  - [x] 1.7.1 Create `app/not-found.tsx` with a message and link back to `/`

---

## Phase 2: Database Schema, Supabase Integration, and File Upload

- [x] 2.1 Set up Supabase project and environment variables
  - [x] 2.1.1 Create a Supabase project (or reuse an existing one)
  - [x] 2.1.2 Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
  - [x] 2.1.3 Add `.env.local` to `.gitignore`

- [x] 2.2 Install Supabase JS client and create client singletons
  - [x] 2.2.1 Install `@supabase/supabase-js` with a pinned version
  - [x] 2.2.2 Create `lib/supabase.ts` (server-side client using `SUPABASE_SERVICE_ROLE_KEY`)
  - [x] 2.2.3 Create `lib/supabase-client.ts` (browser-side client using the anon key)

- [x] 2.3 Create the `reports` database table in Supabase
  - [x] 2.3.1 Run the SQL schema from the design document in the Supabase SQL editor:
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
  - [x] 2.3.2 Verify the table exists and columns match the design

- [x] 2.4 Create the `report-photos` Supabase Storage bucket
  - [x] 2.4.1 Create a public bucket named `report-photos` in the Supabase Storage dashboard
  - [x] 2.4.2 Verify the bucket policy allows public reads

- [x] 2.5 Create TypeScript types
  - [x] 2.5.1 Create `types/report.ts` with `PollutionCategory`, `UrgencyLevel`, and `Report` types as defined in the design document

- [x] 2.6 Implement the API route skeleton (`POST /api/reports`)
  - [x] 2.6.1 Create `app/api/reports/route.ts` with a `POST` handler
  - [x] 2.6.2 Parse `multipart/form-data` from the request (use `request.formData()`)
  - [x] 2.6.3 Validate that `photo` and `location` fields are present; return `400` if not
  - [x] 2.6.4 Upload the photo file to Supabase Storage (`report-photos` bucket) and get the public URL
  - [x] 2.6.5 Stub out classify, score, and recommend calls (hardcode placeholder values for now)
  - [x] 2.6.6 Insert the report into the `reports` table and return the full row as JSON
  - [x] 2.6.7 Return `500` with a descriptive error message for any server-side failure

- [x] 2.7 Wire the report form to the API route
  - [x] 2.7.1 In `app/report/page.tsx`, call `POST /api/reports` on valid form submit
  - [x] 2.7.2 On success, navigate to `/report/[id]` using the returned report ID
  - [x] 2.7.3 On error, display the error message from the API response

- [x] 2.8 Wire the results page to display real report data
  - [x] 2.8.1 In `app/report/[id]/page.tsx`, fetch the report from Supabase by ID (server component)
  - [x] 2.8.2 Display all report fields using the components built in Phase 1

- [x] 2.9 Wire the dashboard to load real report data
  - [x] 2.9.1 In `app/dashboard/page.tsx`, fetch all reports from Supabase ordered by `created_at DESC` (server component)
  - [x] 2.9.2 Render each report using `ReportCard`
  - [x] 2.9.3 Show empty-state when no reports exist

---

## Phase 3: AI Classification, Urgency Scoring, and Action Recommendations

- [x] 3.1 Implement the mock Classifier (`lib/classifier.ts`)
  - [x] 3.1.1 Define the `PollutionCategory` type and `classify(description: string): PollutionCategory` function
  - [x] 3.1.2 Implement keyword matching for all five categories as specified in the design
  - [x] 3.1.3 Return `"plastic_waste"` as the default when no keyword matches
  - [x] 3.1.4 Write unit tests covering each keyword group and the default case

- [x] 3.2 Implement the Urgency Scorer (`lib/scorer.ts`)
  - [x] 3.2.1 Define the `UrgencyLevel` type and `score(category: PollutionCategory, description: string): UrgencyLevel` function
  - [x] 3.2.2 Implement all scoring rules from the design in priority order
  - [x] 3.2.3 Define the list of proximity signal strings
  - [x] 3.2.4 Write unit tests covering each rule, including proximity signal detection

- [x] 3.3 Implement the Action Recommender (`lib/recommender.ts`)
  - [x] 3.3.1 Define the action pool as a constant array
  - [x] 3.3.2 Implement `recommend(category: PollutionCategory, urgency: UrgencyLevel): string[]`
  - [x] 3.3.3 Implement inclusion rules for Critical, High, and Low urgency levels
  - [x] 3.3.4 Ensure the output list length is always 1–4
  - [x] 3.3.5 Write unit tests covering each urgency level's required inclusions

- [ ] 3.4 Integrate classifier, scorer, and recommender into the API route
  - [ ] 3.4.1 Replace the placeholder stubs in `app/api/reports/route.ts` with real calls to `classify`, `score`, and `recommend`
  - [ ] 3.4.2 Pass the classification result to the scorer and recommender in the correct order
  - [ ] 3.4.3 Include the classification, urgency, and recommended actions in the Supabase insert

- [ ] 3.5 Write property-based tests (fast-check)
  - [ ] 3.5.1 Install `fast-check` with a pinned version
  - [ ] 3.5.2 Configure Vitest with `jsdom` environment and setup file
  - [ ] 3.5.3 Write property test for P4: Classifier always returns valid category (`fc.string()`)
  - [ ] 3.5.4 Write property test for P5: Classifier defaults to `plastic_waste` on no match
  - [ ] 3.5.5 Write property test for P6: Scorer always returns valid urgency level
  - [ ] 3.5.6 Write property test for P7: Scorer applies each scoring rule correctly
  - [ ] 3.5.7 Write property test for P8: Recommender output bounds and pool membership
  - [ ] 3.5.8 Write property test for P9: Recommender includes required actions per urgency level
  - [ ] 3.5.9 Write property test for P13: ReportCard renders all required fields for any report
  - [ ] 3.5.10 Write property test for P14: Dashboard list is sorted by most recent first
  - [ ] 3.5.11 Verify all property tests run with at least 100 iterations each

---

## Phase 4: UI Polish, UX Improvements, and Demo Readiness

- [ ] 4.1 Polish UI across all pages
  - [ ] 4.1.1 Apply consistent Tailwind spacing, typography, and color palette across all pages
  - [ ] 4.1.2 Ensure `UrgencyBadge` colors are visually distinct for all four levels
  - [ ] 4.1.3 Add hover and focus states to interactive elements for accessibility
  - [ ] 4.1.4 Test layout on mobile (375 px) and desktop (1280 px) screen sizes

- [ ] 4.2 UX improvements
  - [ ] 4.2.1 Show a success toast or banner on the results page confirming the report was saved
  - [ ] 4.2.2 Improve loading state feedback on the form (spinner or progress indicator)
  - [ ] 4.2.3 Add a "Submit another report" link on the results page
  - [ ] 4.2.4 Add timestamp formatting on the dashboard (e.g., "2 hours ago" or locale date string)

- [ ] 4.3 Accessibility and code quality
  - [ ] 4.3.1 Add `aria-label` attributes to icon-only buttons and form controls
  - [ ] 4.3.2 Ensure all images have `alt` text
  - [ ] 4.3.3 Ensure form error messages are linked to their inputs via `aria-describedby`
  - [ ] 4.3.4 Run ESLint and fix all warnings

- [ ] 4.4 Write additional property-based tests for UI components
  - [ ] 4.4.1 Write property test for P11: UrgencyBadge renders distinct CSS classes for distinct urgency levels
  - [ ] 4.4.2 Write property test for P1: Required field validation blocks submission for any combination of missing required fields
  - [ ] 4.4.3 Write property test for P2: Invalid file type always triggers the file format error message
  - [ ] 4.4.4 Write property test for P3: Oversized file always triggers the file size error message

- [ ] 4.5 Run full test suite and fix any failures
  - [ ] 4.5.1 Run `npx vitest --run` and ensure all unit and property tests pass
  - [ ] 4.5.2 Fix any failing tests

- [ ] 4.6 Write hackathon README
  - [ ] 4.6.1 Create `README.md` in the project root with: project name, problem statement, tech stack, setup instructions (env vars, Supabase setup, `npm install`, `npm run dev`), and a brief description of each phase
  - [ ] 4.6.2 Add screenshots or a short demo GIF to the README
  - [ ] 4.6.3 Document how to upgrade the mock classifier to a real AI API

- [ ] 4.7 Final demo preparation
  - [ ] 4.7.1 Deploy to Vercel (connect GitHub repo, add environment variables)
  - [ ] 4.7.2 Verify the deployed app loads, accepts a report submission, and shows results
  - [ ] 4.7.3 Verify the dashboard shows previously submitted reports in correct order
