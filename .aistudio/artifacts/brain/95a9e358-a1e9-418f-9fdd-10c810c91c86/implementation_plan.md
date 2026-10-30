# Authentication Audit, Password Recovery, Legal Pages & Hub Watermark

Audit and refine the user signup and authentication lifecycle, implement a fully working forgot/reset password flow, add accessible Privacy Policy and Terms of Service documents, and apply the brand watermark at the bottom of the application.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following items were requested for this final polish:
> 1. **Sign Up Flow Audit**: Ensure validation (email format, minimum password length), helpful error messages, full name field for user profile personalization, and clean transition states.
> 2. **Working Forgot Password Flow**: Full Supabase `resetPasswordForEmail` integration with redirect handling and a clean in-app modal/view to input the new password when returning from the reset link.
> 3. **Privacy Policy & Terms and Conditions**: Accessible via modals from both the Auth sign-up screen and the footer of the app, outlining Nigerian journalism compliance, data privacy, and usage limits.
> 4. **Brand Watermark**: Embedded at the bottom of the app page: `With ❤️ from Binuyo Legacy Hub`.

---

## 1. Overview & Core Concept

- **Sign Up Polish**: Allows users to register cleanly with Full Name, Email, and Password. Handles email confirmation scenarios gracefully, ensuring immediate clarity whether email verification is toggled on or off in Supabase.
- **Forgot Password**: Provides an in-auth switch to "Forgot Password?". Users submit their email, receive the recovery link via Supabase Auth, and can reset their password securely.
- **Privacy & Terms**: Authoritative, clean modal dialogs explaining user data handling, non-retention of payment data, authentic source attribution, and fair usage quotas.
- **Footer Watermark**: An elegant, subtle brand signature honoring the creator: `With ❤️ from Binuyo Legacy Hub`, styled with high typographic restraint.

---

## 2. User Experience & Visual Design

### Auth Flow States
```
┌────────────────────────────────────────────────────────┐
│                   Trends Box Portal                    │
│                                                        │
│   [ Sign In ]  |  [ Create Account ]  |  [ Forgot? ]   │
│                                                        │
│   • Full Name (during Sign Up)                         │
│   • Email Address                                      │
│   • Password (min 6 characters)                        │
│                                                        │
│   By continuing, you agree to our                      │
│   [Terms of Service] and [Privacy Policy]              │
│                                                        │
│   [ Submit Action Button ]                             │
└────────────────────────────────────────────────────────┘
```

### Watermark Placement
Rendered at the bottom of both the main generation dashboard and history view:
```
──────────────────────────────────────────────────────────
Trends Box Nigeria · Real-time Verified Editorial Intelligence
With ❤️ from Binuyo Legacy Hub
```

---

## 3. Implementation Steps

1. **`src/components/LegalModals.tsx`**:
   - Create comprehensive, professional `PrivacyPolicyModal` and `TermsModal` components with smooth spring animations, clean readable typography, and instant close buttons.
2. **`src/components/Auth.tsx`**:
   - Audit and upgrade Auth component with 3 distinct tabs/modes:
     - `signin`: Email + Password + "Forgot Password?" button.
     - `signup`: Full Name + Email + Password + Terms/Privacy agreement links.
     - `forgot`: Email input + "Send Recovery Link" button with countdown and confirmation.
   - Add inline links to open Privacy Policy and Terms of Service directly in the auth card.
3. **Password Reset Detection (`src/App.tsx` & `src/components/ResetPasswordModal.tsx`)**:
   - Detect Supabase `PASSWORD_RECOVERY` auth event or `#type=recovery` URL hash.
   - Present a prompt modal to set a new password via `supabase.auth.updateUser({ password })`.
4. **Watermark & Legal Links in Main App**:
   - Add footer watermark (`With ❤️ from Binuyo Legacy Hub`) and quick links to Privacy Policy and Terms of Service at the bottom of `App.tsx` and in the sidebar.
