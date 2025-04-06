import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerOptionsFactory, ThrottlerModuleOptions } from '@nestjs/throttler';

@Injectable()
export class ThrottlerConfigService implements ThrottlerOptionsFactory {
  constructor(private readonly configService: ConfigService) {}
  
  createThrottlerOptions(): ThrottlerModuleOptions {
    return {
      throttlers: [
        {
          ttl: this.configService.get<number>('THROTTLE_TTL', 60000), // Default: 60 seconds
          limit: this.configService.get<number>('THROTTLE_LIMIT', 10), // Default: 10 requests
        },
      ],
    };
  }
}