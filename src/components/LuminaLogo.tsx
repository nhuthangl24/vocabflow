export default function LuminaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="10" fill="url(#lumina-bg)" />
      <rect x="11" y="10" width="5.5" height="20" rx="2.75" fill="#FFFFFF" opacity="0.95" />
      <rect x="11" y="24.5" width="14" height="5.5" rx="2.75" fill="#FFFFFF" opacity="0.95" />
      <path d="M 19.5 14 L 27 18.5 L 19.5 23 Z" fill="#38BDF8" stroke="#38BDF8" strokeWidth="2" strokeLinejoin="round" />
      <defs>
        <linearGradient id="lumina-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#312E81" />
          <stop offset="0.5" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#9333EA" />
        </linearGradient>
      </defs>
    </svg>
  );
}

