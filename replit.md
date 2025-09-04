# StoicKegs - Keg Management System

## Overview

StoicKegs is a comprehensive keg management application designed for breweries to track their keg inventory, monitor status changes, and manage customer relationships. The system provides real-time visibility into keg locations, status updates, and fleet analytics through a mobile-first interface.

## User Preferences

Preferred communication style: Simple, everyday language.
Beer types: Focuses on fruit flavors - Prickly Pear, Peach, Apple, and Rhubarb.
Inventory size: Uses small inventory of 5 kegs for easier management and testing.
Keg ID format: Four-character numeric IDs (K-1234) for shorter, more manageable identifiers.

## Recent Changes (August 31, 2025)

### Complete Cider Terminology Update
- **Terminology Change**: Successfully changed all "beer" references to "cider" throughout the entire application
- **Database Schema**: Updated beer_types → cider_types, beer_batches → cider_batches, beer_ingredients → cider_ingredients
- **API Endpoints**: Changed all /api/beer-* routes to /api/cider-* routes
- **Frontend Components**: Updated all UI text, labels, forms, and navigation to use cider terminology
- **Type System**: Updated all TypeScript types and imports to use cider-focused naming

### Batch Scanner Implementation
- **Multi-Keg Processing**: Implemented batch scanning functionality to process multiple kegs simultaneously
- **Global Settings**: Added ability to apply common settings (status, location, customer) to all scanned kegs
- **QR Scanner Integration**: Continuous QR code scanning with manual entry fallback
- **Batch Operations**: Process multiple keg status changes in a single operation
- **Mobile Optimized**: Camera integration works on iOS Safari with proper user gesture requirements
- **Keg ID Format**: Updated to four-character numeric IDs (K-1234) for shorter identifiers

### Fermentation Management System  
- **Comprehensive Tracking**: Full fermentation batch management with detailed chemical and process tracking
- **Detailed Fields**: Fermentation ID, date, volume, incoming juice details, brix, ABV, sulfite additions, yeast strains, pH, titratable acidity, copper sulfate, racking dates, and notes
- **Editable Interface**: Complete CRUD operations with intuitive form-based editing for all fermentation parameters
- **Navigation Integration**: Added Fermentation tab to bottom navigation for easy access to fermentation workflow
- **Chemical Tracking**: Precise measurement tracking for sulfites (grams), yeast weight (grams), copper sulfate (ml), and chemical analysis values

### Complete Cider Type Management System
- **Cider Type CRUD**: Full create, read, update, delete operations for cider types with names, descriptions, styles, ABV, IBU, and SRM values
- **Batch Tracking**: Each cider type can have multiple batches with brew dates, package dates, volumes, and status tracking
- **Ingredient Management**: Detailed ingredient tracking per batch including liquid ingredients, juices, sugar, and production notes
- **Navigation Integration**: Added Cider Types to bottom navigation for easy access
- **Three-Panel Interface**: Side-by-side view of cider types, their batches, and batch details for efficient management

### Enhanced "Add Keg" Functionality (August 14, 2025)
- **Bulk Keg Creation**: Updated Add Keg modal to support quantity input (1-50 kegs)
- **Automatic ID Generation**: Each keg gets unique K-xxxxxxxx ID and SKxxxxxxxx QR code
- **PDF Export**: Direct export of QR codes from creation modal for immediate printing
- **Smart Validation**: Maintains business rule that clean kegs cannot have beer types

### QR Code Integration
- **Scanner Integration**: QR scanner opens keg details modal when existing keg is found
- **Bulk Export**: Inventory page includes "Export All QR Codes" button for filtered kegs
- **Mobile-First Design**: Camera integration works properly on iOS Safari with required user gestures

### PDF Export System
- **QR Code Labels**: Professional PDF generation with 2x3 grid layout
- **Keg Information**: Each label includes QR code, keg ID, and scannable code text
- **Batch Processing**: Supports exporting multiple kegs with progress handling

## System Architecture

### Frontend Architecture
**React SPA with TypeScript**: Modern single-page application built with React 18, TypeScript, and Vite for fast development and optimized builds.

**Component Design System**: Utilizes shadcn/ui components with Radix UI primitives for accessibility and consistency. The design system includes custom CSS variables for theming and a mobile-first responsive design.

**State Management**: Implements TanStack Query (React Query) for server state management, providing caching, background updates, and optimistic updates for improved user experience.

**Routing**: Uses Wouter for lightweight client-side routing with pages for Dashboard, Inventory, Customers, Beer Types, and Reports.

**Mobile-First UI**: Designed specifically for mobile devices with bottom navigation, responsive cards, and touch-friendly interactions.

### Backend Architecture
**Express.js Server**: RESTful API server built with Express.js and TypeScript, providing endpoints for keg management, customer operations, and analytics.

**In-Memory Storage**: Currently uses a memory-based storage implementation (`MemStorage`) that implements the `IStorage` interface, allowing for easy migration to persistent databases later.

**API Design**: RESTful endpoints following standard conventions:
- `/api/kegs` - Keg operations (CRUD, status updates, QR lookup)
- `/api/customers` - Customer management
- `/api/activities` - Activity tracking and history
- `/api/analytics` - Fleet statistics and reporting
- `/api/beer-types` - Beer type management and recipes
- `/api/beer-batches` - Batch tracking and production management
- `/api/beer-ingredients` - Ingredient management per batch

### Data Storage Architecture
**Schema-First Design**: Uses Drizzle ORM with PostgreSQL schema definitions in the shared directory, providing type safety across the full stack.

**Database Models**:
- **Kegs**: Tracks keg ID, QR code, size, status, location, beer type, and timestamps
- **Customers**: Manages customer information and contact details
- **Activities**: Logs all keg status changes and movements for audit trails
- **Beer Types**: Stores beer type information including name, description, style, ABV, IBU, SRM values
- **Beer Batches**: Tracks individual batches per beer type with brew dates, volumes, and production status
- **Beer Ingredients**: Detailed ingredient tracking per batch with quantities, types, and supplier information

**Migration Support**: Configured with Drizzle Kit for database migrations and schema management.

### Shared Type System
**TypeScript Schemas**: Shared schema definitions between frontend and backend using Drizzle-Zod for runtime validation and type generation.

**Type Safety**: End-to-end type safety from database schema to React components, reducing runtime errors and improving developer experience.

### Build System
**Vite Configuration**: Modern build tooling with Vite providing fast development server, hot module replacement, and optimized production builds.

**Monorepo Structure**: Organized with client, server, and shared directories for clear separation of concerns while maintaining code sharing.

**Development Tools**: Includes TypeScript checking, PostCSS for Tailwind processing, and development-specific tooling for Replit integration.

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL database service (`@neondatabase/serverless`)
- **Drizzle ORM**: Type-safe database ORM for PostgreSQL operations
- **Connection Pooling**: Uses `connect-pg-simple` for session management

### UI Framework
- **Radix UI**: Comprehensive component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds

### Utility Libraries
- **React Hook Form**: Form state management with validation
- **Date-fns**: Date manipulation and formatting
- **Zod**: Schema validation for runtime type checking
- **Class Variance Authority**: Utility for managing CSS class variants

### Replit Integration
- **Replit Plugins**: Development environment integration with cartographer and runtime error overlay
- **Replit Banner**: Development mode banner for external access