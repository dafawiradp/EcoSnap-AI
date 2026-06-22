# Requirements Document

## Introduction

EcoSnap AI is a web-based pollution reporting platform built for the "Reducing Public Pollution" hackathon challenge. Users upload a photo of pollution, add a location and description, and the system returns an AI-based pollution classification, an urgency priority level, and recommended actions. The goal is to make pollution reporting faster, smarter, and more actionable for solo or community-driven environmental monitoring.

The MVP is structured in four phases:
- **Phase 1**: Project setup, landing page, report form UI, dashboard UI
- **Phase 2**: Database schema, save report to Supabase, file upload handling
- **Phase 3**: AI classification logic, urgency scoring, action recommendation engine
- **Phase 4**: UI polish, UX improvements, demo readiness, hackathon README

---

## Glossary

- **App**: The EcoSnap AI Next.js web application
- **User**: A person submitting a pollution report via the web interface
- **Report**: A pollution submission consisting of a photo, location, description, classification result, urgency level, and recommended actions
- **Classifier**: The module responsible for determining the pollution category from a photo (may be an AI integration or mock stub)
- **Scorer**: The module responsible for computing the urgency level for a given Report
- **Recommender**: The module responsible for generating recommended actions for a given Report
- **Dashboard**: The page displaying a list of previously submitted Reports
- **Supabase**: The backend-as-a-service used for database storage and file storage
- **Pollution Category**: One of: `plastic_waste`, `illegal_dumping`, `water_pollution`, `air_pollution`, `burning_waste`
- **Urgency Level**: One of: `Low`, `Medium`, `High`, `Critical`

---

## Requirements

### Requirement 1: Landing Page

**User Story:** As a User, I want to see a clear landing page when I visit the App, so that I understand what EcoSnap AI does and can navigate to submit a report.

#### Acceptance Criteria

1. THE App SHALL display a landing page at the root route (`/`) that includes a headline, a brief description of the platform's purpose, and a call-to-action button linking to the report submission form.
2. THE App SHALL render the landing page with responsive layout on both mobile and desktop screen sizes.
3. WHEN the User clicks the call-to-action button, THE App SHALL navigate the User to the report submission form page.

---

### Requirement 2: Report Submission Form

**User Story:** As a User, I want to fill out a structured form to report pollution, so that I can submit all necessary information in one place.

#### Acceptance Criteria

1. THE App SHALL provide a report submission form page at the route `/report`.
2. THE App SHALL include a photo upload field, a location text input, and a description text input on the submission form.
3. THE App SHALL require the photo upload field and the location field to have values before the form can be submitted.
4. WHEN the User attempts to submit the form with a missing required field, THE App SHALL display a descriptive inline validation message identifying which field is missing.
5. WHEN the User submits a valid form, THE App SHALL display a loading indicator while the report is being processed.

---

### Requirement 3: Photo Upload

**User Story:** As a User, I want to upload a photo of the pollution, so that the system can classify it and record visual evidence.

#### Acceptance Criteria

1. THE App SHALL accept photo uploads in JPEG, PNG, and WebP formats.
2. IF the User selects a file that is not a JPEG, PNG, or WebP, THEN THE App SHALL display an error message stating the accepted file formats.
3. IF the User selects a file exceeding 10 MB in size, THEN THE App SHALL display an error message stating the maximum allowed file size.
4. WHEN a valid photo is selected, THE App SHALL display a preview of the selected image before submission.
5. WHEN the User submits the form, THE App SHALL upload the photo to Supabase Storage and record the resulting public URL in the Report.

---

### Requirement 4: Pollution Classification

**User Story:** As a User, I want the system to classify the pollution in my photo, so that I receive an accurate category without manually selecting one.

#### Acceptance Criteria

1. WHEN a Report is submitted, THE Classifier SHALL assign exactly one Pollution Category from the set: `plastic_waste`, `illegal_dumping`, `water_pollution`, `air_pollution`, `burning_waste`.
2. WHERE a real AI image classification API is not yet integrated, THE Classifier SHALL use a deterministic mock that maps keyword patterns in the description field to a Pollution Category, returning `plastic_waste` as the default when no pattern matches.
3. THE Classifier SHALL return the classification result within 5 seconds for the mock implementation and within 15 seconds for a live AI API integration.
4. IF the Classifier fails to return a result, THEN THE App SHALL display an error message and allow the User to resubmit the Report.

---

### Requirement 5: Urgency Scoring

