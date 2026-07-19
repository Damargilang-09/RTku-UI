export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <svg
        className="animate-spin"
        width="32"
        height="32"
        viewBox="0 0 50 50"
        role="img"
        aria-label="Loading"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="opacity-20"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="90 125"
          className="text-primary"
        />
      </svg>
    </div>
  );
}