'use client';

import { useState, useRef } from 'react';

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
}

type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

interface CornerClicks {
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
}

/**
 * BingoCard component - interactive 5x5 grid of goals
 * New interaction model:
 * - Double-click (or tap on mobile) to edit goal text
 * - Click all 4 corners OR swipe 3 times to mark as complete
 * - Editable quote/intention
 * - Free space with heart icon at position 12
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
}: BingoCardProps) {
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState(false);
  const [tempQuote, setTempQuote] = useState(quote);
  const [showHelp, setShowHelp] = useState(false);

  // Track corner clicks for each goal
  const [cornerClicks, setCornerClicks] = useState<Record<string, CornerClicks>>({});

  // Track swipe count for each goal
  const [swipeCounts, setSwipeCounts] = useState<Record<string, number>>({});

  // Track touch start position for swipe detection
  const touchStartRef = useRef<{ x: number; y: number; goalId: string } | null>(null);

  // Sort goals by position to ensure correct order
  const sortedGoals = [...goals].sort((a, b) => a.position - b.position);

  // Determine if a square should be dark or light based on checkerboard pattern
  const isDarkSquare = (position: number) => {
    const row = Math.floor(position / 5);
    const col = position % 5;
    return (row + col) % 2 === 1;
  };

  // Detect which corner was clicked based on click position within the element
  const detectCorner = (event: React.MouseEvent<HTMLDivElement>): Corner => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    // Divide into quadrants
    const isLeft = x < width / 2;
    const isTop = y < height / 2;

    if (isTop && isLeft) return 'topLeft';
    if (isTop && !isLeft) return 'topRight';
    if (!isTop && isLeft) return 'bottomLeft';
    return 'bottomRight';
  };

  // Check if all corners have been clicked
  const areAllCornersClicked = (clicks: CornerClicks): boolean => {
    return clicks.topLeft && clicks.topRight && clicks.bottomLeft && clicks.bottomRight;
  };

  // Handle click on goal - track corner clicks
  const handleGoalClick = (goal: Goal, event: React.MouseEvent<HTMLDivElement>) => {
    if (goal.position === 12 || editingGoalId || goal.completed) return;

    const corner = detectCorner(event);
    const currentClicks = cornerClicks[goal.id] || {
      topLeft: false,
      topRight: false,
      bottomLeft: false,
      bottomRight: false,
    };

    const newClicks = { ...currentClicks, [corner]: true };
    setCornerClicks({ ...cornerClicks, [goal.id]: newClicks });

    // Check if all corners are clicked
    if (areAllCornersClicked(newClicks)) {
      onToggleComplete(goal.id, true);
      // Reset corner clicks
      setCornerClicks({ ...cornerClicks, [goal.id]: { topLeft: false, topRight: false, bottomLeft: false, bottomRight: false } });
    }
  };

  // Handle double-click to edit
  const handleGoalDoubleClick = (goal: Goal) => {
    if (goal.position === 12) return; // Free space not editable
    setEditingGoalId(goal.id);
  };

  // Handle touch start for swipe detection
  const handleTouchStart = (goal: Goal, event: React.TouchEvent<HTMLDivElement>) => {
    if (goal.position === 12 || editingGoalId || goal.completed) return;

    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      goalId: goal.id,
    };
  };

  // Handle touch end for swipe detection
  const handleTouchEnd = (goal: Goal, event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || touchStartRef.current.goalId !== goal.id) return;
    if (goal.position === 12 || editingGoalId || goal.completed) return;

    const touch = event.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Detect horizontal swipe (deltaX > deltaY and deltaX > threshold)
    if (deltaX > deltaY && deltaX > 30) {
      const currentCount = swipeCounts[goal.id] || 0;
      const newCount = currentCount + 1;
      setSwipeCounts({ ...swipeCounts, [goal.id]: newCount });

      // Mark complete after 3 swipes
      if (newCount >= 3) {
        onToggleComplete(goal.id, true);
        // Reset swipe count
        setSwipeCounts({ ...swipeCounts, [goal.id]: 0 });
      }
    }

    touchStartRef.current = null;
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
      className="w-full max-w-2xl mx-auto p-8 rounded-lg relative"
      style={{ border: '2px solid var(--color-border-gold)' }}
    >
      {/* Help Button */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-opacity hover:opacity-70"
        style={{
          backgroundColor: 'var(--color-tan-accent)',
          color: 'white',
        }}
        title="Help"
      >
        ?
      </button>

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
            <div className="space-y-3 text-sm" style={{ color: 'var(--color-charcoal)' }}>
              <div>
                <strong>To edit a goal:</strong> Double-click (or tap on mobile) on any box to add or edit your goal text.
              </div>
              <div>
                <strong>To mark as complete:</strong>
                <ul className="list-disc ml-5 mt-1">
                  <li>Desktop: Click all 4 corners of the box</li>
                  <li>Mobile: Swipe across the box 3 times</li>
                </ul>
              </div>
              <div>
                <strong>To edit your intention:</strong> Click the quote text at the bottom to add your 2026 intention.
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
      <div className="text-center mb-8">
        <h2
          className="text-xl mb-2"
          style={{ color: 'var(--color-tan-accent)' }}
        >
          2026
        </h2>
        <h1
          className="text-5xl font-bold tracking-wider"
          style={{ color: 'var(--color-charcoal)' }}
        >
          BINGO
        </h1>
      </div>

      {/* 5x5 Grid */}
      <div className="grid grid-cols-5 gap-2 mb-8">
        {sortedGoals.map((goal) => {
          const isFreeSpace = goal.position === 12;
          const isDark = isDarkSquare(goal.position);
          const isEditing = editingGoalId === goal.id;
          const clicks = cornerClicks[goal.id] || { topLeft: false, topRight: false, bottomLeft: false, bottomRight: false };
          const swipeCount = swipeCounts[goal.id] || 0;

          return (
            <div
              key={goal.id}
              className={`aspect-square rounded-lg flex items-center justify-center p-3 text-center text-sm leading-tight transition-all relative ${
                !isFreeSpace ? 'cursor-pointer hover:opacity-80' : ''
              }`}
              style={{
                backgroundColor: isDark
                  ? 'var(--color-square-dark)'
                  : 'var(--color-square-light)',
                color: 'var(--color-charcoal)',
                opacity: goal.completed ? 0.5 : 1,
                textDecoration: goal.completed ? 'line-through' : 'none',
              }}
              onClick={(e) => handleGoalClick(goal, e)}
              onDoubleClick={() => handleGoalDoubleClick(goal)}
              onTouchStart={(e) => handleTouchStart(goal, e)}
              onTouchEnd={(e) => handleTouchEnd(goal, e)}
            >
              {/* Corner indicators */}
              {!isFreeSpace && !goal.completed && !isEditing && (
                <>
                  <div
                    className="absolute w-2 h-2 rounded-full transition-all"
                    style={{
                      top: '4px',
                      left: '4px',
                      backgroundColor: clicks.topLeft ? 'var(--color-charcoal)' : 'transparent',
                      border: '1px solid var(--color-charcoal)',
                      opacity: clicks.topLeft ? 1 : 0.2,
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 rounded-full transition-all"
                    style={{
                      top: '4px',
                      right: '4px',
                      backgroundColor: clicks.topRight ? 'var(--color-charcoal)' : 'transparent',
                      border: '1px solid var(--color-charcoal)',
                      opacity: clicks.topRight ? 1 : 0.2,
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 rounded-full transition-all"
                    style={{
                      bottom: '4px',
                      left: '4px',
                      backgroundColor: clicks.bottomLeft ? 'var(--color-charcoal)' : 'transparent',
                      border: '1px solid var(--color-charcoal)',
                      opacity: clicks.bottomLeft ? 1 : 0.2,
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 rounded-full transition-all"
                    style={{
                      bottom: '4px',
                      right: '4px',
                      backgroundColor: clicks.bottomRight ? 'var(--color-charcoal)' : 'transparent',
                      border: '1px solid var(--color-charcoal)',
                      opacity: clicks.bottomRight ? 1 : 0.2,
                    }}
                  />
                </>
              )}

              {/* Swipe count indicator */}
              {!isFreeSpace && !goal.completed && !isEditing && swipeCount > 0 && (
                <div
                  className="absolute bottom-1 right-1 text-xs font-bold"
                  style={{ color: 'var(--color-charcoal)', opacity: 0.5 }}
                >
                  {swipeCount}/3
                </div>
              )}

              {isFreeSpace ? (
                <div
                  className="w-8 h-8"
                  style={{ color: 'var(--color-charcoal)' }}
                />
              ) : isEditing ? (
                <textarea
                  autoFocus
                  defaultValue={goal.goal}
                  onBlur={(e) => handleGoalBlur(goal, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full h-full bg-transparent resize-none outline-none text-center"
                  style={{ color: 'var(--color-charcoal)' }}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="break-words">
                  {goal.goal}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Quote/Intention - Click to edit */}
      <div className="text-center">
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
            className="italic text-base cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-tan-accent)' }}
            onClick={() => setEditingQuote(true)}
          >
            {quote ? `"${quote}"` : 'Click to add your 2026 intention...'}
          </div>
        )}
      </div>
    </div>
  );
}