**User Story:** As a User, I want to receive an urgency level for my report, so that I know how serious the pollution situation is and how quickly it should be addressed.

#### Acceptance Criteria

1. WHEN a Report is classified, THE Scorer SHALL assign exactly one Urgency Level from the set: `Low`, `Medium`, `High`, `Critical`.
2. THE Scorer SHALL derive the Urgency Level based on the Pollution Category and contextual signals present in the description field, according to the following rules:
   - `burning_waste` category SHALL produce an Urgency Level of `Critical`.
   - `illegal_dumping` or `water_pollution` category combined with a description containing a proximity signal (e.g., "near water", "near homes", "next to") SHALL produce an Urgency Level of `High`.
   - `air_pollution` category SHALL produce an Urgency Level of `Medium` by default.
   - `plastic_waste` category SHALL produce an Urgency Level of `Low` by default.
   - All other combinations not covered by the above rules SHALL produce an Urgency Level of `Medium`.
3. THE Scorer SHALL return the Urgency Level synchronously as part of the same processing pipeline that returns the classification result.

---

### Requirement 6: Recommended Actions

**User Story:** As a User, I want to receive a list of recommended actions after submitting a report, so that I know what steps to take next.

#### Acceptance Criteria

1. WHEN a Report has been scored, THE Recommender SHALL return a list of 1 to 4 recommended action strings for the Report.
2. THE Recommender SHALL select recommended actions based on the Urgency Level and Pollution Category, drawing from the following action pool:
   - "Document the location with additional photos"
   - "Notify local authorities"
   - "Avoid direct contact with the pollutant"
   - "Organize a community cleanup"
   - "Escalate to environmental emergency services"
3. WHEN the Urgency Level is `Critical`, THE Recommender SHALL include both "Notify local authorities" and "Escalate to environmental emergency services" in the returned list.
4. WHEN the Urgency Level is `High`, THE Recommender SHALL include "Notify local authorities" in the returned list.
5. WHEN the Urgency Level is `Low`, THE Recommender SHALL include "Organize a community cleanup" in the returned list.

---

### Requirement 7: Report Results Display

**User Story:** As a User, I want to see the classification, urgency, and recommended actions after submission, so that I can immediately understand and act on my report.

#### Acceptance Criteria

1. WHEN a Report has been fully processed, THE App SHALL navigate the User to a results page displaying the Pollution Category, Urgency Level, and list of recommended actions for that Report.
2. THE App SHALL display the Urgency Level using a distinct visual indicator (e.g., color-coded badge) that differentiates between `Low`, `Medium`, `High`, and `Critical`.
3. THE App SHALL display a confirmation that the Report has been saved, including the Report's unique identifier.
4. THE App SHALL provide a navigation link from the results page back to the report submission form.

---

### Requirement 8: Report Persistence

**User Story:** As a User, I want my submitted report to be saved, so that it can be reviewed later on the dashboard.

#### Acceptance Criteria

1. WHEN a Report is successfully processed, THE App SHALL persist the Report to the Supabase database, including the photo URL, location, description, Pollution Category, Urgency Level, recommended actions, and submission timestamp.
2. IF the database write fails, THEN THE App SHALL display an error message to the User and retain the report data on the client so the User can retry.
3. THE App SHALL assign a unique identifier to each persisted Report.

---

### Requirement 9: Reports Dashboard

**User Story:** As a User, I want to view a dashboard of all submitted reports, so that I can see the history of pollution reports in one place.

#### Acceptance Criteria

1. THE App SHALL provide a dashboard page at the route `/dashboard` displaying a list of all persisted Reports.
2. THE App SHALL display for each Report in the list: the submission timestamp, location, Pollution Category, and Urgency Level.
3. THE App SHALL render the dashboard list in descending order by submission timestamp, showing the most recent Report first.
4. WHEN the dashboard has no Reports, THE App SHALL display a message indicating that no reports have been submitted yet and provide a link to the report submission form.
5. THE App SHALL provide navigation links in a header or navigation bar to both the landing page and the report submission form from the dashboard.

---

### Requirement 10: Navigation and Routing

**User Story:** As a User, I want consistent navigation across the App, so that I can move between pages without getting lost.

#### Acceptance Criteria

1. THE App SHALL include a persistent navigation bar on all pages containing a link to the landing page (`/`) and a link to the dashboard (`/dashboard`).
2. THE App SHALL use Next.js client-side routing for all internal page transitions.
3. IF the User navigates to a route that does not exist, THEN THE App SHALL display a 404 page with a link back to the landing page.
