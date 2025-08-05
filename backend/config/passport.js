const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update user's Google profile information if needed
          user.googleProfile = profile;
          await user.save();
          return done(null, user);
        }

        // Check if user exists with the same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.googleProfile = profile;
          await user.save();
          return done(null, user);
        }

        // Create new user with Google profile
        const newUser = await User.create({
          email: profile.emails[0].value,
          googleId: profile.id,
          googleProfile: profile,
          profile: {
            firstName: profile.name.givenName || '',
            lastName: profile.name.familyName || '',
            householdSize: 1,
            dietaryPreferences: [],
            budgetRange: 'medium',
            primaryStores: []
          },
          isEmailVerified: true, // Google already verified the email
          lastLogin: Date.now(),
          isActive: true
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;