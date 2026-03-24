import { Link } from 'react-router-dom';
import { cn } from '~/utils';

export default function BrandLink({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      to="/c/new"
      aria-label="NyayAI Home"
      className={cn('flex items-center gap-2 rounded-xl px-1 py-1', className)}
    >
      <div className="nyay-logo-badge flex-shrink-0 overflow-hidden rounded-lg">
        <img
          src="/assets/NyayAI_Dark.png"
          alt="NyayAI"
          className="h-8 w-8 object-cover"
          draggable={false}
        />
      </div>
      {showWordmark ? (
        <span className="nyay-wordmark text-sm font-semibold text-text-primary">NyayAI</span>
      ) : null}
    </Link>
  );
}