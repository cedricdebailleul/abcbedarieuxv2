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
- **Email**: Nodemailer integration with advanced newsletter system

### Project Structure
```
app/
├── (auth)/          # Authentication pages (login, register, verify)
├── (dashboard)/     # Protected dashboard area with sidebar
│   └── admin/
│       └── newsletter/  # Newsletter administration interface
├── (front)/         # Public front-end pages
│   └── newsletter/  # Public newsletter pages (subscribe, unsubscribe, verify)
├── api/             # API routes
│   ├── newsletter/  # Public newsletter APIs (tracking, web-view)
│   └── admin/
│       └── newsletter/  # Admin newsletter APIs (campaigns, subscribers)
└── onboarding/      # User onboarding flow

components/
├── ui/              # shadcn/ui components
├── forms/           # Form components
├── layout/          # Layout components (header, sidebar)
├── providers/       # Context providers
├── rgpd/            # GDPR/privacy components
└── admin/newsletter/ # Newsletter admin components

lib/
├── auth.ts          # Better Auth configuration
├── prisma.ts        # Prisma client
├── env.ts           # Environment variables (T3 Env)
├── email.ts         # Email template system
└── generated/prisma/ # Generated Prisma client

public/uploads/newsletter/ # Newsletter attachment storage
```

### Database Schema
The application uses a comprehensive system with:
- **Users**: Core user data with roles (user, admin, moderator)
- **Authentication**: Sessions, accounts, email verification
- **Profiles**: Extended user information with social links
- **Badges**: User achievement system
- **GDPR Compliance**: User consent tracking and data requests
- **Newsletter System**: Comprehensive email marketing infrastructure

#### Newsletter Database Schema
- **NewsletterSubscriber**: Subscriber management with preferences and status
- **NewsletterCampaign**: Campaign storage with content, scheduling, and statistics
- **NewsletterCampaignSent**: Individual email delivery tracking
- **NewsletterAttachment**: File attachment system for campaigns
- **NewsletterQueue**: Email queue management for bulk sending
- **NewsletterPreferences**: Subscriber preferences and frequency settings

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
- Email configuration (SMTP/Nodemailer)
- AWS/S3 settings
- Google Maps API keys
- GDPR compliance settings
- Newsletter tracking and base URLs

## Newsletter System

### Core Features
- **Campaign Management**: Full CRUD operations for newsletter campaigns
- **Content Selection**: Dynamic content from events, places, and posts
- **Email Tracking**: Advanced tracking system with Gmail compatibility workarounds
- **Bulk Operations**: Multi-select and bulk delete with admin force option
- **Templates**: Rich HTML email templates with responsive design
- **Scheduling**: Campaign scheduling and queue management
- **Attachments**: File upload support for campaign attachments
- **Admin Controls**: Role-based permissions with force delete for admins

### Campaign Management System

#### Campaign Types
- `NEWSLETTER` - Regular newsletter
- `ANNOUNCEMENT` - Important announcements
- `EVENT_DIGEST` - Event summaries
- `PLACE_UPDATE` - Business/place updates
- `PROMOTIONAL` - Marketing campaigns

#### Campaign Status Flow
- `DRAFT` - Being created/edited
- `SCHEDULED` - Scheduled for sending
- `SENDING` - Currently being sent
- `SENT` - Successfully sent
- `CANCELLED` - Cancelled before/during sending
- `ERROR` - Failed to send

#### CRUD Operations
- **Create**: Campaign creation with content selection
- **Read**: Campaign listing with filtering and search
- **Update**: Full campaign editing interface
- **Delete**: Individual and bulk deletion with safety checks
- **Force Delete**: Admin-only forced deletion of sent campaigns

### API Endpoints

#### Admin Newsletter APIs
- `GET/POST /api/admin/newsletter/campaigns` - Campaign management
- `GET/PUT/DELETE /api/admin/newsletter/campaigns/[id]` - Individual campaign operations
- `POST /api/admin/newsletter/campaigns/[id]/send` - Send campaign
- `POST /api/admin/newsletter/campaigns/[id]/duplicate` - Duplicate campaign
- `GET /api/admin/newsletter/campaigns/[id]/stats` - Campaign statistics
- `DELETE /api/admin/newsletter/campaigns/bulk-delete` - Bulk campaign deletion
- `POST /api/admin/newsletter/campaigns/fix-stuck` - Fix stuck campaigns
- `GET/POST/DELETE /api/admin/newsletter/subscribers` - Subscriber management
- `DELETE /api/admin/newsletter/subscribers/bulk` - Bulk subscriber operations
- `GET /api/admin/newsletter/subscribers/export` - Export subscribers
- `POST /api/admin/newsletter/attachments/upload` - File upload
- `GET /api/admin/newsletter/content/available` - Available content for campaigns
- `GET /api/admin/newsletter/queue/status` - Queue status monitoring
- `POST /api/admin/newsletter/send-test-email` - Send test emails

