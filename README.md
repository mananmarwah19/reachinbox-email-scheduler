# ReachInbox Email Scheduler

A full-stack **email scheduling application** inspired by ReachInbox, supporting Google authentication, email composition, scheduled delivery, persistent storage, background processing, rate limiting, concurrency control, and separate Scheduled and Sent email views.

---

## 🔗 Links

- **GitHub Repository:** https://github.com/mananmarwah19/reachinbox-email-scheduler
- **Live Deployment:** https://reachinbox-email-scheduler-firys29sb.vercel.app/
- **Demo Video:** https://drive.google.com/file/d/1yIouRtwShS-_5dxATycVhtHnBAgnyVna/view?usp=sharing

---

## 🚀 Features

### Backend

- **Email Scheduler**
  - Create and schedule emails for a future date and time.
  - Persist scheduled emails before processing.
  - Process scheduled emails asynchronously using **BullMQ** and **Redis**.
  - Support email delivery through the configured SMTP/email transport.

- **Persistence**
  - Store application and email data in **PostgreSQL** using **Prisma**.
  - Scheduled emails remain persisted across backend/worker restarts.
  - Redis maintains BullMQ queue state for background processing.

- **Rate Limiting**
  - Configurable hourly email limits.
  - Configurable per-sender hourly limits.
  - Emails exceeding the configured limit are delayed/rescheduled instead of being sent immediately.

- **Concurrency**
  - BullMQ worker supports configurable job concurrency.
  - Multiple email jobs can be processed concurrently according to the configured limit.

- **Send Delay**
  - Configurable minimum delay between email sends.

- **Authentication**
  - Google OAuth authentication using **Passport.js**.
  - Session-based authentication.

- **Queue Monitoring**
  - BullMQ queue dashboard is available for monitoring background jobs.

- **Health Check**
  - Backend provides a health endpoint to verify API availability.

### Frontend

- **Google Authentication / Login**
- **Dashboard**
- **Email Composition**
- **Email Scheduling**
- **Scheduled Emails Table**
- **Sent Emails Table**
- **Email Status Tracking**
- **Search / Filtering**
- **Sender Management**
- **Delete Sender**
- **Responsive UI**

---

## 🛠️ Tech Stack

### Frontend

- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**

### Backend

- **Node.js**
- **Express**
- **TypeScript**
- **Prisma**
- **PostgreSQL**
- **Redis**
- **BullMQ**
- **Passport.js**
- **Google OAuth**
- **Nodemailer**
- **Elasticsearch**

### Deployment

- **Vercel** for the deployed application
- **PostgreSQL** for persistent data
- **Redis** for BullMQ background jobs

---

## 📁 Project Structure

