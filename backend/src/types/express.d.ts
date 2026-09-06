import { User } from "../../generated/prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      googleId: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    }
  }
}

export {};