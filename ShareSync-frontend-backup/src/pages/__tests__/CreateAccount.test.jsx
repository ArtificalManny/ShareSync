import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateAccount from '../CreateAccount';
import { AuthProvider } from '../../context/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API
vi.mock('../../api/client', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('CreateAccount Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCreateAccount = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <CreateAccount />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders create account form', () => {
    renderCreateAccount();
    
    expect(screen.getByText('ShareSync')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows all required labels and fields', () => {
    renderCreateAccount();
    
    // Check for labels (more robust than placeholders)
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText(/Username/i)).toBeInTheDocument();
    expect(screen.getByText(/Email/i)).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Confirm Password')).toBeInTheDocument();
  });

  it('allows user to type in name fields', () => {
    renderCreateAccount();
    
    const firstNameInput = screen.getByPlaceholderText('John');
    const lastNameInput = screen.getByPlaceholderText('Doe');
    
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });
    
    expect(firstNameInput.value).toBe('Jane');
    expect(lastNameInput.value).toBe('Smith');
  });

  it('has password fields', () => {
    renderCreateAccount();
    
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    expect(passwordInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('shows link to login page', () => {
    renderCreateAccount();
    
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });
});
