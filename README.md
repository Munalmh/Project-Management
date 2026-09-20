# ProjectHub (Next.js + Tailwind + Shadcn + TypeScript)

This is a modern web application built with [Next.js](https://nextjs.org/), leveraging a robust stack of technologies for optimal performance and developer experience.

## Tech Stack

- **Framework:** Next.js (v16+)
- **Styling:** Tailwind CSS (v4)
- **UI Components:** Shadcn UI (Radix UI primitives)
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Authentication:** Next-Auth
- **State Management:** Zustand & React Query
- **Forms & Validation:** React Hook Form & Zod
- **Animations:** Framer Motion

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- Node.js (v18+)
- npm, yarn, pnpm, or bun (The project uses some `bun` scripts for production starts, but npm is fully supported)
- A database supported by Prisma (e.g., PostgreSQL, MySQL, SQLite)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd projecthub-main
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables:**

   Create a `.env` or `.env.local` file in the root of the project and configure the necessary variables (e.g., Database connection string, Next-Auth secret). Example:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
   NEXTAUTH_SECRET="your-super-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialize the database:**

   Generate the Prisma client and push the schema to your database:
   ```bash
   npm run db:push
   # or
   npm run db:migrate
   ```

5. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Generates the Prisma client and builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code issues.
- `npm run db:push`: Pushes the Prisma schema state to the database.
- `npm run db:generate`: Generates the Prisma Client.
- `npm run db:migrate`: Runs database migrations.
- `npm run db:reset`: Resets the database.
