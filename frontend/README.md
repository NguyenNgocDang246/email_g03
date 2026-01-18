# Email Management System - Frontend

React-based single-page application (SPA) for managing Gmail emails with AI-powered features, built with modern web technologies.

## Overview

This is the frontend application for the Email Management System, providing an intuitive user interface for managing emails with features like AI summarization, semantic search, and Kanban board organization.

## Tech Stack

- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 7.x (ultra-fast HMR and builds)
- **Routing**: React Router DOM 7.x
- **State Management**:
  - Zustand (global state)
  - TanStack Query (server state, caching, infinite queries)
- **UI Framework**: Tailwind CSS 4.x
- **Icons**: Lucide React, React Icons
- **Drag & Drop**: @dnd-kit (Kanban board)
- **HTTP Client**: Axios (with interceptors)
- **Form Handling**: React Hook Form
- **HTML Sanitization**: DOMPurify (security)

## Features

### Core Features
- Google OAuth authentication flow
- Email list with infinite scroll
- Email detail view with rich content
- Compose and reply to emails
- Attachment upload and preview
- Search with keyword and semantic modes
- Mark emails as read/unread, star/unstar
- Delete emails

### Advanced Features
- **Dual View Modes**: Toggle between List and Kanban views
- **Kanban Board**: Drag-and-drop email organization
- **Custom Columns**: Create up to 10 custom Kanban columns
- **AI Email Summary**: View AI-generated email summaries
- **Semantic Search**: Find emails by meaning, not just keywords
- **Search Suggestions**: Auto-suggest based on email content
- **Open in Gmail**: Quick link to open email in Gmail web
- **Real-time Updates**: Automatic token refresh
- **Responsive Design**: Works on desktop and mobile

## Prerequisites

- Node.js v18.0.0 or higher
- npm v8.0.0 or higher
- Backend API running (see [Backend README](../backend/README.md))

## Installation & Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment (Optional)

Create a `.env` file in the frontend directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000

# Google OAuth Client ID (if using client-side OAuth)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**Note**: The app is configured to work with `http://localhost:3000` by default. Environment variables are optional unless you're using a different backend URL.

### 3. Run Development Server

```bash
npm run dev
```

The app will start on `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### 5. Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── api/                    # API client functions
│   │   ├── axios.ts           # Axios configuration with interceptors
│   │   ├── inbox.ts           # Email & mailbox API calls
│   │   ├── kanban.ts          # Kanban API calls
│   │   └── ai.ts              # AI features API calls
│   │
│   ├── components/            # React components
│   │   ├── Email/             # Email-related components
│   │   │   ├── EmailList.tsx         # Email list with infinite scroll
│   │   │   ├── EmailDetail.tsx       # Email detail view
│   │   │   ├── EmailListItem.tsx     # Single email item
│   │   │   └── NewMessage.tsx        # Compose email form
│   │   │
│   │   ├── Kanban/            # Kanban board components
│   │   │   ├── KanbanBoard.tsx       # Main board with DnD
│   │   │   ├── KanbanColumn.tsx      # Single column
│   │   │   ├── KanbanCard.tsx        # Email card
│   │   │   ├── EmailDetailPanel.tsx  # Email detail in Kanban
│   │   │   └── ToggleButton.tsx      # View mode toggle
│   │   │
│   │   ├── Layout/            # Layout components
│   │   │   ├── Header.tsx            # Top navigation bar
│   │   │   ├── Sidebar.tsx           # Mailbox sidebar
│   │   │   └── GuestHeader.tsx       # Header for guests
│   │   │
│   │   ├── Search/            # Search components
│   │   │   └── SearchBar.tsx         # Search with suggestions
│   │   │
│   │   └── UI/                # Reusable UI components
│   │       ├── AttachmentList.tsx    # Display attachments
│   │       └── ComposeButton.tsx     # Floating compose button
│   │
│   ├── context/               # React Context providers
│   │   └── MailContext.tsx           # Mail-related shared state
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useEmailData.ts           # Email data management
│   │   └── useAuth.ts                # Authentication helpers
│   │
│   ├── pages/                 # Page components (routes)
│   │   ├── inbox/
│   │   │   └── index.tsx             # Main inbox page
│   │   ├── login/
│   │   │   └── index.tsx             # Login page
│   │   └── register/
│   │       └── index.tsx             # Registration page
│   │
│   ├── store/                 # Zustand stores
│   │   └── useAuthStore.ts           # Auth state management
│   │
│   ├── constants/             # Constants and configurations
│   │   └── kanban.ts                 # Kanban default columns
│   │
│   ├── App.tsx                # Root component with routes
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
│
├── public/                    # Static assets
├── index.html                 # HTML template
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Key Components

### 1. EmailList Component
- Displays list of emails with infinite scroll
- Uses TanStack Query's `useInfiniteQuery` for pagination
- Supports bulk actions (select all, delete, mark as read)
- Shows email preview (sender, subject, date, snippet)

### 2. EmailDetail Component
- Displays full email content with HTML sanitization
- Shows AI-generated summary with metadata
- Handles attachments (upload, download, stream)
- Supports reply with rich text and attachments
- "Open in Gmail" button for quick access

### 3. KanbanBoard Component
- Drag-and-drop email organization using @dnd-kit
- Customizable columns (create, edit, delete, reorder)
- Email cards with sender, subject, and status
- Responsive design with column management

### 4. SearchBar Component
- Dual search modes: Keyword and Semantic
- Auto-suggestions based on email content
- Debounced search input (1 second)
- Search mode toggle

## State Management

### Zustand (Global State)
- **useAuthStore**: User authentication state
  - User info
  - Login/logout actions
  - Token management

### TanStack Query (Server State)
- **Infinite Queries**: Email pagination
- **Queries**: Mailboxes, email details, Kanban columns, AI summaries
- **Mutations**: Send email, reply, modify labels, update status
- **Caching**: Automatic cache management with invalidation
- **Optimistic Updates**: Instant UI updates before server confirmation

### React Context
- **MailContext**: Shared mail-related state
  - Search suggestions
  - Select on new mail toggle

## API Integration

### Axios Configuration
Located in `src/api/axios.ts`:

- Base URL: `http://localhost:3000` (configurable via `VITE_API_URL`)
- Automatic cookie handling (`withCredentials: true`)
- Request interceptor: Adds necessary headers
- Response interceptor: Handles 401 (token refresh) automatically

