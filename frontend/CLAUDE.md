# Learn English Frontend - Technical Context

## Overview

This is the React + TypeScript frontend for the Learn English application, providing an interactive user interface for English language learning with real-time speaking practice, text analysis, and tutor portal functionality.

## Technology Stack

- **Framework**: React 18 with functional components and hooks
- **Language**: TypeScript with strict type checking and comprehensive type definitions
- **Routing**: React Router v6 for client-side navigation with typed route parameters
- **Styling**: Tailwind CSS with responsive design and custom design system
- **State Management**: React Context API with useReducer pattern (fully typed)
- **HTTP Client**: Axios with JWT token interceptors and typed API responses
- **WebSocket**: Native WebSocket API for real-time communication with typed message protocols
- **Audio**: MediaRecorder API for speech capture with TypeScript interfaces
- **UI Components**: Headless UI, Heroicons (typed component props)
- **Testing**: Jest, React Testing Library with TypeScript support
- **Build**: Create React App with TypeScript configuration
- **Linting**: ESLint with TypeScript rules and Prettier for code formatting

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx                # Main application component with routing
│   ├── index.tsx              # Application entry point
│   ├── components/            # Reusable UI components (TypeScript)
│   │   ├── AppHeader/
│   │   │   ├── AppHeader.tsx  # Global navigation header
│   │   │   └── UserMenu.tsx   # User dropdown menu
│   │   ├── Card/
│   │   │   └── Card.tsx       # Resource display cards
│   │   ├── ModalDetail/
│   │   │   └── ModalDetail.tsx # Modal for resource details
│   │   ├── ProtectedRoute.tsx # Route protection with role checks
│   │   ├── SearchBar/
│   │   │   ├── SearchBar.tsx      # Debounced search input
│   │   │   └── EnhancedSearchBar.tsx # Enhanced search with features
│   │   └── Speak/
│   │       ├── MediaRecorderHook.ts  # Custom hook for audio recording
│   │       ├── SpeakSession.tsx      # Speaking session interface
│   │       └── WSClient.ts           # WebSocket client wrapper
│   ├── hooks/                 # Custom React hooks (TypeScript)
│   │   └── useDebounce.ts     # Debouncing utility hook
│   ├── pages/                 # Route-level components (TypeScript)
│   │   ├── Home.tsx           # Main dashboard with search
│   │   ├── Login.tsx          # Authentication page
│   │   ├── OAuthCallback.tsx  # OAuth callback handler
│   │   ├── Profile.tsx        # User profile management
│   │   ├── Speak.tsx          # Speaking practice dashboard
│   │   ├── SpeakDetail.tsx    # Speaking session results
│   │   ├── History.tsx        # User learning history
│   │   └── TutorPortal/
│   │       ├── StudentDetail.tsx # Individual student analytics
│   │       └── TutorPortal.tsx   # Tutor dashboard
│   ├── services/              # API integration layer (TypeScript)
│   │   ├── api.ts             # Axios configuration and interceptors
│   │   ├── auth.ts            # Authentication service
│   │   ├── speakService.ts    # Speaking session API calls
│   │   ├── textService.ts     # Text processing API calls
│   │   └── tutorService.ts    # Tutor portal API calls
│   ├── store/                 # State management (TypeScript)
│   │   └── authStore.tsx      # Authentication state management
│   ├── types/                 # TypeScript type definitions
│   │   ├── index.ts           # Re-export all types
│   │   ├── api.types.ts       # API-related types
│   │   ├── auth.types.ts      # Authentication types
│   │   ├── common.types.ts    # Common utility types
│   │   ├── components.types.ts # Component prop types
│   │   ├── speak.types.ts     # Speaking session types
│   │   ├── text.types.ts      # Text processing types
│   │   └── tutor.types.ts     # Tutor portal types
│   ├── utils/                 # Utility functions and helpers
│   │   ├── index.ts           # Re-export all utilities
│   │   ├── constants.ts       # Application constants
│   │   ├── formatters.ts      # Data formatting functions
│   │   ├── validators.ts      # Input validation functions
│   │   └── apiHelpers.ts      # API utility functions
│   └── index.css              # Global styles with Tailwind
├── public/
│   ├── index.html             # HTML template
│   └── manifest.json          # PWA configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── .eslintrc.json             # ESLint configuration for TypeScript
├── .prettierrc                # Prettier configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── postcss.config.js          # PostCSS configuration
```

## TypeScript Architecture

### Type System Overview

The application uses a comprehensive type system organized in `src/types/`:

#### Core Type Categories

1. **Common Types** (`common.types.ts`)
   - Base entities, pagination, API responses
   - Utility types and enums
   - User roles, status enums
   - Generic async state types

2. **Authentication Types** (`auth.types.ts`)
   - User interface with preferences and statistics
   - Authentication state and actions
   - OAuth provider configuration
   - JWT token interfaces

3. **Component Types** (`components.types.ts`)
   - Props interfaces for all React components
   - Event handler type definitions
   - Form field and button interfaces
   - Modal and layout component types

4. **API Types** (`api.types.ts`)
   - Axios configuration and error handling
   - Request/response type definitions
   - WebSocket configuration
   - Cache and interceptor types

5. **Domain-Specific Types**
   - **Text Types**: Resource processing, search parameters
   - **Speaking Types**: Session management, evaluation results
   - **Tutor Types**: Student progress, feedback interfaces

### Type Safety Features

- **Strict TypeScript Configuration**: All strict flags enabled
- **Path Aliases**: `@/` for clean imports from src directory
- **Generic Types**: Reusable type patterns for API responses
- **Enum Usage**: Type-safe constants for status, roles, etc.
- **Utility Types**: Custom utility types for common patterns

## Component Architecture

### Core Layout Components

#### AppHeader (`components/AppHeader/AppHeader.tsx`)
- Global navigation with responsive design
- Integrated search bar with debounced queries
- User menu with role-based options
- Speak button for quick access to practice sessions
- Notification badge for tutors

Props Interface:
```typescript
interface AppHeaderProps {
  logo?: Logo;
  notifications?: Notification[];
}
```

#### ProtectedRoute (`components/ProtectedRoute.tsx`)
- Route protection with authentication check
- Role-based access control (RBAC)
- Automatic redirect to login for unauthorized users
- Support for multiple required roles

Props Interface:
```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  fallback?: ReactNode;
}
```

### Page Components

#### Home (`pages/Home.tsx`)
- Main dashboard with search functionality
- Resource cards displaying text learning content
- Recent activity and favorites sections
- Quick access to speaking practice

#### Login (`pages/Login.tsx`)
- Social authentication (Google, Instagram)
- OAuth flow handling
- Responsive design with loading states
- Error handling and user feedback

#### Speak (`pages/Speak.tsx`)
- Speaking practice dashboard
- Session history with status indicators
- Active sessions management
- Quick start functionality

#### SpeakDetail (`pages/SpeakDetail.tsx`)
- Detailed evaluation results
- Audio playback controls
- Performance metrics visualization
- Feedback from tutors

### Interactive Components

#### SpeakSession (`components/Speak/SpeakSession.tsx`)
- Real-time speaking session interface
- Audio recording controls
- WebSocket connection management
- Live transcription display
- Session progress tracking

#### SearchBar (`components/SearchBar/SearchBar.tsx`)
- Debounced search input (500ms delay)
- Loading states and error handling
- Search suggestions and filtering
- Keyboard navigation support

#### Card (`components/Card/Card.tsx`)
- Resource display with consistent styling
- Interactive hover states
- Favorite toggle functionality
- Type-specific styling (vocabulary/phrase/grammar)

Props Interface:
```typescript
interface CardProps {
  resource: TextResource;
  onClick?: (resource: TextResource) => void;
  onFavorite?: (resource: TextResource) => void;
  showFavorite?: boolean;
  showTimestamp?: boolean;
  className?: string;
}
```

## State Management

### Authentication Store (`store/authStore.tsx`)
Uses React Context + useReducer pattern with full TypeScript typing:

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };
```

