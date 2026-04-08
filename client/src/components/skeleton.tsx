/**
 * Reusable skeleton loading components.
 * Each page has its own skeleton that mirrors the real content layout,
 * preventing layout shifts during data fetching.
 */

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, minHeight: height || '16px' }}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

/* ── Page-specific skeletons ── */

export function HomePageSkeleton() {
  return (
    <div>
      <Skeleton width="200px" height="32px" className="mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar skeleton */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton width="32px" height="32px" />
              <Skeleton width="140px" height="24px" />
              <Skeleton width="32px" height="32px" />
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} height="20px" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} height="40px" />
              ))}
            </div>
          </div>
        </div>

        {/* Match list skeleton */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((group) => (
            <div key={group}>
              <div className="flex items-center gap-3 mb-3">
                <Skeleton width="120px" height="16px" />
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {[1, 2].map((card) => (
                  <div key={card} className="bg-card-hover p-3 rounded-lg flex items-center gap-3">
                    <Skeleton width="48px" height="48px" />
                    <div className="flex-1 space-y-2">
                      <Skeleton height="16px" width="80%" />
                      <Skeleton height="12px" width="50%" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlayersPageSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Skeleton width="120px" height="32px" />
        <Skeleton width="120px" height="40px" />
      </div>
      <div className="bg-card rounded-lg overflow-hidden border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card-hover">
              <th className="text-left px-4 py-3 w-20"><Skeleton height="16px" width="24px" /></th>
              <th className="text-left px-4 py-3"><Skeleton height="16px" width="60px" /></th>
              <th className="text-left px-4 py-3"><Skeleton height="16px" width="60px" /></th>
              <th className="text-left px-4 py-3"><Skeleton height="16px" width="80px" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <Skeleton width="32px" height="32px" className="rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton height="16px" width={`${60 + Math.random() * 40}%`} />
                </td>
                <td className="px-4 py-3">
                  <Skeleton height="16px" width={`${50 + Math.random() * 30}%`} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Skeleton height="22px" width="50px" className="rounded-full" />
                    <Skeleton height="22px" width="40px" className="rounded-full" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Skeleton width="180px" height="32px" />
      </div>
      <div className="max-w-2xl">
        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton width="64px" height="64px" className="rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton height="24px" width="160px" />
              <Skeleton height="14px" width="220px" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-background rounded-lg p-4 text-center space-y-2">
                <Skeleton height="28px" width="40px" className="mx-auto" />
                <Skeleton height="12px" width="60px" className="mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TraitsPageSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Skeleton width="200px" height="32px" />
        <div className="flex gap-2">
          <Skeleton width="110px" height="40px" />
          <Skeleton width="110px" height="40px" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traits List skeleton */}
        <div>
          <Skeleton width="100px" height="22px" className="mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card p-3 rounded-lg flex items-center justify-between">
                <div className="space-y-1.5 flex-1">
                  <Skeleton height="16px" width={`${40 + Math.random() * 30}%`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Player Traits skeleton */}
        <div>
          <Skeleton width="120px" height="22px" className="mb-3" />
          <Skeleton height="40px" className="mb-4" />
        </div>
      </div>
    </div>
  );
}
