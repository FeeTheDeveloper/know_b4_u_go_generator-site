export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-label="Know Before You Go"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="kbugGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B8860B" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#F5D67E" />
        </linearGradient>
        <radialGradient id="kbugNavy" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#1A3568" />
          <stop offset="100%" stopColor="#0A1A3F" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#kbugNavy)" />
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="url(#kbugGold)"
        strokeWidth="2.2"
      />
      <path
        d="M18 33 L28 43 L48 20"
        fill="none"
        stroke="url(#kbugGold)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
