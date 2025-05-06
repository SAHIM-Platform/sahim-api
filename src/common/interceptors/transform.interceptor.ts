import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  
  @Injectable()
  export class TransformInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
      return next.handle().pipe(
        map((response) => {
          const statusCode = context.switchToHttp().getResponse().statusCode;
  
          // If the response already follows a standard format, just return it
          if (
            response &&
            typeof response === 'object' &&
            ('statusCode' in response || 'message' in response || 'data' in response)
          ) {
            return {
              statusCode,
              ...response,
            };
          }
  
          // Otherwise, wrap it in the default format
          return {
            statusCode,
            message: 'Request successful',
            data: response,
          };
        }),
      );
    }
  }
  