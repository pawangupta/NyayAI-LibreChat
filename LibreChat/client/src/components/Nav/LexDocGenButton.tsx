import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature } from 'lucide-react';
import { TooltipAnchor, Button } from '@librechat/client';

interface Props {
  isSmallScreen?: boolean;
  toggleNav: () => void;
}

export default function LexDocGenButton({ isSmallScreen, toggleNav }: Props) {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate('/lexdocgen');
    if (isSmallScreen) {
      toggleNav();
    }
  }, [navigate, isSmallScreen, toggleNav]);

  const label = 'LexDocGen';

  return (
    <TooltipAnchor
      description={label}
      render={
        <Button
          variant="outline"
          aria-label={label}
          className="rounded-full border-none bg-transparent p-2 hover:bg-surface-hover md:rounded-xl"
          onClick={handleClick}
        >
          <FileSignature className="icon-lg text-text-primary" />
        </Button>
      }
    />
  );
}
