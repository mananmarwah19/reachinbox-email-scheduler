import "dotenv/config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:4000/api/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(
              new Error("Google account does not provide an email address")
            );
          }

          const user = await prisma.user.upsert({
            where: {
              googleId: profile.id,
            },
            update: {
              name: profile.displayName || email,
              email,
              avatarUrl: profile.photos?.[0]?.value,
            },
            create: {
              googleId: profile.id,
              name: profile.displayName || email,
              email,
              avatarUrl: profile.photos?.[0]?.value,
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

export default passport;