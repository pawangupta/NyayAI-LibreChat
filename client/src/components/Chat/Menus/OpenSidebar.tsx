import { TooltipAnchor, Button, Sidebar } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import BrandLink from '~/components/Nav/BrandLink';

export default function OpenSidebar({
  setNavVisible,
  className,
}: {
  setNavVisible: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}) {
  const localize = useLocalize();
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <BrandLink />
      <TooltipAnchor
        description={localize('com_nav_open_sidebar')}
        render={
          <Button
            size="icon"
            variant="outline"
            data-testid="open-sidebar-button"
            aria-label={localize('com_nav_open_sidebar')}
            className="rounded-xl border border-border-light bg-surface-secondary p-2 hover:bg-surface-hover"
            onClick={() =>
              setNavVisible((prev) => {
                localStorage.setItem('navVisible', JSON.stringify(!prev));
                return !prev;
              })
            }
          >
            <Sidebar />
          </Button>
        }
      />
    </div>
  );
}
