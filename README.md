# GlobeTrotter Quiz 🌍

An engaging geography quiz game where users can test their knowledge, challenge friends, and learn interesting facts about destinations around the world.

![GlobeTrotter Screenshot](screenshot.png)

## Features

- 🎮 Interactive Geography Quiz
- 🏆 Real-time Score Tracking
- 👥 Challenge Friends via WhatsApp
- 🔐 User Authentication
- 📱 Responsive Design
- 🎨 Modern UI with Ant Design
- ✨ Engaging Animations & Effects

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Ant Design** - UI component library
- **Styled Components** - Styling solution
- **React Router** - Navigation
- **HTML2Canvas** - Share image generation

### Development
- **Vite** - Build tool
- **ESLint** - Linting
- **Jest** - Testing
- **React Testing Library** - Component testing

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- A running backend server (see [Backend Repository](link-to-backend))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/globetrotter-quiz.git
cd globetrotter-quiz
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_SERVER_URL=http://localhost:1504
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Testing

Run the test suite:
```bash
npm test
```

## Project Structure

```
src/
├── components/           # React components
│   ├── Auth.tsx         # Login/Register
│   └── Game.tsx         # Main game
├── config/              # Configuration
│   └── env.ts           # Environment variables
├── __tests__/          # Test files
├── App.tsx             # Root component
└── main.tsx           # Entry point
```

## Key Design Decisions

### Why Ant Design?
- Professional UI components
- Rich ecosystem
- Built-in responsive design
- Consistent design language
- Excellent TypeScript support

### Why Styled Components?
- Component-based styling
- Dynamic styling with props
- No class name conflicts
- Better maintainability
- Theme support

### Why Vite?
- Extremely fast HMR
- Built-in TypeScript support
- Modern architecture
- Better development experience
- Smaller bundle size

## API Integration

The app expects these endpoints:

```typescript
// Auth
POST /users/login    - Login user
POST /users/register - Register new user

// Game
GET /game/question   - Get new question
POST /game/answer    - Submit answer
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Development Notes

### Environment Variables
- `VITE_SERVER_URL`: Backend API URL

### Authentication Flow
1. User registers/logs in
2. JWT token stored in localStorage
3. Token included in all game API requests
4. Auto-redirect to login when token expires

### Challenge System
1. User generates challenge link
2. Link includes encoded score data
3. Recipients see challenge banner
4. Score comparison after completion

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run test     # Run tests
npm run lint     # Run ESLint
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
