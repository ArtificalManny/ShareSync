# Contributing to ShareSync

Thank you for your interest in contributing to ShareSync! 🎉

ShareSync is an open-source project management tool designed to make work addictive through behavioral science and gamification. We welcome contributions from everyone.

## 🌟 Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Git** for version control
- A **GitHub account**

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
   git clone https://github.com/YOUR-USERNAME/ShareSync-frontend.git
   cd ShareSync-frontend
```

3. Add upstream remote:
```bash
   git remote add upstream https://github.com/ShareSync/ShareSync-frontend.git
```

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🎯 How Can I Contribute?

### Reporting Bugs 🐛

Before creating a bug report:
- Check the [issue tracker](https://github.com/ShareSync/ShareSync-frontend/issues) to avoid duplicates
- Collect information about the bug (browser, OS, steps to reproduce)

When filing a bug report, include:
- **Clear title** and description
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (browser, OS, Node version)

### Suggesting Enhancements ✨

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a **clear and descriptive title**
- Provide a **detailed description** of the proposed feature
- Explain **why this enhancement would be useful**
- Include **mockups or examples** if possible

### Your First Code Contribution 🎉

Unsure where to start? Look for issues labeled:
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `bug` - Something isn't working

### Pull Request Process

1. **Create a branch** for your work:
```bash
   git checkout -b feature/amazing-feature
```

2. **Make your changes** following our code style (see below)

3. **Test your changes** thoroughly:
```bash
   npm run lint
   npm run build
```

4. **Commit your changes** with clear messages:
```bash
   git commit -m "feat: Add amazing feature"
```
   
   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting)
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**:
```bash
   git push origin feature/amazing-feature
```

6. **Open a Pull Request** on GitHub with:
   - Clear title and description
   - Reference to related issues (e.g., "Fixes #123")
   - Screenshots/videos for UI changes
   - Test results

## 💻 Code Style Guide

### JavaScript/React

- Use **functional components** with hooks
- Use **descriptive variable names** (`user`, `project`, not `x`, `temp`)
- Add **comments** for complex logic
- Keep components **small and focused** (< 300 lines)
- Use **PropTypes** or TypeScript for prop validation

### File Structure
```
src/
├── components/       # Reusable UI components
├── pages/           # Page-level components
├── hooks/           # Custom React hooks
├── context/         # React Context providers
├── api/             # API client functions
├── utils/           # Utility functions
└── styles/          # CSS files
```

### Component Example
```jsx
// Good: Clear, documented, small
import React, { useState } from 'react';
import { Rocket } from 'lucide-react';

/**
 * ShipButton - Allows users to "ship" a task
 * @param {string} taskId - ID of the task to ship
 * @param {function} onShip - Callback when ship is successful
 */
const ShipButton = ({ taskId, onShip }) => {
  const [loading, setLoading] = useState(false);

  const handleShip = async () => {
    setLoading(true);
    try {
      await shipTask(taskId);
      onShip?.();
    } catch (error) {
      console.error('Failed to ship:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleShip}
      disabled={loading}
      className="px-4 py-2 bg-purple-600 rounded-lg"
    >
      <Rocket className="w-4 h-4" />
      {loading ? 'Shipping...' : 'Ship'}
    </button>
  );
};

export default ShipButton;
```

### CSS/Styling

- Use **Tailwind CSS** utility classes
- Use **semantic class names** for custom CSS
- Keep custom CSS to a minimum
- Use CSS variables for theming

### Naming Conventions

- **Components**: PascalCase (`UserProfile.jsx`)
- **Hooks**: camelCase with 'use' prefix (`useAuth.js`)
- **Utils**: camelCase (`formatDate.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

## 🧪 Testing

- Write tests for new features
- Ensure existing tests pass
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test mobile responsiveness

## 📚 Documentation

- Update README.md if you change setup steps
- Add JSDoc comments for complex functions
- Update CHANGELOG.md for notable changes
- Include inline comments for tricky code

## 🎨 Design Principles

ShareSync follows these core design principles:

1. **Behavioral Science First** - Every feature should leverage psychology
2. **Addictive, Not Overwhelming** - Balance excitement with simplicity
3. **Privacy-First** - User data is sacred
4. **Mobile-First** - Design for mobile, enhance for desktop
5. **Accessibility** - Everyone should be able to use ShareSync

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eligible for swag (coming soon!)

## 📝 Questions?

- Open a [Discussion](https://github.com/ShareSync/ShareSync-frontend/discussions)
- Join our [Discord](https://discord.gg/sharesync) (coming soon)
- Email us at opensource@sharesync.com

## 🙏 Thank You!

Your contributions make ShareSync better for everyone. We appreciate your time and effort! ❤️

---

**Happy Shipping! 🚀**
