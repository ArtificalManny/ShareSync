import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ProjectSkeleton from '../ProjectSkeleton';

describe('ProjectSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProjectSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has pulse animation', () => {
    const { container } = render(<ProjectSkeleton />);
    const animatedDiv = container.querySelector('.animate-pulse');
    expect(animatedDiv).toBeInTheDocument();
  });

  it('renders title placeholder', () => {
    const { container } = render(<ProjectSkeleton />);
    // Title placeholder (h-4 w-1/3)
    const titlePlaceholder = container.querySelector('.h-4.w-1\\/3');
    expect(titlePlaceholder).toBeInTheDocument();
  });

  it('renders description placeholders', () => {
    const { container } = render(<ProjectSkeleton />);
    // Two description lines
    const descLine1 = container.querySelector('.h-3.w-2\\/3');
    const descLine2 = container.querySelector('.h-3.w-1\\/2');
    expect(descLine1).toBeInTheDocument();
    expect(descLine2).toBeInTheDocument();
  });

  it('renders avatar placeholders', () => {
    const { container } = render(<ProjectSkeleton />);
    // 3 circular avatar placeholders
    const avatars = container.querySelectorAll('.rounded-full');
    expect(avatars).toHaveLength(3);
  });

  it('applies correct container styling', () => {
    const { container } = render(<ProjectSkeleton />);
    const wrapper = container.firstChild;
    expect(wrapper?.className).toContain('rounded-2xl');
    expect(wrapper?.className).toContain('bg-white');
    expect(wrapper?.className).toContain('dark:bg-slate-800');
  });

  it('applies dark mode classes', () => {
    const { container } = render(<ProjectSkeleton />);
    const placeholders = container.querySelectorAll('.dark\\:bg-slate-700');
    // Title + 2 description lines = 3 placeholders
    expect(placeholders.length).toBeGreaterThanOrEqual(3);
  });

  it('has proper spacing between elements', () => {
    const { container } = render(<ProjectSkeleton />);
    const titlePlaceholder = container.querySelector('.mb-3');
    const avatarContainer = container.querySelector('.mt-4');
    expect(titlePlaceholder).toBeInTheDocument();
    expect(avatarContainer).toBeInTheDocument();
  });
});
