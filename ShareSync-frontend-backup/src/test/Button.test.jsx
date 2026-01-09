import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Simple Button component test
describe('Button Component', () => {
  it('should render button with text', () => {
    const ButtonComponent = ({ children, onClick }) => (
      <button onClick={onClick}>{children}</button>
    );
    
    render(<ButtonComponent>Click Me</ButtonComponent>);
    
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const ButtonComponent = ({ children, onClick }) => (
      <button onClick={onClick}>{children}</button>
    );
    
    const user = userEvent.setup();
    render(<ButtonComponent onClick={handleClick}>Click Me</ButtonComponent>);
    
    await user.click(screen.getByText('Click Me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
