# HealthPrep - Questions for My Doctor

## Overview
HealthPrep is a comprehensive health tracking Progressive Web Application (PWA) that helps patients prepare for doctor visits. It generates AI-powered questions based on conditions, symptoms, and medications, while also tracking health data between appointments.

## Current State
The MVP is fully implemented with all core features functional.

## Features
- **User Authentication**: Passkey-based authentication via Replit Auth (OpenID Connect) - supports Google, GitHub, Apple, email/password
- **User Profile**: View account info, manage patient profiles, and healthcare providers
- **Patient Profiles**: Manage multiple patient profiles (self, children, spouse, parents) with medical history, allergies, medications, and emergency contacts
- **Healthcare Providers**: Store contact info for GP, Dentist, Specialist, Optometrist, Physiotherapist, Psychiatrist, and other providers
- **Questions Generator**: AI-powered generation of structured questions to ask doctors, with red flags identification
- **Appointments Manager**: Schedule and manage doctor appointments with reminder settings
- **Symptom Tracker**: Log symptoms with severity ratings (1-10 scale)
- **Health Readings**: Track blood pressure, glucose, temperature, weight, heart rate, and oxygen saturation
- **Timeline View**: Chronological view of all health data
- **Reminders**: Customizable periodic reminders for logging readings (hourly to weekly intervals)
- **Nearby Services**: Find pharmacies, GPs, dentists, and A&E/hospitals near you using device location or manual address entry
- **PWA Support**: Installable web app with service worker for offline functionality

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-4.1)

## Project Structure
```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities
server/
├── routes.ts           # API endpoints
├── storage.ts          # Database operations
├── db.ts               # Database connection
└── replit_integrations/  # OpenAI integration
shared/
├── schema.ts           # Database models and types
└── models/             # Additional schemas
```

## API Endpoints
- `GET /api/auth/user` - Get current user info
- `GET /api/login` - Initiate login flow
- `GET /api/logout` - Logout user
- `GET/POST /api/appointments` - Manage appointments
- `GET/POST /api/symptoms` - Track symptoms
- `GET/POST /api/readings` - Log health readings
- `GET/POST /api/reminders` - Configure reminders
- `POST /api/questions/generate` - Generate AI questions
- `GET /api/questions` - Retrieve saved question sets
- `GET/POST /api/providers` - Manage healthcare providers (protected)
- `PATCH/DELETE /api/providers/:id` - Update/delete providers (protected)
- `GET /api/nearby` - Find nearby pharmacies, GPs, dentists, hospitals (uses OpenStreetMap)
- `GET/POST /api/patient-profiles` - Manage patient profiles (protected)
- `GET/PATCH/DELETE /api/patient-profiles/:id` - Individual profile operations (protected)
- `POST /api/patient-profiles/:id/set-default` - Set default patient profile (protected)

## Design
- Healthcare-themed teal/blue color palette
- Responsive design for desktop, tablet, and mobile
- Dark mode support
- Accessible components using Shadcn UI

## Security Notes (Zero Trust Architecture)
- **Authentication**: All health data routes protected with `isAuthenticated` middleware (appointments, symptoms, readings, reminders, questions, patient profiles, providers)
- **Security Headers**: Helmet middleware for CSP, XSS protection, clickjacking prevention
- **Rate Limiting**: 100 requests/15min for API, 20 requests/15min for auth endpoints, 1MB body size limit
- **Input Validation**:
  - `validateIdParam` middleware validates numeric IDs on all /:id routes
  - Max length constraints on all schema fields
  - Coordinate range validation (-90 to 90 lat, -180 to 180 lon) for nearby services
  - Service type whitelisting for nearby endpoint
  - Email validation using validator library
- **Error Handling**: Generic error messages returned to clients; detailed errors logged server-side only
- **Patient Profile Security**:
  - Strips `userId` from client input (injected server-side from auth)
  - Strips `isDefault` from create/update (only changeable via set-default endpoint)
  - Coerces date strings to Date objects for proper validation

## Recent Changes
- January 22, 2026: Added landing page for non-authenticated users
  - Professional hero section with "Prepare for Doctor Visits with Confidence" messaging
  - Features grid showcasing all 8 key features with icons
  - Benefits bar with checkmarks
  - Call-to-action section with primary color background
  - Automatic redirect to app after login

- January 22, 2026: Added export/share and child-friendly UI features
  - Export & Share page to download health data as text file or email via SendGrid
  - Child-friendly colorful purple/pink theme when selected patient is under 15 years old
  - UI adapts with kid-friendly language (e.g., "Doctor Visits" instead of "Appointments")
  - Email sharing requires SendGrid integration setup (SENDGRID_API_KEY secret)

- January 22, 2026: Added patient profiles feature
  - Multiple patient profiles per user account (self, children, spouse, parents, etc.)
  - Profile management UI in the profile page with tabs
  - Patient profile selector in app header for switching between profiles
  - Stores medical information: allergies, conditions, medications, blood type, emergency contacts
  - Secure date handling and authorization (userId/isDefault cannot be set by client)
  
- January 22, 2026: Initial MVP implementation
  - Complete frontend with all pages
  - Backend API with PostgreSQL storage
  - OpenAI integration for question generation
  - PWA manifest for installability
