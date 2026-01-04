# ShareSync Frontend 🚀

> Transform productivity into an identity-forming RPG

ShareSync is an open-source project management application that makes work addictive through behavioral science, gamification, and real-time collaboration.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Discord](https://img.shields.io/badge/discord-join-7289da.svg)](https://discord.gg/sharesync)

## ✨ Features

### 🎮 Gamification & Behavioral Science
- **XP System** - Earn points for completing tasks and shipping features
- **Streaks** - Build momentum with daily ship streaks
- **Achievements** - Unlock badges and milestones
- **Energy-Based Planning** - Match tasks to your energy levels
- **AI Mentor** - Personalized coaching and insights

### 🤝 Real-Time Collaboration
- **Live Cursors** - See teammates working in real-time
- **Team Chat** - End-to-end encrypted messaging
- **Announcements** - Keep everyone aligned
- **Co-work Sessions** - Schedule and track paired work

### 📊 Project Health Monitoring
- **Project Heartbeat** - Track activity and momentum
- **Team Balance** - Monitor work distribution
- **Burnout Detection** - AI-powered wellness alerts
- **Analytics Dashboard** - Insights and patterns

### 🔒 Privacy First
- **End-to-end encryption** for all chats
- **Server-side encryption** for files
- **Anonymous analytics** only
- **Zero-knowledge architecture**
- **No data selling, ever**

### 🌍 Social Discovery
- **Hot Streaks** - Find teams crushing it
- **Pattern Matching** - Connect with people who work like you
- **Quiet but Promising** - Help projects that stalled

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- A ShareSync backend instance (see [ShareSync-backend](https://github.com/ShareSync/ShareSync-backend))

### Installation
```bash
# Clone the repository
git clone https://github.com/ShareSync/ShareSync-frontend.git
cd ShareSync-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app!

### Build for Production
```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Socket.IO Client** - Real-time updates
- **Lucide React** - Icons
- **Axios** - HTTP client

## 📁 Project Structure
```
ShareSync-frontend/
├── src/
│   ├── api/              # API client functions
│   ├── components/       # Reusable UI components
│   │   ├── ecosystem/    # Home page widgets
│   │   ├── project/      # Project-specific components
│   │   ├── trust/        # Privacy badges
│   │   └── ui/           # Base UI components
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page-level components
│   ├── services/         # Business logic services
│   ├── styles/           # Global CSS
│   └── utils/            # Utility functions
├── public/               # Static assets
└── package.json
```

## 🎨 Design System

ShareSync uses a custom design system built on:
- **Purple-Fuchsia gradients** for primary actions
- **Glassmorphism** for cards and panels
- **Dark mode** by default
- **Micro-interactions** for delight

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

### Good First Issues

Looking for somewhere to start? Check out issues labeled:
- [`good first issue`](https://github.com/ShareSync/ShareSync-frontend/labels/good%20first%20issue)
- [`help wanted`](https://github.com/ShareSync/ShareSync-frontend/labels/help%20wanted)

## 📜 License

ShareSync is open source software licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

Built with love by the ShareSync community. Special thanks to all our contributors!

## 📞 Contact

- **Website**: [sharesync.com](https://sharesync.com)
- **Discord**: [Join our community](https://discord.gg/sharesync)
- **Email**: hello@sharesync.com
- **Twitter**: [@ShareSyncApp](https://twitter.com/ShareSyncApp)

## 🗺️ Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Offline mode with sync
- [ ] Calendar integrations
- [ ] AI-powered task recommendations
- [ ] Team analytics dashboard
- [ ] Custom themes and branding

## 💖 Sponsors

ShareSync is made possible by our amazing sponsors. [Become a sponsor](https://github.com/sponsors/ShareSync)!

---

**Built with behavioral science. Powered by community. Made for makers.** 🚀
