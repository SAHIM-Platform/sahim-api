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
          // If the response already follows a standard format, just return it
          if (
            response &&
            typeof response === 'object' &&
            ('message' in response && 'data' in response)
          ) {
            return response;
          }

          // If there's a top-level meta, preserve it
          if (response && 
            typeof response === 'object' && 
            'meta' in response) {
              const { meta, ...rest } = response as any;
              return {
                message: 'Request successful',
                data: rest,
                meta,
              };
            }
  
          // Otherwise, wrap it in the default format
          return {
            message: 'Request successful',
            data: response,
          };
        }),
      );
    }
  }
  