import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { UserModel, IUser } from '../models/User.js';
import { config } from './index.js';


passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        async (email, password, done) => {
            try {
                const user = await UserModel.findOne({ email }).select('+password');

                if (!user) {
                    return done(null, false, { message: 'Invalid email or password' });
                }

                if (!user.password) {
                    return done(null, false, { message: 'Please login with Google' });
                }

                const isMatch = await user.comparePassword(password);

                if (!isMatch) {
                    return done(null, false, { message: 'Invalid email or password' });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);


const jwtOptions: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtSecret,
};

passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
        try {
            const user = await UserModel.findById(payload.sub);

            if (!user) {
                return done(null, false);
            }

            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    })
);

if (config.googleClientId && config.googleClientSecret) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: config.googleClientId,
                clientSecret: config.googleClientSecret,
                callbackURL: config.googleCallbackUrl,
            },
            async (accessToken, refreshToken, profile: Profile, done) => {
                try {
                    let user = await UserModel.findOne({
                        $or: [
                            { googleId: profile.id },
                            { email: profile.emails?.[0]?.value },
                        ],
                    });

                    if (user) {
                        if (!user.googleId) {
                            user.googleId = profile.id;
                            if (profile.photos?.[0]?.value) {
                                user.avatar = profile.photos[0].value;
                            }
                            await user.save();
                        }
                        return done(null, user);
                    }

                    user = await UserModel.create({
                        email: profile.emails?.[0]?.value,
                        googleId: profile.id,
                        name: profile.displayName,
                        avatar: profile.photos?.[0]?.value,
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error as Error);
                }
            }
        )
    );
}

passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await UserModel.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

export default passport;
