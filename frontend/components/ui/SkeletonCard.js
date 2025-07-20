'use client';

import { clsx } from 'clsx';

export function SkeletonCard({ className = '', variant = 'default' }) {
  const variants = {
    default: (
      <div className={clsx('card animate-pulse', className)}>
        <div className="space-y-4">
          <div className="skeleton h-48 w-full rounded-lg"></div>
          <div className="space-y-2">
            <div className="skeleton h-4 w-3/4 rounded"></div>
            <div className="skeleton h-4 w-1/2 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded"></div>
            <div className="skeleton h-3 w-full rounded"></div>
            <div className="skeleton h-3 w-2/3 rounded"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="skeleton h-6 w-20 rounded-full"></div>
            <div className="skeleton h-8 w-24 rounded"></div>
          </div>
        </div>
      </div>
    ),

    post: (
      <div className={clsx('card animate-pulse', className)}>
        <div className="space-y-4">
          <div className="skeleton h-56 w-full rounded-lg"></div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="skeleton h-6 w-16 rounded-full"></div>
              <div className="skeleton h-4 w-24 rounded"></div>
            </div>
            <div className="skeleton h-6 w-4/5 rounded"></div>
            <div className="skeleton h-4 w-full rounded"></div>
            <div className="skeleton h-4 w-full rounded"></div>
            <div className="skeleton h-4 w-3/4 rounded"></div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <div className="skeleton h-8 w-8 rounded-full"></div>
              <div className="skeleton h-4 w-20 rounded"></div>
            </div>
            <div className="skeleton h-4 w-16 rounded"></div>
          </div>
        </div>
      </div>
    ),

    tool: (
      <div className={clsx('card animate-pulse', className)}>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="skeleton h-16 w-16 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-3/4 rounded"></div>
              <div className="skeleton h-4 w-1/2 rounded"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded"></div>
            <div className="skeleton h-3 w-full rounded"></div>
            <div className="skeleton h-3 w-4/5 rounded"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <div className="skeleton h-6 w-12 rounded-full"></div>
              <div className="skeleton h-6 w-16 rounded-full"></div>
            </div>
            <div className="skeleton h-8 w-20 rounded"></div>
          </div>
        </div>
      </div>
    ),

    category: (
      <div className={clsx('card animate-pulse text-center', className)}>
        <div className="space-y-4">
          <div className="skeleton h-16 w-16 mx-auto rounded-xl"></div>
          <div className="space-y-2">
            <div className="skeleton h-5 w-3/4 mx-auto rounded"></div>
            <div className="skeleton h-4 w-1/2 mx-auto rounded"></div>
          </div>
          <div className="skeleton h-8 w-24 mx-auto rounded"></div>
        </div>
      </div>
    ),

    testimonial: (
      <div className={clsx('card animate-pulse', className)}>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="skeleton h-4 w-full rounded"></div>
            <div className="skeleton h-4 w-full rounded"></div>
            <div className="skeleton h-4 w-3/4 rounded"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="skeleton h-12 w-12 rounded-full"></div>
            <div className="space-y-1">
              <div className="skeleton h-4 w-24 rounded"></div>
              <div className="skeleton h-3 w-32 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    ),

    list: (
      <div className={clsx('space-y-3', className)}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg animate-pulse"
          >
            <div className="skeleton h-10 w-10 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4 rounded"></div>
              <div className="skeleton h-3 w-1/2 rounded"></div>
            </div>
            <div className="skeleton h-6 w-16 rounded-full"></div>
          </div>
        ))}
      </div>
    ),
  };

  return variants[variant] || variants.default;
}

export function SkeletonGrid({
  count = 6,
  variant = 'default',
  className = '',
  gridClassName = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
}) {
  return (
    <div className={clsx(gridClassName, className)}>
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}

export function SkeletonText({
  lines = 3,
  className = '',
  lineClassName = 'skeleton h-4 rounded',
}) {
  return (
    <div className={clsx('space-y-2', className)}>
      {[...Array(lines)].map((_, i) => (
        <div key={i} className={clsx(lineClassName, i === lines - 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  );
}
