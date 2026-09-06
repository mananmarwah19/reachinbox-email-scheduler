import { Router } from "express";
import passport from "../config/passport";

const router = Router();

router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      success: false,
      message: "Google OAuth is not configured",
    });
  }

  passport.authenticate("google", {
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "select_account",
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/",
  }),
  (_req, res) => {
    res.redirect("http://localhost:5173/");
  }
);

router.get("/me", (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  return res.json({
    success: true,
    user: req.user,
  });
});

router.post("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }

      res.clearCookie("connect.sid");

      return res.json({
        success: true,
        message: "Logged out successfully",
      });
    });
  });
});

export default router;