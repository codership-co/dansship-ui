export function UpcomingListSkeleton() {
  return (
    <div className='space-y-3' aria-hidden>
      <div className='h-[132px] animate-pulse rounded-[18px] bg-primary/30' />
      <div className='h-24 animate-pulse rounded-2xl bg-white/80' />
      <div className='h-24 animate-pulse rounded-2xl bg-white/80' />
    </div>
  );
}

export function HistoryListSkeleton() {
  return (
    <div className='space-y-3' aria-hidden>
      <div className='h-28 animate-pulse rounded-2xl bg-white/80' />
      <div className='h-28 animate-pulse rounded-2xl bg-white/80' />
    </div>
  );
}
