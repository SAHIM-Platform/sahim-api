<h1>SAHIM API</h1>

SAHIM API is the backend service that powers the SAHIM platform.

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Start Development Server](#start-development-server)

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
   - Important: The database uses port 5433 to avoid conflicts. Make sure your DATABASE_URL uses this port:
     ```
     DATABASE_URL="postgresql://postgres:postgres@localhost:5433/sahim?schema=public"
     ```

4. **Initialize Database**
   ```bash
   pnpm prisma migrate dev
   ```
   This command will:
   - Create the database if it doesn't exist
   - Apply all pending migrations
   - Generate the Prisma Client

   **Troubleshooting:**
      If you encounter database connection issues, ensure:
      - Docker containers are running (`docker compose ps`)
      - No other PostgreSQL instances are using the ports
      - The database credentials in `.env` match those in `docker-compose.yml`

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
   The API will be available at `http://localhost:5000` by default.

   
## Start Development Server

If you've already set up the development environment _(as mentioned in [Getting Started](#getting-started) section)_, follow these steps to run the development server:

1. Start the PostgreSQL database:
   ```bash
   docker compose up -d
   ```

2. Apply any pending database migrations:
   ```bash
   pnpm prisma migrate dev
   ```

3. Start the server in development mode:
   ```bash
   pnpm start:dev
   ```

4. Access the API:
   - Default: `http://localhost:5000`
   - Custom: Use the PORT specified in your `.env` file

Note: Ensure your `.env` file is properly configured before starting the server.