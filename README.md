ReachInbox Email Scheduler

A full-stack email scheduling application inspired by ReachInbox, with Google authentication, email composition, scheduled delivery, persistent storage, background job processing, rate limiting, concurrency control, and separate Scheduled and Sent email views.

Tech Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
Backend
Node.js
Express
TypeScript
Prisma ORM
PostgreSQL
Redis
BullMQ
Passport.js / Google OAuth
Nodemailer
Elasticsearch
Deployment
Vercel for the deployed application
PostgreSQL for persistent application data
Redis for BullMQ job processing
Features Implemented
Backend
Email Scheduler
Creates and persists scheduled emails.
Creates BullMQ jobs for scheduled delivery.
Worker processes scheduled email jobs asynchronously.
Supports immediate and future email delivery.
Persistence
Email and sender information is stored in PostgreSQL through Prisma.
Scheduled emails remain persisted across backend/worker restarts.
BullMQ with Redis handles background job processing.
A restarted worker can continue processing scheduled jobs.
Rate Limiting
Supports configurable hourly email limits.
Supports per-sender hourly limits.
Prevents emails from exceeding configured sending limits.
Emails that cannot currently be sent because of the hourly limit are delayed/rescheduled.
Concurrency
BullMQ worker supports configurable job concurrency.
Multiple email jobs can be processed concurrently according to the configured worker limit.
Minimum Send Delay
Configurable delay between email sends to control sending throughput.
Email Sending
Uses Nodemailer and the configured email transport.
Successfully processed jobs are marked as sent.
Authentication
Google OAuth authentication using Passport.js.
Session-based authentication for protected application functionality.
Queue Monitoring
BullMQ queue dashboard is available through the backend for monitoring queued jobs.
Health Check
Backend exposes a health endpoint for checking API availability.
Frontend
Google authentication/login flow.
ReachInbox-style dashboard.
Email composition interface.
Schedule emails for future delivery.
Scheduled emails table.
Sent emails table.
Email status tracking.
Search/filter functionality.
Sender management.
Delete sender functionality.
Responsive application interface.
Dashboard counters for Scheduled and Sent emails.
Architecture Overview
                    ┌─────────────────────┐
                    │      Frontend       │
                    │ React + TypeScript  │
                    │       Vite          │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │       Express       │
                    │      Backend        │
                    └──────┬──────┬───────┘
                           │      │
                  ┌────────┘      └─────────┐
                  ▼                         ▼
          ┌──────────────┐          ┌──────────────┐
          │ PostgreSQL   │          │    Redis     │
          │   Prisma     │          │   BullMQ     │
          └──────────────┘          └──────┬───────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ Email Worker    │
                                  │ Async Delivery  │
                                  └────────┬────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ Email Provider  │
                                  │   / SMTP        │
                                  └─────────────────┘
How Scheduling Works
The user logs in and composes an email from the frontend.
The frontend sends the email and scheduling information to the Express backend.
The backend validates the request and persists the email in PostgreSQL.
A BullMQ job is created with the required execution time.
Redis stores the queue state used by BullMQ.
The email worker consumes the job when it becomes ready.
Before sending, the worker applies the configured rate limits and sending delay.
The worker sends the email through the configured SMTP/email transport.
After successful delivery, the email is marked as sent and becomes visible in the Sent dashboard.
Persistence on Restart

Scheduling information is persisted in PostgreSQL instead of relying only on application memory.

BullMQ uses Redis for background job management. The worker processes persisted queue jobs independently from the frontend.

Because the email record and scheduling state are persisted, restarting the backend or worker does not intentionally remove the scheduled email. Once the worker is running again, it can continue processing scheduled jobs.

Rate Limiting and Delay

The worker supports configurable sending controls, including:

Maximum emails per hour
Maximum emails per hour per sender
Minimum delay between sends
Worker concurrency

When a sender reaches the configured hourly limit, the email job is delayed/rescheduled rather than being immediately sent.

These controls help prevent excessive sending and regulate email throughput.

Concurrency

BullMQ Worker concurrency is configurable through the backend configuration.

This allows multiple jobs to be processed concurrently while still respecting the application's rate-limiting and delay rules.

Environment Variables

Create a .env file inside the backend directory.

Example:

DATABASE_URL="your_postgresql_connection_string"
REDIS_URL="redis://127.0.0.1:6379"

SESSION_SECRET="your_session_secret"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="your_google_callback_url"

SMTP_HOST="your_smtp_host"
SMTP_PORT="your_smtp_port"
SMTP_USER="your_smtp_username"
SMTP_PASS="your_smtp_password"

