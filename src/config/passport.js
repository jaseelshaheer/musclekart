import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";
import { generateUniqueReferralCode } from "../services/user/referral.service.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        if (!user) {
          const referralCodeForUser = await generateUniqueReferralCode(
            profile.name?.givenName || "MK"
          );

          user = await User.create({
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            email,
            authProvider: "google",
            isEmailVerified: true,
            referral_code: referralCodeForUser
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
