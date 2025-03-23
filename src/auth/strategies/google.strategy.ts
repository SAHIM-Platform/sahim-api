import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigType } from '@nestjs/config';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import googleOauthConfig from '../config/google.oauth.config';
import { AuthService } from '../auth.service';
import { GoogleUser } from '../interfaces/google-user.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleOauthConfig.KEY)
    private googleConfiguration: ConfigType<typeof googleOauthConfig>,
    private authService: AuthService,
  ) {
    super({
      clientID: googleConfiguration.clientID || 'your-client-id-here',
      clientSecret: googleConfiguration.clientSecret || 'your-client-secret-here',
      callbackURL: googleConfiguration.callbackURL,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    console.log('Profile:', profile);
    
    const email = profile.emails?.[0]?.value;
    const displayName = profile.displayName;
    const picture = profile.photos?.[0]?.value;

    const googleUser: GoogleUser = {
      id: profile.id,
      name: displayName,
      email: email,
      picture,
    };

    try {
      // Validate or create the user
      const user = await this.authService.validateGoogleUser(googleUser);
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
}
