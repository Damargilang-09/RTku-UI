export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <span className="material-symbols-outlined animate-spin text-3xl text-primary">
        progress_activity
      </span>
    </div>
  );
}
