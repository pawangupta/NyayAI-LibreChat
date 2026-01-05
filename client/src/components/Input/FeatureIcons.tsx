import { memo } from 'react';
import { useRecoilValue } from 'recoil';
import { FileText, Scale, FileSignature } from 'lucide-react';
import { useGetEndpointsQuery } from '~/data-provider';
import { cn } from '~/utils';
import store from '~/store';

interface FeatureIcon {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  endpoint: string;
  description: string;
  enabled: boolean;
}

const FeatureIcons = memo(() => {
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const conversation = useRecoilValue(store.conversation) || {};

  // Parse feature icons from LibreChat.yaml configuration
  const featureIcons: FeatureIcon[] = [
    {
      id: 'willgen',
      label: 'WillGen',
      icon: FileSignature,
      endpoint: 'WillGen',
      description: 'Generate legal wills and estate documents',
      enabled: endpointsConfig?.endpoints?.some((e) => e.name === 'WillGen') || false,
    },
    {
      id: 'docgen',
      label: 'DocGen',
      icon: FileText,
      endpoint: 'DocGen',
      description: 'Generate legal documents and contracts',
      enabled: endpointsConfig?.endpoints?.some((e) => e.name === 'DocGen') || false,
    },
    {
      id: 'legalcontract',
      label: 'Contract',
      icon: Scale,
      endpoint: 'LegalContract',
      description: 'Review and analyze legal contracts',
      enabled: endpointsConfig?.endpoints?.some((e) => e.name === 'LegalContract') || false,
    },
  ];

  const enabledIcons = featureIcons.filter((icon) => icon.enabled);

  if (enabledIcons.length === 0) {
    return null;
  }

  const handleIconClick = (endpoint: string) => {
    // Switch to the selected endpoint
    const event = new CustomEvent('nyayai:switch-endpoint', {
      detail: { endpoint },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex items-center justify-center gap-2 px-2 py-3">
      <div className="flex items-center gap-1.5 rounded-lg bg-transparent p-1">
        {enabledIcons.map((feature) => {
          const Icon = feature.icon;
          const isActive = conversation?.endpoint === feature.endpoint;

          return (
            <button
              key={feature.id}
              type="button"
              onClick={() => handleIconClick(feature.endpoint)}
              className={cn(
                'group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-claude-100 text-claude-700 dark:bg-claude-900 dark:text-claude-300'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}
              title={feature.description}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-claude-600 dark:text-claude-400' : ''
                )}
              />
              <span className="hidden sm:inline">{feature.label}</span>
              
              {/* Tooltip for mobile */}
              <div className="pointer-events-none absolute -top-10 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-700 sm:hidden sm:group-hover:block">
                {feature.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

FeatureIcons.displayName = 'FeatureIcons';

export default FeatureIcons;
