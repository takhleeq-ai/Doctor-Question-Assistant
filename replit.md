# HealthPrep - Questions for My Doctor

## Overview
HealthPrep is a comprehensive health tracking Progressive Web Application (PWA) that helps patients prepare for doctor visits. It generates AI-powered questions based on conditions, symptoms, and medications, while also tracking health data between appointments.

## Current State
The MVP is fully implemented with all core features functional.

## Features
- **Questions Generator**: AI-powered generation of structured questions to ask doctors, with red flags identification
- **Appointments Manager**: Schedule and manage doctor appointments with reminder settings
- **Symptom Tracker**: Log symptoms with severity ratings (1-10 scale)
- **Health Readings**: Track blood pressure, glucose, temperature, weight, heart rate, and oxygen saturation
- **Timeline View**: Chronological view of all health data
- **Reminders**: Customizable periodic reminders for logging readings (hourly to weekly intervals)
- **PWA Support**: Installable web app with offline-capable manifest

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
- `GET/POST /api/appointments` - Manage appointments
- `GET/POST /api/symptoms` - Track symptoms
- `GET/POST /api/readings` - Log health readings
- `GET/POST /api/reminders` - Configure reminders
- `POST /api/questions/generate` - Generate AI questions
- `GET /api/questions` - Retrieve saved question sets

## Design
- Healthcare-themed teal/blue color palette
- Responsive design for desktop, tablet, and mobile
- Dark mode support
- Accessible components using Shadcn UI

## Recent Changes
- January 22, 2026: Initial MVP implementation
  - Complete frontend with all pages
  - Backend API with PostgreSQL storage
  - OpenAI integration for question generation
  - PWA manifest for installability
