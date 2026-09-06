import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import passport from "./config/passport";
import authRoutes from "./routes/auth.routes";
import senderRoutes from "./routes/sender.routes";
import emailRoutes from "./routes/email.routes";
import { initializeEmailIndex } from "./integrations/elasticsearch/elasticsearch.service";
import { emailQueue } from "./queues/email.queue";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

const app = express();

initializeEmailIndex().catch((error) => {
  console.error("Failed to initialize Elasticsearch:", error);
});

// BullMQ dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "reachinbox-dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ReachInbox Email Scheduler API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/senders", senderRoutes);
app.use("/api/emails", emailRoutes);

export default app;