import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { LoadingService } from '../services/loading.service';

/**
 * Loading interceptor that shows/hides global loading indicator
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // Skip loading indicator for certain requests
  const skipLoadingUrls = ['/audit', '/heartbeat', '/ping'];
  const shouldSkip = skipLoadingUrls.some(url => req.url.includes(url));
  
  if (shouldSkip) {
    return next(req);
  }
  
  loadingService.show();
  
  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};
