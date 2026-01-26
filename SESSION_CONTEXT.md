# Session Context - 2026 Vision Bingo

**Last Updated:** 2026-01-26

## Current Status

### ✅ What's Working (Phases 1-5 Complete)

- **Landing page** (`src/app/page.tsx`): Name-based authentication flow complete
  - Checks if user exists by name
  - Creates new user + bingo card + 9 empty goals if new (3x3 grid)
  - Navigates to `/card?userId={userId}` after login/signup

- **Card Page** (`src/app/card/page.tsx`): Fully functional with data persistence
  - Accepts `userId` query param
  - Loads user's bingo card + goals from Supabase
  - Renders `<BingoCard>` component with live data
  - All CRUD operations wired to Supabase (updates persist to database)
  - Loading and error states handled

- **Design System** (`src/app/globals.css`): Tailwind configured with DESIGN.md colors
  - CSS custom properties: `--color-bingo-bg`, `--color-square-light`, `--color-square-dark`, etc.
  - Space Mono font integrated in `layout.tsx`

- **BingoCard Component** (`src/components/BingoCard.tsx`): Enhanced interactive UI
  - 3x3 grid with checkerboard pattern (alternating beige/taupe) - mobile-first design
  - **NEW INTERACTION MODEL:**
    - **Desktop:** Click all 4 corners of a box to mark complete
    - **Mobile:** Swipe across box 3 times to mark complete
    - **Edit:** Double-click (or tap) to edit goal text
  - Visual feedback: corner dots (fill when clicked), swipe counter
  - Empty goal boxes show no placeholder text (cleaner look)
  - Click to edit quote/intention at bottom
  - Heart icon in center free space (position 4)
  - Help button (?) with instructions modal
  - Callbacks: `onUpdateGoal`, `onToggleComplete`, `onUpdateQuote`

- **Enhanced Long Press Interaction** (`src/components/BingoCard.tsx`): Phase 4.6 complete
  - Press and hold for 2 seconds to mark goal complete
  - Progress ring grows from 25% → 100% with smooth animation
  - Haptic feedback on start (light) and completion (heavy)
  - Prevents DOM text highlighting on mobile (touchAction: 'none')
  - Only activates on boxes with goal text (not empty boxes)
  - Movement threshold (10px) cancels long press if finger/mouse moves

- **Share & Export Features** (Phase 5 complete)
  - **Shareable URLs**: `/card/[cardId]` dynamic route for public viewing
  - **Public View Page**: Read-only view for anyone with the link
  - **Copy Link Button**: "Share Card" button copies shareable URL
  - **Download Image**: "Download Image" button exports card as PNG (html2canvas)
  - **Print-Friendly CSS**: Media queries optimize card for printing
  - Shows owner's name on public view ("User's 2026 Vision Board")
  - Help button and edit functionality hidden in read-only mode

### 🚧 What's Next (Phase 6: Authentication with Supabase Auth)

**PRIORITY:** Implement proper authentication before adding sensitive features (diary entries, personal notes).

**Why Auth is Critical:**
- Current name-based system breaks with duplicate names (no uniqueness)
- No security - anyone who knows/guesses a name can access that account
- Upcoming features (diary, subtasks) contain sensitive personal data
- Need proper user identity verification before proceeding

**Phase 6 Implementation:**
1. **Enable Supabase Auth**
   - Enable Email/Password provider in Supabase Dashboard
   - Configure email templates (confirmation, password reset)
   - Set up redirect URLs for local dev and production

2. **Update Database Schema**
   - Drop old `users` table
   - Create `user_profiles` table (extends auth.users with display_name)
   - Update `bingo_cards.user_id` FK to point to `auth.users.id`
   - Add Row Level Security (RLS) policies:
     - Users can only read/write their own cards
     - Public cards readable by anyone (for sharing)

3. **Create Auth Components**
   - SignUp component (email, password, display name)
   - Login component (email, password)
   - Password reset flow
   - Auth context/provider for session management

4. **Update Landing Page**
   - Replace simple name input with Login/SignUp forms
   - Handle auth state changes
   - Redirect to dashboard after login

5. **Session Management**
   - Check for existing session on app load
   - Auto-refresh tokens
   - Logout functionality
   - Protected routes (redirect to login if not authenticated)

6. **Data Migration**
   - Script to migrate existing users to Supabase Auth (if needed)
   - Associate existing cards with new auth users

**Phase 6.5 (Quick Enhancement):**
- Add OAuth: "Sign in with Google" (and optionally GitHub)
- ~15 minutes once email/password auth is working

## Implementation Details

### Database Schema (Supabase)

