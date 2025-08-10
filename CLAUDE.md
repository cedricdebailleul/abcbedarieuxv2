# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production application
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm type-check` - Run TypeScript type checking

### Database Operations
- `pnpm db:push` - Push Prisma schema to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:studio` - Launch Prisma Studio
- `pnpm db:seed` - Seed database with initial data
- `pnpm db:reset` - Reset database and run migrations

### Testing
- `pnpm test` - Run Jest tests
- `pnpm test:watch` - Run Jest in watch mode
- `pnpm test:coverage` - Run tests with coverage report

### Setup & Deployment
- `pnpm dev:setup` - Run development setup script
- `pnpm deploy` - Deploy application
- `pnpm cleanup-gdpr` - Run GDPR cleanup script

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with email/password and OAuth (GitHub, Google)
- **UI**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **Animation**: Framer Motion and GSAP
- **State Management**: React Hook Form with Zod validation
- **Email**: Nodemailer integration

### Project Structure
```
app/
├── (auth)/          # Authentication pages (login, register, verify)
├── (dashboard)/     # Protected dashboard area with sidebar
├── (front)/         # Public front-end pages
├── api/             # API routes
└── onboarding/      # User onboarding flow

components/
├── ui/              # shadcn/ui components
├── forms/           # Form components
├── layout/          # Layout components (header, sidebar)
├── providers/       # Context providers
└── rgpd/            # GDPR/privacy components

lib/
├── auth.ts          # Better Auth configuration
├── prisma.ts        # Prisma client
├── env.ts           # Environment variables (T3 Env)
└── generated/prisma/ # Generated Prisma client
```

### Database Schema
The application uses a comprehensive user management system with:
- **Users**: Core user data with roles (user, admin, moderator)
- **Authentication**: Sessions, accounts, email verification
- **Profiles**: Extended user information with social links
- **Badges**: User achievement system
- **GDPR Compliance**: User consent tracking and data requests

### Authentication System
- Uses Better Auth with Prisma adapter
- Supports email/password and OAuth (GitHub, Google)
- Email verification required
- Magic link and OTP email support
- Admin plugin enabled
- Custom Prisma client location: `lib/generated/prisma`

### Route Groups
- `(auth)` - Authentication pages with minimal layout
- `(dashboard)` - Protected area with sidebar navigation
- `(front)` - Public pages with header and main content wrapper

### Environment Configuration
Environment variables are strongly typed using T3 Env with Zod validation. Required variables include:
- Database, authentication secrets
- OAuth provider credentials
- Email configuration
- AWS/S3 settings
- Google Maps API keys
- GDPR compliance settings

### Key Features
- GDPR compliant with cookie consent and data request handling
- User badge/achievement system
- Email notifications and OTP verification
- Responsive design with theme support
- Data export and cleanup utilities

## Important Notes
- Prisma client is generated to `lib/generated/prisma` (non-standard location)
- Uses pnpm workspace configuration
- Includes Docker Compose setup
- Custom GDPR cleanup script for data retention compliance
- Site is configured for "ABC Bédarieux" local business directory