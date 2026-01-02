'use client';

import { useState } from 'react';

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

/**
 * BingoCard component - interactive 5x5 grid of goals
 * Phase 3 features:
 * - Click to edit goal cells
 * - Toggle goal completion (click on cell)
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

  // Sort goals by position to ensure correct order
  const sortedGoals = [...goals].sort((a, b) => a.position - b.position);

  // Determine if a square should be dark or light based on checkerboard pattern
  const isDarkSquare = (position: number) => {
    const row = Math.floor(position / 5);
    const col = position % 5;
    return (row + col) % 2 === 1;
  };

  const handleGoalClick = (goal: Goal) => {
    if (goal.position === 12) return; // Free space not editable

    // If not editing, toggle completion
    if (!editingGoalId) {
      onToggleComplete(goal.id, !goal.completed);
    }
  };

  const handleGoalDoubleClick = (goal: Goal) => {
    if (goal.position === 12) return; // Free space not editable
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
      className="w-full max-w-2xl mx-auto p-8 rounded-lg"
      style={{ border: '2px solid var(--color-border-gold)' }}
    >
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

          return (
            <div
              key={goal.id}
              className={`aspect-square rounded-lg flex items-center justify-center p-3 text-center text-sm leading-tight transition-all ${
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
              onClick={() => handleGoalClick(goal)}
              onDoubleClick={() => handleGoalDoubleClick(goal)}
            >
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
                />
              ) : (
                <span
                  className="break-words"
                  title="Click to toggle complete, double-click to edit"
                >
                  {goal.goal || 'Double-click to edit'}
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
