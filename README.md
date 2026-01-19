# Greed Scorekeeper

A Progressive Web App (PWA) score tracker for the Greed dice game (also known as Farkle), built with Angular and Ionic.

## Features

- **Score Tracking** - Track scores for multiple players with preset point values
- **Custom Rules** - Configure target score, on-board threshold, overshoot penalties, and carry-over rules
- **Player Management** - Track multiple players across games
- **Game History** - View past games and turn logs
- **Player Statistics** - Track individual player stats including games played, wins, and more
- **Cloud Sync** - Sign in with Google to sync your data across devices
- **Dark Mode** - Automatic dark/light theme based on system preference

## Tech Stack

- **Angular 19** - Frontend framework
- **Ionic 8** - UI components and mobile-first design
- **Firebase** - Authentication (Google) and Firestore for cloud sync
- **Dexie.js** - IndexedDB wrapper for local data persistence
- **Swiper** - Touch-friendly carousels

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at `http://localhost:4200`

### Build for Production

```bash
npm run build
```

Output will be in `www/`

### Deploy to Firebase Hosting

```bash
# Login to Firebase (first time only)
firebase login

# Build and deploy
npm run deploy
```

## Project Structure

```
src/
├── app/
│   ├── auth/           # Login page and authentication
│   ├── game/           # Game management and history
│   ├── home/           # Home page
│   ├── play/           # Score tracking playground
│   ├── player/         # Player management and stats
│   ├── settings/       # App settings
│   └── shared/         # Shared services, types, and utilities
│       ├── auth.service.ts    # Firebase authentication
│       ├── database.ts        # Dexie IndexedDB setup
│       ├── firebase.ts        # Firebase initialization
│       ├── sync.service.ts    # Cloud sync logic
│       └── types.ts           # TypeScript interfaces
├── assets/
│   ├── icons/          # App icons
│   └── svg/            # Icon SVGs
├── environments/       # Environment configurations
└── theme/              # Ionic theme variables
```

## Configuration

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** with Google sign-in
3. Enable **Firestore Database**
4. Add your Firebase config to `src/environments/environment.ts` and `environment.prod.ts`
5. Set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm run deploy` | Build and deploy to Firebase |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |

## License

Private - All rights reserved

## Author

Israel Dryer
