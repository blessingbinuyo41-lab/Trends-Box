# Interactive Bug Ant Support & Issue Reporter

An animated, playful yet professional bug-reporting system featuring an interactive "Bug Ant" mascot that plays hide-and-seek along screen edges, combined with an animated floating modal supporting direct screenshot evidence uploads to Supabase Storage and email delivery via Formspree.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design and architectural choices have been aligned with your preferences:
> - **Screenshot Storage**: Screenshots (up to 2 files) will be uploaded to a dedicated Supabase Storage bucket (`bug-reports`) so direct, public/signed URLs are generated and embedded directly into the Formspree email body.
> - **Formspree Delivery**: Built with an active Formspree submission handler that accepts your Formspree Form ID (configured via `.env` or input directly in settings), with automatic Supabase database and local storage fallback so no user report is ever lost.
> - **Mascot Interaction**: The bug ant character docks on either the left or right edge of the screen, peeking half its body out, waving its antennae/arms to invite interaction, and can be smoothly dragged up, down, or across sides by the user.

---

## 1. Overview & Core Concept

- **What It Does**: Provides users with a delightful, non-intrusive way to report bugs and suggest fixes. The bug ant mascot peeks from the browser bezel, reacts to cursor interactions with subtle waving gestures, and snaps smoothly to the user's preferred screen side. Clicking it opens a focused, animated modal with pre-filled account details (for signed-in users), issue categorisation, rich description textarea, and drag-and-drop screenshot attachments.
- **Target Audience**: Trends Box Nigeria readers, editors, and creators who encounter rendering bugs, source mismatches, or layout glitches.
- **Key Value**: Eliminates user frustration when submitting feedback by making bug reporting playful, while delivering actionable bug tickets straight to your inbox complete with device metadata and directly viewable screenshot images.

---

## 2. Mascot & Modal Interaction Flow

### A. The Bug Ant Mascot (`BugAntMascot.tsx`)
- **Visual Style**: Clean SVG vector ant with rounded cartoon antennae, expressive eyes, and a sleek silhouette styled to harmonize with the Trends Box dark/minimalist palette.
- **Hide-and-Seek Peeking**:
  - By default, peeks out 50% from the screen edge (left middle or right middle).
  - On hover or idle pulse, the ant pops forward slightly, gives a friendly wave, and shows a playful tooltip ("Spot a bug? Click me! 🪲").
- **Draggability**:
  - Powered by Framer Motion drag gestures (`drag="y"` or free drag constrained to screen edges).
  - Dragging to the right half snaps it to the right edge; dragging to the left snaps it to the left edge.
  - Position is remembered in `localStorage` so the user's preferred docking side persists across visits.

### B. The Floating Animated Modal (`BugReportModal.tsx`)
- **Entry / Exit**: Smooth scale-up and spring entrance using Framer Motion with backdrop blur.
- **Form Fields**:
  - **Reporter Name**: Full name input.
  - **Account Email**: Auto-filled from active Supabase session (editable).
  - **Issue Category / Subject**: Pre-set issue types (*Visual Bug / Source Error / Quota Problem / Feature Suggestion / Other*).
  - **Description**: Textarea with character counter and helpful placeholder guidance.
  - **Screenshot Attachments**: Max 2 images (PNG/JPG/WebP, max 5MB each) with instant thumbnail preview, remove action, and drag-and-drop support.
- **Submission State**:
  - Uploads images to Supabase Storage.
  - Dispatches form data to Formspree endpoint.
  - Celebratory completion animation ("Bug Captured! 🎯 Thank you for keeping Trends Box sharp.").

---

## 3. Technical Architecture & Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    User Browser Client                       │
│                                                              │
│  ┌───────────────────────┐       ┌────────────────────────┐  │
│  │   BugAntMascot.tsx    │ ───>  │  BugReportModal.tsx    │  │
│  │ (Draggable Edge Peek) │ Click │ (Form + 2 Screenshots) │  │
│  └───────────────────────┘       └───────────┬────────────┘  │
└──────────────────────────────────────────────┼───────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       │                                               │
                       ▼ 1. Upload Screenshots                         ▼ 2. Submit Report
       ┌───────────────────────────────┐               ┌───────────────────────────────┐
       │       Supabase Storage        │               │       Formspree Endpoint      │
       │     Bucket: 'bug-reports'     │               │    (https://formspree.io/f/..)│
       │                               │               │                               │
       │ Returns direct public image   │               │ Receives:                     │
       │ URLs for email viewing        │               │ - User Name & Email           │
       └───────────────┬───────────────┘               │ - Issue Category & Message    │
                       │                               │ - Clickable Screenshot Links  │
                       │ Screenshot Links              │ - Device/Browser Diagnostics  │
                       └──────────────────────────────>│                               │
                                                       └───────────────┬───────────────┘
                                                                       │
                                                                       ▼ Direct to Inbox
                                                       ┌───────────────────────────────┐
                                                       │   Admin Email Notification    │
                                                       │ (Full bug details + images)   │
                                                       └───────────────────────────────┘
```

---

## 4. Implementation Steps & Sub-tasks

1. **Bug Ant Mascot Component (`src/components/BugAntMascot.tsx`)**:
   - Custom SVG illustration of a friendly ant with animated waving antennae and legs.
   - Draggable edge docking mechanism with snap-to-edge logic and local storage persistence.
   - Peek-a-boo half-body state with hover expansion and accessible trigger for the modal.

2. **Bug Report Floating Modal (`src/components/BugReportModal.tsx`)**:
   - Animated dialog with backdrop blur and responsive layout for mobile and desktop.
   - Controlled form state with validation for email, subject, and description.
   - Dual-file upload area with drag-and-drop, image preview thumbnails, and file size checks.

3. **Storage & Formspree Service (`src/lib/supportService.ts`)**:
   - Helper function `uploadScreenshotToStorage(file)` to push images to Supabase Storage (with graceful base64 preview fallback if storage bucket creation is restricted).
   - Formspree submission handler `submitBugReport(payload)` with environment variable `VITE_FORMSPREE_FORM_ID` and fallback to Supabase table `bug_reports`.
   - Browser environment diagnostic capture (OS, viewport dimensions, current route) appended to help rapid troubleshooting.

4. **Integration into App Shell (`src/App.tsx`)**:
   - Render `BugAntMascot` globally at the root layout so it is available across all tabs (Generation, History, Results).
   - Wire state to open and close `BugReportModal`.
   - Pass authenticated user email to auto-fill the form.

---

## 5. Verification & Testing Plan

- **Mascot Interaction Test**:
  - Verify dragging on desktop and touch devices.
  - Test snapping to left and right screen edges and verifying half-body hiding.
  - Verify waving animation on hover and periodic idle state.
- **Modal & File Upload Test**:
  - Test modal opening and closing (Esc key, outside click, and close button).
  - Test attaching 1 and 2 image files; verify exceeding 2 files or non-image files are prevented.
  - Verify image thumbnail rendering and individual delete actions.
- **Formspree & Storage Test**:
  - Test submission with test Formspree ID and verify payload formatting (including screenshot URLs and device info).
  - Verify success state with animation and clean form reset.
- **Build & Quality Check**:
  - Run `lint_applet` (`tsc --noEmit`) to verify zero TypeScript errors.
  - Run `compile_applet` to confirm clean production build.
