import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskStatusPill from '../TaskStatusPill';

describe('TaskStatusPill', () => {
  describe('Status Variants', () => {
    it('renders Not Started status', () => {
      render(<TaskStatusPill status="Not Started" />);
      expect(screen.getByText('Not Started')).toBeInTheDocument();
      expect(screen.getByTitle('Not Started')).toBeInTheDocument();
    });

    it('renders In Progress status', () => {
      render(<TaskStatusPill status="In Progress" />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByTitle('In Progress')).toBeInTheDocument();
    });

    it('renders Completed status', () => {
      render(<TaskStatusPill status="Completed" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByTitle('Completed')).toBeInTheDocument();
    });

    it('defaults to Not Started for invalid status', () => {
      render(<TaskStatusPill status="Invalid Status" />);
      expect(screen.getByText('Not Started')).toBeInTheDocument();
    });

    it('defaults to Not Started when no status provided', () => {
      render(<TaskStatusPill />);
      expect(screen.getByText('Not Started')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size by default', () => {
      const { container } = render(<TaskStatusPill status="Completed" />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('text-[11px]');
    });

    it('renders medium size', () => {
      const { container } = render(<TaskStatusPill status="Completed" size="md" />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('text-xs');
    });

    it('renders large size', () => {
      const { container } = render(<TaskStatusPill status="Completed" size="lg" />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('text-sm');
    });
  });

  describe('Icon Display', () => {
    it('shows icon by default', () => {
      const { container } = render(<TaskStatusPill status="Completed" />);
      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('hides icon when withIcon is false', () => {
      const { container } = render(<TaskStatusPill status="Completed" withIcon={false} />);
      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<TaskStatusPill status="Completed" className="custom-class" />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('custom-class');
    });

    it('applies correct color classes for Not Started', () => {
      const { container } = render(<TaskStatusPill status="Not Started" />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('bg-slate-100');
      expect(pill?.className).toContain('text-slate-700');
    });

    it('applies correct color classes for In Progress', () => {
      const { container } = render(<TaskStatusPill status="In Progress" />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('bg-amber-100');
      expect(pill?.className).toContain('text-amber-800');
    });

    it('applies correct color classes for Completed', () => {
      const { container } = render(<TaskStatusPill status="Completed" />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('bg-emerald-100');
      expect(pill?.className).toContain('text-emerald-800');
    });
  });

  describe('Accessibility', () => {
    it('includes title attribute for screen readers', () => {
      render(<TaskStatusPill status="In Progress" />);
      const pill = screen.getByTitle('In Progress');
      expect(pill).toBeInTheDocument();
    });

    it('marks icon as decorative with aria-hidden', () => {
      const { container } = render(<TaskStatusPill status="Completed" />);
      const icon = container.querySelector('svg');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