```text
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

⚙️ Local Setup
Prerequisites

Make sure the following are installed:

Node.js
npm
PostgreSQL
Redis
Git
Docker (recommended for PostgreSQL and Redis)

1. Clone the Repository
git clone https://github.com/mananmarwah19/reachinbox-email-scheduler.git
cd reachinbox-email-scheduler
2. Install Dependencies
Backend
cd backend
npm install
Frontend

Open another terminal:

cd frontend
npm install
3. Start PostgreSQL and Redis

From the project root, run:

docker compose up -d

This starts the required PostgreSQL and Redis services.

Verify that both services are running before starting the backend.

🔐 Backend Environment Variables

Create a file:

backend/.env

Add the required environment variables:

DATABASE_URL="your_postgresql_connection_string"

REDIS_URL="redis://127.0.0.1:6379"

SESSION_SECRET="your_session_secret"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="your_google_callback_url"

SMTP_HOST="your_smtp_host"
SMTP_PORT=587
SMTP_USER="your_smtp_username"
SMTP_PASS="your_smtp_password"

WORKER_CONCURRENCY=5
MIN_SEND_DELAY_MS=1000
MAX_EMAILS_PER_HOUR=50
MAX_EMAILS_PER_HOUR_PER_SENDER=50

Never commit the .env file or any credentials/secrets to GitHub.

📧 Ethereal Email Setup

For development/testing, the application can use Ethereal Email as the SMTP transport.

Setup
Create an Ethereal Email test account.
Obtain the SMTP credentials provided by Ethereal.
Add the SMTP credentials to backend/.env.
Start the backend and BullMQ worker.
Send or schedule an email through the application.
Use the Ethereal preview URL to inspect the test email when using the Ethereal transport.

Example:

SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="your_ethereal_username"
SMTP_PASS="your_ethereal_password"
🗄️ Database Setup

From the backend directory:

cd backend

Generate the Prisma client:

npx prisma generate

Run the database migrations:

npx prisma migrate deploy

Make sure PostgreSQL is running before executing the migration.

▶️ Running the Application Locally

The application requires three processes:

Backend
BullMQ Worker
Frontend
1. Start the Backend

Open a terminal:

cd reachinbox-email-scheduler/backend
npm run dev

The Express backend will start on the configured backend port.

2. Start the BullMQ Worker

Open a second terminal:

cd reachinbox-email-scheduler/backend
npm run worker

The worker must remain running for scheduled emails to be processed.

The worker consumes jobs from Redis/BullMQ and sends emails when they become due.

3. Start the Frontend

Open a third terminal:

cd reachinbox-email-scheduler/frontend
npm run dev

Open the Vite URL shown in the terminal, normally:

http://localhost:5173
🧩 Architecture Overview
                    ┌──────────────────────┐
                    │      FRONTEND        │
                    │ React + TypeScript   │
                    │        Vite          │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │       EXPRESS        │
                    │       BACKEND        │
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────┘       └──────────┐
                 ▼                            ▼
        ┌────────────────┐           ┌────────────────┐
        │   PostgreSQL   │           │     Redis      │
        │     Prisma     │           │    BullMQ      │
        └────────────────┘           └───────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  Email Worker   │
                                    │ Async Processing│
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  SMTP / Email   │
                                    │    Transport    │
                                    └─────────────────┘
📅 How Scheduling Works

The scheduling flow is:

User
  ↓
Compose Email
  ↓
Select Future Date/Time
  ↓
Frontend API Request
  ↓
Express Backend
  ↓
Persist Email in PostgreSQL
  ↓
Create BullMQ Job
  ↓
Redis Queue
  ↓
BullMQ Worker
  ↓
Rate Limit / Delay Checks
  ↓
Send Email
  ↓
Update Email Status
  ↓
Sent Dashboard
Detailed Flow
The user logs in through Google authentication.
The user composes an email from the frontend.
The frontend sends the email data and scheduling information to the Express backend.
The backend validates the request.
The scheduled email is persisted in PostgreSQL.
A BullMQ job is created for the scheduled execution.
Redis stores the queue state.
The BullMQ worker processes the job when it becomes ready.
Rate limits and configured sending delays are applied.
The email is sent through the configured SMTP transport.
The email is marked as sent.
The email becomes visible in the Sent dashboard.
🔄 Persistence on Restart

Persistence is implemented using PostgreSQL rather than relying only on in-memory application state.

The scheduling information is stored in the database and BullMQ uses Redis for background job management.

Therefore, when the backend or worker is restarted:

Scheduled Email
       ↓
Persisted in PostgreSQL
       ↓
Backend / Worker Restart
       ↓
Application Starts Again
       ↓
Worker Continues Processing
       ↓
Scheduled Email Is Sent

This prevents scheduled email information from being lost simply because the application process was restarted.

🚦 Rate Limiting

The worker supports configurable email rate limits.

The relevant configuration includes:

MAX_EMAILS_PER_HOUR=50
MAX_EMAILS_PER_HOUR_PER_SENDER=50

The rate limiter prevents a sender from exceeding the configured hourly sending limit.

When the hourly limit has been reached, the email is delayed/rescheduled rather than immediately sent.

This provides controlled email throughput and prevents excessive sending.

⏱️ Send Delay

The worker supports a configurable minimum delay between email sends:

MIN_SEND_DELAY_MS=1000

This helps regulate the sending rate even when multiple jobs are available for processing.

⚡ Concurrency

BullMQ worker concurrency is configurable:

WORKER_CONCURRENCY=5

This allows multiple email jobs to be processed concurrently while still applying the configured rate limits and send delays.

Concurrency allows the worker to process multiple independent jobs efficiently without processing everything sequentially.

🔁 Restart Scenario

The application supports persistence across backend/worker restarts.

To verify:

Start PostgreSQL and Redis.
Start the backend.
Start the BullMQ worker.
Schedule an email for a future time.
Confirm the email appears in Scheduled.
Stop the backend and/or worker.
Start the services again.
Refresh the frontend.
Confirm that the scheduled email is still present.
Wait until its scheduled time.
Confirm that the BullMQ worker processes the job.
Confirm that the email appears in Sent.
🔐 Security
Authentication uses Google OAuth.
Sessions are used for authenticated application functionality.
Environment variables are used for credentials and secrets.
.env files are excluded from Git.
Database credentials, SMTP credentials, OAuth secrets, and session secrets must not be committed to the repository.
📝 Assumptions, Shortcuts & Trade-offs
The application is designed as an email scheduling assignment/demo rather than a production-scale email delivery platform.
PostgreSQL and Redis are treated as available infrastructure for local development.
SMTP credentials are supplied through environment variables.
Ethereal Email can be used as a test email transport during development.
Worker concurrency, delays, and rate limits are configurable.
BullMQ and Redis are used to keep email processing asynchronous and separate from the API request lifecycle.
The frontend and backend are maintained together as a monorepo while remaining independently runnable.
🎥 Demo Video

The demo demonstrates:

Google authentication
Dashboard
Email composition
Creating a scheduled email
Scheduled email dashboard
Stopping the backend/worker
Restarting the backend/worker
Verifying the scheduled email persists after restart
BullMQ worker processing
Successful email delivery
Sent email dashboard
Overview of rate limiting, delay, concurrency, and persistence

Demo Video: https://drive.google.com/file/d/1yIouRtwShS-_5dxATycVhtHnBAgnyVna/view?usp=sharing

The demo video is kept within the assignment's 5-minute maximum.

🌐 Deployed Application

Live Application: https://reachinbox-email-scheduler-firys29sb.vercel.app/

📦 Submission Repository

GitHub: https://github.com/mananmarwah19/reachinbox-email-scheduler

The repository contains both the frontend and backend implementations along with the setup and architecture documentation required for the assignment.
