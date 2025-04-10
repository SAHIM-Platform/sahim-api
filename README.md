<h1>SAHIM API</h1>

SAHIM API is the backend service that powers the SAHIM platform.

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Start Development Server](#start-development-server)
- [**Accessing the Database**](#accessing-the-database)
  - [**5. Exit the Database Session**](#5-exit-the-database-session)
- [API Documentation](#api-documentation)
  - [Runtime Documentation](#runtime-documentation)
  - [Static Documentation](#static-documentation)
- [Troubleshooting](#troubleshooting)
  - [1. Database Connection Issues](#1-database-connection-issues)

---

## Prerequisites

- Node.js (v20 or higher)
- pnpm (v10 or higher)
- Docker

---

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

5. **Ensure the `CHECK` Constraint is Applied**

   Prisma does not support `CHECK` constraints, so follow this step to manually enforce it:

   - First, access the database (see [Accessing the Database](#accessing-the-database)).
   - Then run the following SQL command (Use shift+insert or ctrl+shift-v to paste):

   ```sql
   ALTER TABLE "Student"
   ADD CONSTRAINT study_level_check CHECK ("studyLevel" >= 1 AND "studyLevel" <= 5);
   ```

   This ensures that **`studyLevel` is always between 1 and 5**.

   ✅ **To verify the constraint is applied**, run:

   ```sh
   \d+ "Student"
   ```

   **You should see:**

   ```
   Check constraints:
      "study_level_check" CHECK ("studyLevel" >= 1 AND "studyLevel" <= 5)
   ```

6. **Initialize Storage**

   ```bash
   pnpm init:storage
   ```

   This will:

   - Create a `storage` directory in the root with its sub directories and files.
   - Generate JWT keys into [`keys/`](./storage/keys/) for authentication

7. **Start Development Server**
   ```bash
   pnpm start:dev
   ```
   The API will be available at `http://localhost:5000` by default.

---

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

---

## **Accessing the Database**

If you need to connect to the PostgreSQL database running inside Docker, follow these steps:

**1. Identify the Running Database Container**
First, list all running Docker containers to find the database container ID:

```bash
docker ps
```

This will display a list of running containers. Look for the **CONTAINER ID** associated with your PostgreSQL instance.

**2. Connect to the Database**
Once you have the correct **CONTAINER ID**, use it in the following command to enter the PostgreSQL interactive shell:

```bash
docker exec -it <container_id> psql -U postgres -d sahim
```

> Replace `<container_id>` with the actual ID from **Step 1**.

**3. Verify Connection**
After running the above command, you should see the PostgreSQL prompt:

```sql
sahim=#
```

From here, you can run SQL commands to interact with your database.

> Tip: sse `Shift + Insert` or `Ctrl + Shift + V` to paste commands in the terminal.

**4. List Available Tables** _(Optional)_
To check if your database has been set up correctly, run:

```sql
\dt
```

This will display all tables in the current schema.

### **5. Exit the Database Session**

When you're done, type:

```sql
\q
```

or press `Ctrl + D` to exit.

---

## API Documentation

SAHIM API provides two ways to access the Swagger documentation:

### Runtime Documentation

When running the development server, you can access the interactive Swagger UI at:

```
http://localhost:5000/docs
```

> Replace `5000` with your PORT.

This provides real-time documentation of all available API endpoints, request/response schemas, and authentication requirements.

### Static Documentation

For offline access or sharing with team members, you can generate static documentation:

1. Generate the static documentation files:

   ```bash
   pnpm generate:docs
   ```

2. The documentation will be generated in the `docs/__GENERATED__/` directory:
   - `swagger.json` - OpenAPI specification in JSON format _(git ignored)_
   - `swagger.yaml` - OpenAPI specification in YAML format _(git ignored)_
   - `index.html` - Interactive documentation viewer

3. Open `docs/__GENERATED__/index.html` in your browser to view the static documentation.

> **Note:** The static documentation is manually generated but does not require the server to be running.

---

## Troubleshooting

### 1. Database Connection Issues

If you encounter database connection problems:

- Verify Docker containers are running: `docker compose ps`
- Check for conflicting PostgreSQL instances on the same port
- Ensure `.env` credentials match `docker-compose.yml`

> **Note:** Always configure your `.env` file correctly before server startup.

> **Important:** The database uses port 5433 to prevent conflicts. Verify your `DATABASE_URL` in `.env`:
>
> ```
> DATABASE_URL="postgresql://postgres:postgres@localhost:5433/sahim?schema=public"
> ```
