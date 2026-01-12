import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "../models/user.model";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        console.log(`🔐 Google OAuth: ${profile.emails?.[0]?.value}`);

        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email from Google"), undefined);
        }

        // Check if user exists
        let user = await UserModel.findByEmail(email);

        if (!user) {
          // Create new user from Google profile
          const name = profile.displayName || email.split("@")[0];
          user = await UserModel.createFromGoogle({
            email,
            name,
            googleId: profile.id,
          });
          console.log(`✅ Created new user from Google: ${email}`);
        } else {
          // Update google_id if not set
          if (!user.google_id) {
            await UserModel.updateGoogleId(user.id, profile.id);
          }
          console.log(`✅ Logged in via Google: ${email}`);
        }

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