#### Public Newsletter APIs
- `POST /api/newsletter/subscribe` - Newsletter subscription
- `POST /api/newsletter/unsubscribe` - Unsubscribe from newsletter
- `POST /api/newsletter/verify` - Email verification
- `GET /api/newsletter/web-view` - Browser view for emails
- `GET /api/newsletter/track/open` - Open tracking pixel
- `GET /api/newsletter/track/click` - Click tracking redirect
- `GET /api/newsletter/view/[campaignId]/[subscriberId]` - Individual email view
- `POST /api/newsletter/gdpr` - GDPR data requests

### Email Tracking System

#### Multiple Tracking Methods
The system implements several tracking approaches to overcome email client limitations:

1. **Primary Tracking Pixel**: 1x1 transparent GIF image
2. **CSS Background Tracking**: Fallback CSS-based tracking
3. **Timestamp Variants**: Multiple pixel URLs with different parameters
4. **Web View Tracking**: Reliable browser-based tracking
5. **Click Tracking**: URL wrapping for link clicks

#### Gmail Compatibility Solutions
Gmail blocks images and uses proxy servers, requiring special handling:

- **Multiple Pixel Variations**: Different tracking URLs to bypass caching
- **CSS Background Fallback**: Alternative tracking via CSS background images
- **Web View Alternative**: "View in browser" link for reliable tracking
- **Click-Based Detection**: Marking as opened when any link is clicked
- **Environment Detection**: Different handling for localhost vs production

#### Tracking Reliability
- **Click Tracking**: 100% reliable across all email clients
- **Open Tracking (Gmail)**: 30-60% visibility due to privacy protections
- **Open Tracking (Other Clients)**: 70-90% visibility
- **Web View**: 100% reliable tracking when used

### UI Components and Features

#### Admin Interface Components
- **CampaignStatsLive**: Real-time campaign statistics with live updates
- **ContentSelector**: Dynamic content selection from events, places, posts
- **NewsletterPreview**: Live email preview with template rendering
- **AttachmentManager**: File upload and management interface
- **QueueStatus**: Email queue monitoring and status display
- **Bulk Selection**: Multi-campaign selection with checkboxes
- **Force Delete Button**: Admin-only red-styled force deletion

#### Campaign Management Interface
- **Campaign List**: Filterable list with status indicators
- **Dropdown Actions**: Context menus for campaign operations
- **Edit Interface**: Full campaign editing with content selection
- **Statistics Dashboard**: Detailed analytics and performance metrics
- **Bulk Actions**: Multi-select operations with safety confirmations

#### Security Features
- **Role-Based Access**: Admin/moderator permissions for sensitive operations
- **Force Delete Protection**: Admin-only forced deletion of sent campaigns
- **Transaction Safety**: Database operations wrapped in transactions
- **Status Validation**: Prevents deletion of campaigns in sending state
- **Audit Logging**: Comprehensive logging of admin actions

### Technical Implementation Details

#### Email Template System
- **Responsive Design**: Mobile-first email templates
- **Dynamic Content**: Content injection from database
- **Attachment Support**: File attachment handling and display
- **Tracking Integration**: Embedded tracking pixels and wrapped links
- **Unsubscribe Compliance**: GDPR-compliant unsubscribe mechanisms

#### Queue Management
- **Bulk Sending**: Efficient batch processing for large subscriber lists
- **Rate Limiting**: Configurable sending rates to avoid spam filters
- **Error Handling**: Comprehensive error tracking and retry mechanisms
- **Status Monitoring**: Real-time queue status and progress tracking
- **Stuck Campaign Recovery**: Automatic and manual recovery options

#### File Upload System
- **Attachment Support**: PDF, images, and document uploads
- **File Validation**: Size and type restrictions
- **Secure Storage**: Protected file storage with access controls
- **URL Generation**: Dynamic attachment URLs for email inclusion

### Troubleshooting and Known Issues

#### Gmail Tracking Limitations
Gmail's privacy features can affect tracking accuracy:
- Images are blocked by default
- Proxy servers cache tracking pixels
- Multiple pixel strategy partially mitigates this
- Web view provides reliable alternative
- Click tracking remains 100% accurate

#### Performance Considerations
- Large subscriber lists may require queue processing
- File attachments increase email size and sending time
- Database indexes optimize campaign and subscriber queries
- Bulk operations use transactions for data consistency

#### Security and Compliance
- GDPR-compliant subscription and unsubscribe processes
- Double opt-in email verification
- Secure unsubscribe token generation
- Data retention and cleanup procedures
- Admin action logging and auditing

## Key Features
- GDPR compliant with cookie consent and data request handling
- User badge/achievement system
- Email notifications and OTP verification
- Responsive design with theme support
- Data export and cleanup utilities
- Comprehensive newsletter marketing system
- Advanced email tracking with Gmail compatibility
- Role-based administration interface
- Real-time campaign analytics and monitoring

## Important Notes
- Prisma client is generated to `lib/generated/prisma` (non-standard location)
- Uses pnpm workspace configuration
- Includes Docker Compose setup
- Custom GDPR cleanup script for data retention compliance
- Site is configured for "ABC Bédarieux" local business directory
- Newsletter tracking uses multiple methods due to Gmail privacy features
- Force deletion feature requires admin role and should be used with caution
- Environment-based URL detection handles localhost vs production tracking URLs