### API Modules

#### Inbox API (`src/api/inbox.ts`)
- `getMailBoxes()`: Get all mailboxes
- `getMailBoxesEmailListInfo()`: Get emails with pagination
- `getEmailDetail()`: Get email details
- `modifyEmail()`: Update email labels
- `replyEmail()`: Reply to email
- `updateEmailStatus()`: Update Kanban status
- `downloadAttachment()`: Stream attachment

#### Kanban API (`src/api/kanban.ts`)
- `getKanbanColumns()`: Get all columns
- `createKanbanColumn()`: Create new column
- `updateKanbanColumn()`: Update column details
- `deleteKanbanColumn()`: Delete column
- `reorderKanbanColumns()`: Reorder columns

#### AI API (`src/api/ai.ts`)
- `semanticSearchEmails()`: Semantic search
- `summarizeEmail()`: Get AI summary

## Routing

Routes are defined in `App.tsx`:

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Redirect | Redirects to `/login` |
| `/login` | LoginPage | User login |
| `/register` | RegisterPage | User registration |
| `/inbox/:id` | InboxPage | Main inbox with email list/detail |

### Protected Routes
All routes under `/inbox` require authentication. Unauthenticated users are redirected to `/login`.

## Authentication Flow

1. User clicks "Sign in with Google"
2. Redirect to backend: `GET /auth/google`
3. Backend redirects to Google OAuth consent screen
4. User authorizes application
5. Google redirects to: `GET /auth/google/callback?code=...`
6. Backend sets authentication cookies (accessToken, refreshToken)
7. Backend redirects to frontend: `http://localhost:5173/inbox/INBOX`
8. Frontend stores user in Zustand store
9. All API calls include cookies automatically

### Automatic Token Refresh
- When access token expires (401 error)
- Axios interceptor automatically calls `GET /token/refresh`
- New access token set in cookie
- Original request retried
- User experiences no interruption

## Styling

### Tailwind CSS 4.x
- Utility-first CSS framework
- Custom configuration in `tailwind.config.js`
- Responsive design with breakpoints
- Dark mode support (if enabled)

### Component Styling Patterns
- Use Tailwind utility classes
- Conditional classes for states (hover, active, selected)
- Consistent spacing and colors
- Responsive layouts with flexbox and grid

## Development

### Available Scripts

```bash
# Start development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint

# Type check (no emit)
npx tsc --noEmit
```

### Development Tips

