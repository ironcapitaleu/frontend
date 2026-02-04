import React from 'react';
import type { Decorator } from '@storybook/react-vite';

/**
 * Grid layout decorator for showcasing multiple variants
 */
export const GridDecorator: Decorator = (Story) => (
  <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-4">
    <Story />
  </div>
);

/**
 * Centered container decorator
 */
export const CenteredDecorator: Decorator = (Story) => (
  <div className="flex min-h-100 items-center justify-center p-4">
    <Story />
  </div>
);

/**
 * Dark mode wrapper decorator
 */
export const DarkModeDecorator: Decorator = (Story) => (
  <div className="dark bg-background text-foreground p-8">
    <Story />
  </div>
);

/**
 * Showcase grid for displaying all variants at once
 */
export function VariantShowcase<T extends Record<string, any>>({
  Component,
  variants,
  variantKey,
  baseProps,
}: {
  Component: React.ComponentType<T>;
  variants: string[];
  variantKey: keyof T;
  baseProps?: Partial<T>;
}) {
  return (
    <div className="grid gap-8">
      {variants.map((variant) => (
        <div key={variant} className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground capitalize">
            {variant}
          </div>
          <Component
            {...(baseProps as T)}
            {...({ [variantKey]: variant } as T)}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Size comparison showcase
 */
export function SizeShowcase<T extends Record<string, any>>({
  Component,
  sizes,
  sizeKey,
  baseProps,
}: {
  Component: React.ComponentType<T>;
  sizes: string[];
  sizeKey: keyof T;
  baseProps?: Partial<T>;
}) {
  return (
    <div className="flex items-end gap-4 flex-wrap">
      {sizes.map((size) => (
        <div key={size} className="space-y-2">
          <Component
            {...(baseProps as T)}
            {...({ [sizeKey]: size } as T)}
          />
          <div className="text-xs text-muted-foreground text-center">
            {size}
          </div>
        </div>
      ))}
    </div>
  );
}
