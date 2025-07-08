import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/users.model"
import { config } from "dotenv";
config({ path: "./.env" });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!, // set in .env
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL}/api/v1/users/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ email: profile.emails?.[0].value });

        if (existingUser) {
          return done(null, existingUser);
        }

        const newUser = await User.create({
          name: profile.displayName,
          email: profile.emails?.[0].value,
          avatar: profile.photos?.[0].value || "",
          password: "", // no password required
          isGoogleAuthenticated: true,
          isVerified: true,
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  const user = await User.findById(id);
  done(null, user);
});
