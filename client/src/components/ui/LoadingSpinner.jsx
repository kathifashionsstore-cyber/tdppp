export const LoadingSpinner = ({ label = 'Loading...', fullScreen = false }) => (
  <div className={`flex items-center justify-center ${fullScreen ? 'fixed inset-0 z-[120] bg-white/96 backdrop-blur' : 'min-h-40'}`}>
    <div className="text-center">
      <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-white shadow-yellow ring-4 ring-yellow-200/70">
        <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-tdp-yellow animate-spin" />
        <img src="/logo.webp" alt="TDP Narasaraopet" className="animate-loader-logo h-14 w-14 object-contain" />
      </div>
      <p className="mt-2 text-sm font-black text-tdp-navy">{label}</p>
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid gap-5 md:grid-cols-3">
    {Array.from({ length: count }).map((_, index) => (
      <div className="overflow-hidden rounded-lg bg-white shadow-sm" key={index}>
        <div className="skeleton h-48" />
        <div className="space-y-3 p-4">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-6 rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
      </div>
    ))}
  </div>
);