### Authentication Flow
1. Check localStorage for existing token on app load
2. Validate token and restore user session
3. Handle OAuth callbacks from social providers
4. Store authentication data in localStorage
5. Provide authentication context to all components

## API Integration

### Axios Configuration (`services/api.ts`)
- Base URL configuration with environment variables
- JWT token injection via request interceptors
- Automatic token refresh on 401 responses
- Error handling and user feedback
- Request/response logging in development
- Full TypeScript typing for requests and responses

### Service Layer
Each service module provides fully typed API functions:

#### authService (`services/auth.ts`)
```typescript
interface OAuthData {
  code: string;
  state?: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}
```

#### textService (`services/textService.ts`)
```typescript
async processText(
  query: string, 
  context: Partial<ProcessTextRequest> = {}
): Promise<ProcessTextResponse>

async searchResources(
  params: Partial<SearchTextParams> = {}
): Promise<PaginationResponse<TextResource>>
```

#### speakService (`services/speakService.ts`)
- Speaking session management with typed interfaces
- WebSocket connection utilities
- Audio file handling with proper types

#### tutorService (`services/tutorService.ts`)
- Student list and analytics with typed responses
- Progress tracking interfaces
- Feedback and rating systems

## WebSocket Implementation

### WSClient (`components/Speak/WSClient.ts`)
Real-time communication wrapper with TypeScript interfaces:

