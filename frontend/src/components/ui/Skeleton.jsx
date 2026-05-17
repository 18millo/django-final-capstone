export default function Skeleton({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={'animate-pulse rounded-2xl border backdrop-blur-md ' + className}
          style={{
            backgroundColor: 'var(--color-nike-dark)',
            borderColor: 'var(--color-nike-gray)',
          }}
        >
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-nike-gray)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded w-2/3" style={{ backgroundColor: 'var(--color-nike-gray)' }} />
                <div className="h-2 rounded w-1/3" style={{ backgroundColor: 'var(--color-nike-gray)' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 rounded w-full" style={{ backgroundColor: 'var(--color-nike-gray)' }} />
              <div className="h-2 rounded w-3/4" style={{ backgroundColor: 'var(--color-nike-gray)' }} />
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-3 rounded w-20" style={{ backgroundColor: 'var(--color-nike-gray)' }} />
              <div className="h-8 rounded-full w-24" style={{ backgroundColor: 'var(--color-nike-gray)' }} />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
