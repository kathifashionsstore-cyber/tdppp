const BicycleIcon = ({ size = 40, color = '#FFD700', opacity = 0.15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 60" fill="none" opacity={opacity} className={className} aria-hidden="true">
    <circle cx="20" cy="45" r="14" stroke={color} strokeWidth="4" fill="none" />
    <circle cx="80" cy="45" r="14" stroke={color} strokeWidth="4" fill="none" />
    <path d="M20 45 L40 15 L60 15 L80 45 M40 15 L50 45 M60 15 L80 45" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M30 15 L50 15" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="15" r="4" fill={color} />
  </svg>
);

export default BicycleIcon;