1. **Hot Module Replacement (HMR)**: Vite provides instant updates without full page reload
2. **React DevTools**: Use browser extension for debugging
3. **TanStack Query DevTools**: Inspect queries and mutations in dev mode
4. **Network Tab**: Monitor API calls and responses
5. **Console Warnings**: Fix React warnings for better performance

### Code Style

- Use TypeScript for type safety
- Follow React best practices (hooks, functional components)
- Use semantic HTML
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TanStack Query for all server data
- Avoid prop drilling (use Context or Zustand)

## Building for Production

### Optimization

Vite automatically optimizes the production build:

- **Code Splitting**: Automatic chunk splitting
- **Tree Shaking**: Removes unused code
- **Minification**: Compresses JavaScript and CSS
- **Asset Optimization**: Optimizes images and fonts
- **Lazy Loading**: Routes and components loaded on demand

### Build Output

```bash
npm run build
```

Output directory: `dist/`

```
dist/
├── assets/           # JS, CSS chunks with hashed filenames
├── index.html        # Entry HTML with injected scripts
└── ...               # Other optimized assets
```

## Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables** (if needed)
   ```
   VITE_API_URL=https://your-backend-api.com
   ```

4. **Deploy**
   - Automatic deployment on git push
   - Preview deployments for PRs

### Other Platforms

#### Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Add `_redirects` file for SPA routing:
  ```
  /* /index.html 200
  ```

#### Static Hosting (AWS S3, Cloudflare Pages)
- Upload `dist/` folder contents
- Configure for SPA (redirect all routes to index.html)

#### Traditional Hosting (Nginx, Apache)
- Upload `dist/` folder
- Configure web server for SPA routing

**Example Nginx config:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Environment Variables

Environment variables must be prefixed with `VITE_` to be exposed to the app.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` | No |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | - | No |

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Troubleshooting

### Common Issues

**Issue**: "Cannot connect to backend"
- Verify backend is running on port 3000
- Check `VITE_API_URL` if configured
- Check browser console for CORS errors

**Issue**: "OAuth redirect not working"
- Verify redirect URI in Google Cloud Console
- Check backend `FRONTEND_URL` environment variable

**Issue**: "Emails not loading"
- Check authentication (look for 401 errors)
- Verify cookies are enabled in browser
- Check Network tab for failed requests

**Issue**: "Build fails with TypeScript errors"
- Run `npm run lint` to see all errors
- Fix type errors before building
- Check `tsconfig.json` configuration

**Issue**: "Infinite scroll not working"
- Verify `hasNextPage` is true
- Check `fetchNextPage` is called correctly
- Look for errors in TanStack Query DevTools

### Debug Mode

Enable debug logging in development:

```typescript
// In main.tsx
if (import.meta.env.DEV) {
  console.log('Debug mode enabled');
}
```

## Performance Optimization

### Implemented Optimizations

1. **Infinite Scroll**: Load emails in batches (50 per page)
2. **Query Caching**: TanStack Query caches server responses
3. **Debounced Search**: Reduces API calls (1 second delay)
4. **Lazy Loading**: Routes loaded on demand
5. **Code Splitting**: Automatic with Vite
6. **Memoization**: React.useMemo for expensive computations
7. **Virtual Lists**: Consider for very long email lists

### Best Practices

- Avoid unnecessary re-renders
- Use React.memo for expensive components
- Optimize images (use WebP, lazy load)
- Minimize bundle size (check with `npm run build`)
- Use production builds in production

## Security

### Implemented Security Measures

1. **HttpOnly Cookies**: Tokens protected from XSS
2. **HTML Sanitization**: DOMPurify cleans email HTML
3. **CORS**: Backend configures allowed origins
4. **HTTPS**: Required in production
5. **Input Validation**: Form validation on client side
6. **No Secrets in Code**: Environment variables for sensitive data

### Security Best Practices

- Never log sensitive data
- Validate user input
- Use HTTPS in production
- Keep dependencies updated
- Follow React security guidelines

## Contributing

When contributing to the frontend:

1. Follow existing code style
2. Use TypeScript for all new code
3. Write meaningful component names
4. Add comments for complex logic
5. Test in both List and Kanban views
6. Test on mobile and desktop
7. Run linter before committing

## License

This project is licensed under the UNLICENSED license.

## Related Documentation

- [Main README](../README.md) - Project overview
- [Backend README](../backend/README.md) - Backend API documentation
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)