**Current (Phase 1-5):**
```
users: id (uuid), name (text), created_at
bingo_cards: id (uuid), user_id (FK → users), quote (text), created_at, updated_at
goals: id (uuid), bingo_card_id (FK), position (0-8), goal (text), completed (bool), created_at
```

**Updated (Phase 6+):**
```
auth.users: [Supabase Auth managed table]
user_profiles: id (uuid, FK → auth.users), display_name (text), created_at
bingo_cards: id (uuid), user_id (FK → auth.users), year (int), theme (text), quote (text), created_at, updated_at, last_edited_at
goals: id (uuid), bingo_card_id (FK), position (0-8), goal (text), completed (bool), created_at
```

**Future (Phase 9+):**
```
goal_notes: id (uuid), goal_id (FK → goals), note_text (text), created_at, updated_at
goal_subtasks: id (uuid), goal_id (FK → goals), task_text (text), completed (bool), order (int), created_at
```

### Key Files
- `src/lib/supabase-client.ts` - Browser Supabase client factory
- `src/lib/database.types.ts` - TypeScript types for DB schema
- `.env.local` - Contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Design Decisions
- **One card per user** (enforced in app logic, not DB)
- **Position 4 = free space** (center of 3x3 grid)
- **Mobile-first design** with 3x3 grid for optimal mobile experience
- **Simple name-based auth** (no Supabase Auth for MVP)
- **No RLS** for MVP (direct database access)
- **Enhanced interaction model:**
  - Desktop: Click 4 corners to complete (mimics "coloring in" a box)
  - Mobile: Swipe 3 times to complete (same concept, touch-friendly)
  - Double-click/tap to edit
  - Empty boxes show no placeholder text (cleaner UX)
  - Help button provides instructions to new users

## Next Actions (In Order)

**CURRENT STATUS:** MVP Complete! Phases 1-5 finished. Planning session complete for Phases 6-13.

**IMMEDIATE NEXT PRIORITY:** Phase 6 - Authentication with Supabase Auth
1. Enable Supabase Auth in Supabase Dashboard (email/password provider)
2. Update database schema (drop users table, create user_profiles, update FKs)
3. Create auth components (SignUp, Login, PasswordReset)
4. Update landing page with login/signup forms
5. Implement session management and protected routes
6. Test end-to-end authentication flow
7. Optional: Add OAuth (Google/GitHub) in Phase 6.5

**SUBSEQUENT PRIORITIES:**
- **Phase 7:** Multiple cards per user with dashboard and year/theme organization
- **Phase 8:** Goal detail modal with full text editing
- **Phase 9:** Diary entries and subtasks per goal (journal-style)
- **Phase 10:** Web accessibility (WCAG 2.1 Level AA)
- **Phase 11:** TBD (to be planned)
- **Phase 12:** Progressive Web App (PWA)
- **Phase 13:** React Native (future consideration)

## Future Roadmap Summary

### Phase 7: Multiple Cards Foundation
- Dashboard with card listing grouped by year
- Card switcher dropdown in header
- Create new cards with year/theme
- Most recently edited card is default
- Quote field remains (theme is just one-word identifier)
- Theme defaults to first word of first goal if not provided

### Phase 8: Goal Detail Modal (Core)
- Button on each goal square to open detail view
- Full-screen modal on mobile, centered on desktop
- Shows full goal text (handles overflow from grid)
- Editable goal text in larger textarea
- Foundation for side tabs (prepared for Phase 9)
- Grid view truncates to 3 lines with ellipsis

### Phase 9: Goal Enhancements - Diary & Subtasks
- Side tabs in modal: "Diary" and "Subtasks"
- Diary tab: Timestamped journal entries with edit/delete
- Subtasks tab: Checkbox list with reordering, progress indicator
- New database tables: goal_notes, goal_subtasks
- Consider: auto-complete goal when all subtasks done?

### Phase 10: Web Accessibility (WCAG 2.1 Level AA)
- Semantic HTML, keyboard navigation, screen reader support
- Color contrast audit, focus indicators
- ARIA labels and live regions
- prefers-reduced-motion support
- Test with VoiceOver, NVDA, Lighthouse

### Phase 12: Progressive Web App (PWA) - Future
- manifest.json for installability
- Service worker for offline support
- "Add to Home Screen" functionality
- iOS-specific meta tags

### Phase 13: React Native - Future
- Evaluate PWA vs native app needs
- Migrate to React Native if needed for app stores

**TESTING:**
- Manual testing of corner-click completion on desktop
- Manual testing of swipe completion on mobile devices
- End-to-end flow testing (already confirmed working)
- Playwright MCP server is available and tested

## Recent Planning Session (2026-01-26)

### Key Decisions Made