- **Connection Management**: Auto-reconnection with exponential backoff
- **Message Handling**: Typed JSON message parsing and routing
- **Audio Streaming**: Binary frame support for audio data
- **Error Recovery**: Connection state management and error handling
- **Event System**: Observable pattern for component communication

#### WebSocket Protocol Types
```typescript
interface WSStartMessage extends WSMessage {
  type: 'start';
  config: {
    subject: string;
    speak_time: number;
    type: SpeakType;
  };
}

interface WSAckMessage extends WSMessage {
  type: 'ack';
  session_id: string;
  max_duration: number;
}

interface WSFinalMessage extends WSMessage {
  type: 'final';
  session_id: string;
  evaluation_result: SpeakEvaluation;
  tts_url?: string;
  transcript: string;
}
```

## Audio Processing

### MediaRecorder Integration (`components/Speak/MediaRecorderHook.ts`)
Custom hook providing typed interfaces:
- Browser compatibility checking
- Audio stream initialization
- Recording controls (start/stop/pause)
- Chunk-based streaming for real-time processing
- Format negotiation and fallbacks

#### Interface Definition
```typescript
interface MediaRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  isSupported: boolean;
  error: string | null;
  duration: number;
  audioLevel: number;
}

interface RecordingConfig {
  mimeType?: string;
  audioBitsPerSecond?: number;
  sampleRate?: number;
  channels?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}
```

#### Supported Formats
- Primary: `audio/webm;codecs=opus`
- Fallback: `audio/webm`, `audio/mp4`, `audio/wav`

## Routing Architecture

### Route Structure (`App.tsx`)
```typescript
/ → Home (protected)
/login → Login (public)
/oauth/callback → OAuthCallback (public)
/speak → Speak (protected)
/speak/:id → SpeakDetail (protected)
/profile → Profile (protected)
/tutor → TutorPortal (protected, TUTOR/ADMIN only)
/tutor/student/:id → StudentDetail (protected, TUTOR/ADMIN only)
```

### Route Protection
- Authentication check for all protected routes
- Role-based access control (RBAC) with typed roles
- Automatic redirect to login
- Preserved intended destination after login

## Utility System

### Constants (`utils/constants.ts`)
- Application configuration constants
- API endpoint definitions
- Theme colors and design tokens
- Error and success message constants

### Formatters (`utils/formatters.ts`)
- Date and time formatting functions
- File size and duration formatters
- Score and percentage formatting
- Text manipulation utilities

### Validators (`utils/validators.ts`)
- Email and password validation
- File type and size validation
- Text length and format validation
- Form field validation helpers

### API Helpers (`utils/apiHelpers.ts`)
- Error message extraction
- Query string building
- Retry logic with exponential backoff
- File download utilities

## Styling System

### Tailwind CSS Configuration
- Custom color palette for brand consistency
- Responsive breakpoints (mobile-first)
- Component utility classes
- Dark mode support (planned)
- TypeScript-compatible configuration

