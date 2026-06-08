import BicycleIcon from './BicycleIcon';

export const LoadingSpinner = ({ label = 'Loading...', fullScreen = false }) => (
  <div className={`flex items-center justify-center ${fullScreen ? 'fixed inset-0 z-[120] bg-white/96 backdrop-blur' : 'min-h-40'}`}>
    <div className="text-center">
      <div className="relative mx-auto h-16 w-36 overflow-hidden">
        <div className="absolute bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-tdp-yellow to-transparent" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-loader-cycle">
          <BicycleIcon size={58} color="#CC0000" opacity={1} />
        </div>
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
