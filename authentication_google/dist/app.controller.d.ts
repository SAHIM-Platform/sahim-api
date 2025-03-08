import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    gooleAuth(req: any): Promise<void>;
    googleAuthRedirect(req: any): "No user from google" | {
        massage: string;
        user: any;
    };
}
