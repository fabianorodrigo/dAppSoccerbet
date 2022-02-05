import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // if (this.tokenService.hasToken()) {
    //   const token = this.tokenService.getToken();
    //   req = req.clone({
    //     setHeaders: {
    //       'x-access-token': token,
    //     },
    //   });
    // }
    console.log('teste', req.body);
    return next.handle(req);
  }
}
