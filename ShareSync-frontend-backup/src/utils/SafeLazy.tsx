import { ComponentType, lazy } from 'react';

export function safeLazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.error('Failed to load component:', error);
      return { default: () => <div>Error loading component</div> } as { default: T };
    }
  });
}