'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Goal {
  id: string;
  position: number;
  goal: string;
  completed: boolean;
}

interface BingoCardProps {
  goals: Goal[];
  quote: string;
  onUpdateGoal: (goalId: string, newText: string) => Promise<void>;
  onToggleComplete: (goalId: string, completed: boolean) => Promise<void>;
  onUpdateQuote: (newQuote: string) => Promise<void>;
  isReadOnly?: boolean;
}

interface LongPressState {
  goalId: string;
  progress: number; // 0 to 1
  startTime: number;
  startX: number; // Initial press X position
  startY: number; // Initial press Y position
}

/**
 * BingoCard component - interactive 3x3 grid of goals
 * New interaction model:
 * - Double-click (or tap on mobile) to edit goal text
 * - Long press (3 seconds) to mark as complete with progress ring animation
 * - Editable quote/intention
 * - Free space with heart icon at position 4 (center of 3x3 grid)
 *
 * Follows DESIGN.md specifications:
 * - Alternating beige/taupe colors in checkerboard pattern
 * - Rounded corners, gaps between squares
 * - Space Mono font for grid text
 */
export default function BingoCard({
  goals,
  quote,
  onUpdateGoal,
  onToggleComplete,
  onUpdateQuote,
  isReadOnly = false,
}: BingoCardProps) {
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState(false);
  const [tempQuote, setTempQuote] = useState(quote);
  const [showHelp, setShowHelp] = useState(false);

  // Long press state
  const [longPressState, setLongPressState] = useState<LongPressState | null>(
    null
  );
  const animationFrameRef = useRef<number | null>(null);

  // Constants
  const LONG_PRESS_DURATION = 2000; // 2 seconds in milliseconds
  const MOVEMENT_THRESHOLD = 10; // pixels - cancel if moved more than this

  // Sort goals by position to ensure correct order
  const sortedGoals = [...goals].sort((a, b) => a.position - b.position);

  // Determine if a square should be dark or light based on checkerboard pattern
  const isDarkSquare = (position: number) => {
    const row = Math.floor(position / 3);
    const col = position % 3;
    return (row + col) % 2 === 1;
  };

  // Haptic feedback helper
  const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy'): void => {
    if ('vibrate' in navigator) {
      const duration =
        intensity === 'light' ? 10 : intensity === 'medium' ? 20 : 50;
      navigator.vibrate(duration);
    }
  };

  // Cancel long press
  const cancelLongPress = (): void => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setLongPressState(null);
  };

  // Start long press
  const handlePressStart = (
    goal: Goal,
    clientX: number,
    clientY: number
  ): void => {
    if (
      isReadOnly ||
      goal.position === 4 ||
      editingGoalId ||
      goal.completed ||
      !goal.goal.trim()
    )
      return;

    triggerHaptic('light');

    // Capture timestamp before state update to satisfy React purity rules
    const timestamp = performance.now();

    setLongPressState({
      goalId: goal.id,
      progress: 0,
      startTime: timestamp,
      startX: clientX,
      startY: clientY,
    });
  };

  // Animation loop for long press progress (time-based, not frame-based)
  useEffect(() => {
    if (!longPressState) return;

    const animate = () => {
      const currentTime = performance.now();
      const elapsed = currentTime - longPressState.startTime;
      const progress = Math.min(elapsed / LONG_PRESS_DURATION, 1);

      setLongPressState((prev) => {
        if (!prev) return null;
        return { ...prev, progress };
      });

      if (progress >= 1) {
        // Complete! Goal achieved
        triggerHaptic('heavy');
        onToggleComplete(longPressState.goalId, true);
        cancelLongPress();
      } else {
        // Continue animation - uses requestAnimationFrame for smoothness
        // but progress is calculated based on actual time elapsed
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [longPressState?.goalId, longPressState?.startTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if movement exceeds threshold
  const hasMovedTooFar = (currentX: number, currentY: number): boolean => {
    if (!longPressState) return false;
    const deltaX = Math.abs(currentX - longPressState.startX);
    const deltaY = Math.abs(currentY - longPressState.startY);
    return deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD;
  };

  // Mouse event handlers
  const handleMouseDown = (
    goal: Goal,
    event: React.MouseEvent<HTMLDivElement>
  ): void => {
    handlePressStart(goal, event.clientX, event.clientY);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (longPressState && hasMovedTooFar(event.clientX, event.clientY)) {
      cancelLongPress();
    }
  };

  const handleMouseUp = (): void => {
    cancelLongPress();
  };

  // Touch event handlers
  const handleTouchStart = (
    goal: Goal,
    event: React.TouchEvent<HTMLDivElement>
  ): void => {
    const touch = event.touches[0];
    handlePressStart(goal, touch.clientX, touch.clientY);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>): void => {
    if (longPressState && event.touches[0]) {
      const touch = event.touches[0];
      if (hasMovedTooFar(touch.clientX, touch.clientY)) {
        cancelLongPress();
      }
    }
  };

  const handleTouchEnd = (): void => {
    cancelLongPress();
  };

  // Handle double-click to edit
  const handleGoalDoubleClick = (goal: Goal): void => {
    if (isReadOnly || goal.position === 4) return; // Free space not editable or read-only mode
    cancelLongPress(); // Cancel any ongoing long press
    setEditingGoalId(goal.id);
  };

  const handleGoalBlur = async (goal: Goal, newText: string) => {
    if (newText !== goal.goal) {
      await onUpdateGoal(goal.id, newText);
    }
    setEditingGoalId(null);
  };

  const handleQuoteBlur = async () => {
    if (tempQuote !== quote) {
      await onUpdateQuote(tempQuote);
    }
    setEditingQuote(false);
  };

  return (
    <div
      className="w-full max-w-2xl mx-auto p-4 sm:p-8 rounded-lg relative flex flex-col"
      style={{
        border: '2px solid var(--color-border-gold)',
        height: 'calc(100vh - 2rem)',
        maxHeight: 'calc(100vh - 2rem)',
      }}
    >
      {/* Help Button - only show when not read-only */}
      {!isReadOnly && (
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-opacity hover:opacity-70 no-export"
          style={{
            backgroundColor: 'var(--color-tan-accent)',
            color: 'white',
          }}
          title="Help"
        >
          ?
        </button>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center z-10"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-md mx-4"
            style={{ border: '2px solid var(--color-border-gold)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-2xl font-bold mb-4 text-center"
              style={{ color: 'var(--color-charcoal)' }}
            >
              How to Use Your Bingo Card
            </h3>
            <div
              className="space-y-3 text-sm"
              style={{ color: 'var(--color-charcoal)' }}
            >
              <div>
                <strong>To edit a goal:</strong> Double-click (or tap on mobile)
                on any box to add or edit your goal text.
              </div>
              <div>
                <strong>To mark as complete:</strong> Press and hold on a box
                for 2 seconds. A progress ring will grow and fill up to show
                your progress. Keep your finger/mouse steady!
              </div>
              <div>
                <strong>To edit your intention:</strong> Click the quote text at
                the bottom to add your 2026 intention.
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-4 py-2 px-4 rounded-md text-white"
              style={{ backgroundColor: 'var(--color-tan-accent)' }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4 sm:mb-6 flex-shrink-0">
        <h1
          className="text-3xl sm:text-5xl font-bold tracking-wider"
          style={{ color: 'var(--color-charcoal)' }}
        >
          2026 BINGO
        </h1>
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4 sm:mb-6 flex-1 content-center">
        {sortedGoals.map((goal) => {
          const isFreeSpace = goal.position === 4;
          const isDark = isDarkSquare(goal.position);
          const isEditing = editingGoalId === goal.id;
          const isLongPressing = longPressState?.goalId === goal.id;
          const progress = isLongPressing ? longPressState.progress : 0;

          return (
            <div
              key={goal.id}
              className={`aspect-square rounded-lg flex items-center justify-center p-3 text-center text-sm leading-tight transition-all relative overflow-auto ${
                !isFreeSpace ? 'cursor-pointer hover:opacity-80' : ''
              }`}
              style={{
                backgroundColor: isDark
                  ? 'var(--color-square-dark)'
                  : 'var(--color-square-light)',
                color: 'var(--color-charcoal)',
                opacity: goal.completed ? 0.5 : 1,
                textDecoration: goal.completed ? 'line-through' : 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                touchAction: 'pan-y', // Allow vertical scrolling but prevent text selection
              }}
              onMouseDown={(e) => handleMouseDown(goal, e)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={(e) => handleTouchStart(goal, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={() => handleGoalDoubleClick(goal)}
            >
              {/* Progress Ring - shows during long press */}
              {isLongPressing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg
                    className="transform -rotate-90"
                    width="80"
                    height="80"
                    viewBox="0 0 80 80"
                    style={{
                      transform: `rotate(-90deg) scale(${
                        0.25 + progress * 0.75
                      })`,
                    }}
                  >
                    {/* Background circle */}
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke="var(--color-charcoal)"
                      strokeWidth="4"
                      opacity="0.3"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke="var(--color-tan-accent)"
                      strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 35}`}
                      strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress)}`}
                    />
                  </svg>
                </div>
              )}

              {isFreeSpace ? (
                <div className="w-full h-full overflow-hidden rounded-lg">
                  <Image
                    src="/assets/mookie.png"
                    alt="Center"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    priority
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                </div>
              ) : isEditing ? (
                <textarea
                  autoFocus
                  defaultValue={goal.goal}
                  onFocus={(e) => {
                    const length = e.target.value.length;
                    const middle = Math.floor(length / 2);
                    e.target.setSelectionRange(middle, middle);
                  }}
                  onBlur={(e) => handleGoalBlur(goal, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full bg-transparent resize-none outline-none text-center"
                  style={{
                    color: 'var(--color-charcoal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="break-words">{goal.goal}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Quote/Intention - Click to edit */}
      <div className="text-center flex-shrink-0">
        {editingQuote ? (
          <input
            type="text"
            autoFocus
            value={tempQuote}
            onChange={(e) => setTempQuote(e.target.value)}
            onBlur={handleQuoteBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="w-full text-center italic text-base bg-transparent outline-none"
            style={{ color: 'var(--color-tan-accent)' }}
            placeholder="Add your 2026 intention..."
          />
        ) : (
          <div
            className={`italic text-base ${
              !isReadOnly
                ? 'cursor-pointer hover:opacity-70 transition-opacity'
                : ''
            }`}
            style={{ color: 'var(--color-tan-accent)' }}
            onClick={() => !isReadOnly && setEditingQuote(true)}
          >
            {quote
              ? `"${quote}"`
              : isReadOnly
              ? ''
              : 'Click to add your 2026 intention...'}
          </div>
        )}
      </div>
    </div>
  );
}
