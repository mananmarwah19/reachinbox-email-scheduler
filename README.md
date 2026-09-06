\# ReachInbox Email Scheduler



A full-stack email scheduling application built with React/Vite on the frontend and Express/TypeScript on the backend.



The application allows users to authenticate, compose emails, schedule them for future delivery, and view scheduled and sent emails through a dashboard.



\## Tech Stack



\### Frontend

\- React

\- Vite

\- TypeScript



\### Backend

\- Node.js

\- Express

\- TypeScript

\- Passport.js

\- Express Session

\- PostgreSQL

\- Redis

\- BullMQ

\- Elasticsearch

\- Bull Board



\### Deployment

\- Vercel



\---



\# Features



\## Backend



\- Email scheduling

\- Persistent storage using PostgreSQL

\- Background email processing using BullMQ

\- Redis-backed job queue

\- Worker-based email delivery

\- Rate limiting

\- Per-sender email limits

\- Configurable worker concurrency

\- Configurable minimum delay between emails

\- Elasticsearch email indexing/search

\- Google authentication

\- Session-based authentication

\- Health check endpoint

\- BullMQ monitoring dashboard



\## Frontend



\- Login/authentication

\- Google login

\- Email dashboard

\- Scheduled emails table

\- Sent emails table

\- Compose email interface

\- Email scheduling

\- Email status display

\- Search/filter functionality

\- Responsive UI



\---



\# Project Structure



```text

reachinbox-email-scheduler/

│

├── frontend/

│   ├── src/

│   └── package.json

│

├── backend/

│   ├── src/

│   │   ├── config/

│   │   ├── integrations/

│   │   ├── queues/

│   │   ├── routes/

│   │   └── workers/

│   └── package.json

│

├── vercel.json

└── README.md

