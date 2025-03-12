import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-google-oauth20';
import { Passport } from "passport";
import { AuthService } from "../auth.service";


@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){
    constructor(private authService:AuthService){
        super({
            usernameField:'email',
        });
    }
     validate(email:string,password:string){
        if(password=="")throw new UnauthorizedException("Please provide The Password");
        return this.authService.validateUser(email,password);
    }
}
    
    