**1. Authentication Strategy**
- **Decision:** Implement Supabase Auth with email/password + OAuth (Google/GitHub)
- **Rationale:**
  - Current name-based auth has no uniqueness (duplicate names break it)
  - No security - anyone can access any account by guessing/knowing a name
  - Upcoming diary/subtasks contain sensitive personal data
  - OAuth is safer than custom password management
- **Impact:** Phase 6 becomes critical blocker before adding new features

**2. Multiple Cards Per User**
- **Decision:** Users can create unlimited cards organized by year + theme
- **Features:**
  - Dashboard page showing all cards grouped by year
  - Dropdown switcher for quick navigation
  - Theme = one-word identifier (defaults to first word of first goal)
  - Quote field remains (separate from theme)
  - Most recently edited card is default on login
- **Why:** Allows users to track goals across years and life areas

**3. Goal Detail Modal with Journal Features**
- **Decision:** Add button to open each goal in detailed modal view
- **Features:**
  - Side tabs: "Diary" and "Subtasks"
  - Diary: Timestamped journal entries (add/edit/delete)
  - Subtasks: Checkbox list with reordering and progress tracking
  - Full goal text editing (grid view truncates to 3 lines)
- **Why:** Turns simple goal tracker into comprehensive life planner
- **Design Note:** Images and voice notes deferred to later phase

**4. Web Accessibility**
- **Decision:** Target WCAG 2.1 Level AA compliance
- **Scope:**
  - Keyboard navigation for all interactions
  - Screen reader support (ARIA labels, semantic HTML)
  - Color contrast audit
  - prefers-reduced-motion support
- **Why:** Inclusive design is a core value, not optional

**5. PWA Timing**
- **Decision:** Move PWA to Phase 12 (after core features)
- **Rationale:** Auth, multiple cards, and journal features provide more user value first
- **PWA still planned:** Just deprioritized for now

### Updated Phase Plan
- **Phase 6:** Supabase Auth (email/password + OAuth)
- **Phase 7:** Multiple cards with dashboard
- **Phase 8:** Goal detail modal (foundation)
- **Phase 9:** Diary entries + subtasks
- **Phase 10:** Web accessibility audit
- **Phase 11:** TBD (to be planned)
- **Phase 12:** PWA
- **Phase 13:** React Native (future)

## Recent Session Updates (2026-01-14)

### UI Improvements
- **Viewport optimization**: Card now fills screen without scrolling (calc(100vh - 2rem))
- **Title redesign**: Changed from two-line "2026 / BINGO" to single-line "2026 BINGO"
- **Textarea centering**: Edit mode textarea now centers both horizontally and vertically
- **Cursor positioning**: When editing, cursor starts at middle of existing text
- **Responsive padding**: Uses `sm:` variants for better mobile/desktop spacing

### Phase 5 Completion (Share & Export)
- Created `/card/[cardId]` dynamic route for public shareable links
- Built read-only public view page with owner name display
- Added "Share Card" button with clipboard copy (shows "✓ Link Copied!" feedback)
- Added "Download Image" button using html2canvas (exports as PNG at 2x scale)
- Implemented print-friendly CSS with @media print queries
- BingoCard component now accepts `isReadOnly` prop to disable all editing

## Important Implementation Notes

### Interaction State Management
- **Long press:** Tracked in `longPressState` (goalId, progress, startTime, startX, startY)
- **Progress animation:** Uses requestAnimationFrame for smooth 60fps updates
- **Movement detection:** Cancels long press if moved > 10px from start position
- **Time-based progress:** progress = elapsed / LONG_PRESS_DURATION (2000ms)
- **Visual feedback:** SVG circle scales from 0.25 to 1.0 and fills circumference

### Component Architecture
- `src/components/BingoCard.tsx`: Main UI component (client-side)
  - Manages local state for editing, long press progress, help modal
  - Calls parent callbacks for database updates
  - Accepts `isReadOnly` prop to disable editing in public view
- `src/app/card/page.tsx`: Private card page (user's own card)
  - Fetches data from Supabase by userId
  - Provides callbacks to BingoCard for mutations
  - Includes "Share Card" and "Download Image" buttons
  - Handles loading/error states
- `src/app/card/[cardId]/page.tsx`: Public shareable card page
  - Fetches data from Supabase by cardId (UUID)
  - Read-only mode (isReadOnly={true})
  - Shows owner's name
  - Link to create own card

### Tech Stack
- Next.js 16 (App Router) with client components ('use client')
- Tailwind CSS v4 with inline theme syntax
- Supabase for backend/database
- TypeScript for type safety
- html2canvas for image export functionality
- No external icon library needed (removed lucide-react dependency)
