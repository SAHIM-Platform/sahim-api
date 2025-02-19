# SAHIM API

SAHIM API is the backend service that powers the SAHIM platform.

## Prerequisites

- Node.js (v20 or higher)
- pnpm (v10 or higher)
- Docker

## Getting Started

Follow these steps to set up your development environment:

1. **Install Dependencies**
   ```bash
   pnpm i
   ```

2. **Set Up Docker Environment**
   ```bash
   docker compose up
   ```
   This will set up necessary services like the database.

3. **Configure Environment Variables**
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and update the variables according to your setup

4. **Initialize Database**
   ```bash
   pnpm prisma migrate dev
   ```
   This command will:
   - Create the database if it doesn't exist
   - Apply all pending migrations
   - Generate the Prisma Client

5. **Initialize Storage**
   ```bash
   pnpm init:storage
   ```
   This will:
   - Create a `storage` directory in the root with its sub directories and files.
   - Generate JWT keys into [`keys/`](./storage/keys/) for authentication

6. **Start Development Server**
   ```bash
   pnpm start:dev
   ```
   The API will be available at `http://localhost:3001` by default.