WORKER_CONCURRENCY=5
MIN_SEND_DELAY_MS=1000
MAX_EMAILS_PER_HOUR=50
MAX_EMAILS_PER_HOUR_PER_SENDER=50

Use the actual variable names and values required by the project configuration.

Never commit the .env file or secrets to GitHub.

Ethereal Email Setup

Ethereal Email can be used as a test SMTP service for development and demonstration.

Create an Ethereal test account.
Obtain the SMTP credentials provided by Ethereal.
Add the SMTP host, port, username, and password to the backend .env file.
Start the backend and worker.
Send or schedule an email from the application.
Use the Ethereal preview URL to inspect test emails when using the Ethereal transport.

Example SMTP configuration:

SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="your_ethereal_username"
SMTP_PASS="your_ethereal_password"
Prerequisites

Install:

Node.js
npm
PostgreSQL
Redis

Git is also required to clone the repository.

Project Structure
reachinbox-email-scheduler/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── integrations/
│   │   ├── queues/
│   │   ├── routes/
│   │   ├── workers/
│   │   └── ...
│   ├── prisma/
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── docker-compose.yml
├── package.json
├── package-lock.json
├── vercel.json
└── README.md
How to Run Locally
1. Clone the repository
git clone https://github.com/mananmarwah19/reachinbox-email-scheduler.git
cd reachinbox-email-scheduler
2. Install dependencies

Install backend dependencies:

cd backend
npm install

Install frontend dependencies:

cd ../frontend
npm install
3. Start PostgreSQL and Redis

The project includes Docker configuration for the required services.

From the project root:

docker compose up -d

Make sure PostgreSQL and Redis are running before starting the backend.

4. Configure backend environment variables

Create:

backend/.env

Add the required database, Redis, authentication, SMTP, and worker configuration values.

5. Run database migrations

From backend:

npx prisma migrate deploy

If generating the Prisma client is required:

npx prisma generate
6. Start the backend

From:

backend/

run:

npm run dev
7. Start the BullMQ worker

Open another terminal:

cd backend
npm run worker

The worker must remain running for scheduled email jobs to be processed.

8. Start the frontend

Open another terminal:

cd frontend
npm run dev

Open the Vite URL shown by the terminal, normally:

http://localhost:5173
Running the Application

The complete local flow is:

Login with Google
       ↓
Open Dashboard
       ↓
Compose Email
       ↓
Select Schedule Time
       ↓
Persist Email
       ↓
Create BullMQ Job
       ↓
Redis Queue
       ↓
BullMQ Worker
       ↓
Rate Limit / Delay / Concurrency Checks
       ↓
Send Email
       ↓
Mark Email as Sent
       ↓
Sent Dashboard
Restart Persistence Flow

To verify persistence:

Start PostgreSQL and Redis.
Start the backend.
Start the BullMQ worker.
Schedule an email for a future time.
Confirm that it appears in Scheduled.
Stop the backend/worker.
Start the backend/worker again.
Refresh the application.
Confirm that the scheduled email remains persisted.
Allow the scheduled time to arrive.
Confirm that the worker processes the job.
Confirm that the email appears in Sent.
Assumptions, Shortcuts and Trade-offs
The application is intended as an email scheduling assignment/demo rather than a production-scale email delivery platform.
SMTP credentials and other secrets are provided through environment variables and are not committed to the repository.
Redis and PostgreSQL are treated as available infrastructure for local development.
Rate limits and worker concurrency are configurable rather than hard-coded to a single production configuration.
The email transport can be configured for testing using Ethereal Email.
The frontend and backend can be deployed separately while the repository is maintained as a monorepo.
BullMQ and Redis are used to keep email processing asynchronous and separate from the API request lifecycle.
Demo

The demo video demonstrates:

Google authentication.
Dashboard and email status views.
Creating and scheduling an email.
Viewing the email in Scheduled.
Restarting the backend/worker.
Confirming that the scheduled email persists after restart.
Processing and sending the scheduled email.
Viewing the email in Sent.
Brief overview of scheduling, persistence, rate limiting, and concurrency.
Security
Environment secrets are stored in .env.
.env files are excluded from Git using .gitignore.
Authentication is handled through Google OAuth.
Sessions are used for authenticated requests.
Do not expose SMTP credentials, Google OAuth secrets, database credentials, or session secrets publicly.
Submission Repository

GitHub repository:

https://github.com/mananmarwah19/reachinbox-email-scheduler
