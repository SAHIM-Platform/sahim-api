import { ConfigType } from '@nestjs/config';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import googleOauthConfig from '../config/google.oauth.config';
declare const GoogleStrategy_base: new (...args: [options: import("passport-google-oauth20").StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptions] | [options: StrategyOptionsWithRequest] | [options: StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class GoogleStrategy extends GoogleStrategy_base {
    private googleConfiguration;
    constructor(googleConfiguration: ConfigType<typeof googleOauthConfig>);
    validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any>;
}
export {};
