'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    // Start loading when route changes
    handleStart();

    // Complete loading after a short delay to simulate navigation
    const timer = setTimeout(handleComplete, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-primary-600 dark:bg-primary-400 animate-pulse">
        <div className="h-full bg-gradient-to-r from-primary-600 to-accent-600 animate-shimmer"></div>
      </div>
    </div>
  );
}
