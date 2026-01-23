# HealthPrep - Questions for My Doctor

## Overview

HealthPrep is a Progressive Web Application (PWA) that helps patients prepare for doctor visits. The app generates AI-powered questions based on health conditions, symptoms, and medications. Core features include patient profile management, appointment scheduling, symptom tracking, health readings logging, and nearby healthcare service discovery.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack Query for server state, React Context for local state (patient profiles, theme)
- **UI Components**: Shadcn UI built on Radix primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js, session storage in PostgreSQL
- **Security**: Helmet for headers, rate limiting on API routes (100 req/15min general, 20 req/15min for auth)
- **AI Integration**: OpenAI via Replit AI Integrations for question generation

### Data Storage
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` for main tables, `shared/models/` for auth and chat models
- **Offline Storage**: IndexedDB for client-side caching with automatic sync
- **Session Storage**: PostgreSQL via connect-pg-simple

### Key Design Patterns
- **Shared Types**: Schema definitions in `shared/` directory used by both client and server
- **API Structure**: RESTful endpoints under `/api/` with JSON responses
- **Validation**: Zod schemas for both client forms and server request validation
- **Security**: Input sanitization, ID validation middleware, XSS prevention via validator library

### PWA Features
- Service worker for offline caching (`client/public/sw.js`)
- Web manifest for installability
- IndexedDB-based offline data with pending sync queue
- Automatic update notifications

## External Dependencies

### Third-Party Services
- **OpenAI API**: AI question generation via Replit AI Integrations (gpt-4.1 model)
- **Overpass API**: Location-based search for nearby pharmacies, GPs, dentists, hospitals

### Database
- **PostgreSQL**: Primary data store, provisioned via Replit
- **Connection**: `DATABASE_URL` environment variable required

### Authentication
- **Replit Auth**: OpenID Connect provider supporting Google, GitHub, Apple, email/password
- **Session Secret**: `SESSION_SECRET` environment variable required

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI base URL
- `ISSUER_URL` - OIDC issuer (defaults to Replit)
- `REPL_ID` - Replit environment identifier

## GitHub Pages Deployment (Static Client)

This app includes a full Express backend, but GitHub Pages can only host static files. Use the client-only build when publishing to GitHub Pages.

1. Decide your GitHub Pages base path:
   - User/organization site: `/`
   - Project site: `/<repo-name>/`
2. Build the static client with the base path:
   ```bash
   GITHUB_PAGES_BASE="/<repo-name>/" npm run build:pages
   ```
3. Deploy the generated `dist/` folder to GitHub Pages (e.g., `gh-pages` branch or `/docs` depending on your repo settings).