### Design System
- Consistent spacing scale (4px base unit)
- Typography scale with semantic naming
- Color system with accessibility compliance
- Interactive state management (hover/focus/active)

## Performance Optimization

### Code Splitting
- Route-based code splitting with React.lazy()
- Component-level splitting for large features
- Service worker for caching (via CRA)

### API Optimization
- Request debouncing for search inputs
- Response caching with axios interceptors
- Pagination for large data sets
- Optimistic updates for better UX

### Audio Processing
- Chunk-based streaming for real-time feedback
- WebWorker for audio processing (planned)
- Compression for audio transmission
- Connection pooling for WebSocket

## Error Handling

### Global Error Boundaries
- Component error boundaries for graceful degradation
- API error handling with user-friendly messages
- Network error recovery and retry logic
- Logging for debugging and monitoring

### TypeScript Error Prevention
- Compile-time type checking prevents runtime errors
- Strict null checks prevent undefined access
- Exhaustive type matching with discriminated unions
- Interface contracts ensure API compatibility

### User Experience
- Loading states for all async operations
- Error messages with actionable guidance
- Fallback content for failed states
- Accessibility considerations

## Development Workflow

### Environment Configuration
```bash
# Development
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development

# Production
REACT_APP_API_URL=https://api.learnenglish.com
REACT_APP_ENVIRONMENT=production
```

### Available Scripts
```bash
npm start      # Development server (port 3000)
npm build      # Production build with TypeScript checking
npm test       # Jest test runner with TypeScript support
npm run lint   # ESLint code checking with TypeScript rules
```

### Development Tools
- React DevTools for component debugging
- TypeScript Language Server for IntelliSense
- Network tab for API monitoring
- WebSocket inspector for real-time debugging

## Testing Strategy

### Unit Testing
- Component rendering tests with React Testing Library
- Custom hook testing with testing utilities
- Service layer testing with mocked APIs
- Utility function testing with Jest
- TypeScript type testing with type assertions

### Integration Testing
- User flow testing with realistic scenarios
- WebSocket connection testing with mock servers
- Authentication flow testing
- Cross-component interaction testing

### Type Testing
- Interface contract testing
- Generic type behavior verification
- Enum and constant value testing
- API response type validation

### E2E Testing (Planned)
- Critical user journeys
- Speaking session workflows
- Authentication flows
- Responsive design testing

## Accessibility

### WCAG Compliance
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

### Interactive Elements
- Focus management for modals and dropdowns
- Skip links for keyboard users
- Alt text for images
- Form label associations

## Security Considerations

### Client-Side Security
- JWT token storage in localStorage (with expiration)
- XSS prevention with React's built-in escaping
- CSRF protection via SameSite cookies
- Secure WebSocket connections (WSS)

### TypeScript Security Benefits
- Prevention of property access errors
- Type-safe API data handling
- Compile-time validation of user input processing
- Interface contracts prevent data shape mismatches

### Data Protection
- No sensitive data in client-side storage
- Automatic token cleanup on logout
- Secure OAuth state management
- Input sanitization before API calls

## Deployment

### Build Process
- TypeScript compilation with strict checking
- Create React App build optimization
- Environment variable injection
- Static asset optimization
- Service worker generation

### Hosting Options
- Nginx for static file serving
- CDN integration for global delivery
- Docker containerization
- Kubernetes deployment (planned)

## Integration with Backend

### API Communication
- RESTful API consumption with typed responses
- WebSocket real-time communication with typed messages
- File upload/download handling
- Authentication token management

### Data Flow
1. User interactions trigger typed service calls
2. Services make authenticated HTTP requests
3. Typed responses update component state
4. UI re-renders with new data
5. WebSocket events update real-time features

## Future Enhancements

### Planned Features
- Progressive Web App (PWA) capabilities
- Offline mode with data synchronization
- Push notifications for tutors
- Advanced audio visualization
- Mobile app with React Native

### TypeScript Improvements
- Stricter type checking with exactOptionalPropertyTypes
- Template literal types for API endpoints
- Branded types for IDs and sensitive data
- Advanced utility types for complex transformations

### Performance Improvements
- Virtual scrolling for large lists
- WebWorker for background processing
- Service worker caching strategy
- Bundle size optimization