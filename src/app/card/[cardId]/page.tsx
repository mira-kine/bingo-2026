'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-client';
import BingoCard from '@/components/BingoCard';

interface Goal {
  id: string;
  position: number;
  goal: string;
  completed: boolean;
}

interface BingoCardData {
  id: string;
  quote: string;
  userName: string;
}

export default function PublicCardPage() {
  const params = useParams();
  const cardId = params.cardId as string;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [cardData, setCardData] = useState<BingoCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  // Fetch bingo card and goals by card UUID (public view)
  useEffect(() => {
    async function fetchCardData() {
      if (!cardId) {
        setError('No card ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch the bingo card by its UUID
        const { data: card, error: cardError } = await supabase
          .from('bingo_cards')
          .select('id, quote, user_id, users(name)')
          .eq('id', cardId)
          .single();

        if (cardError) {
          throw cardError;
        }

        if (!card) {
          setError('Bingo card not found');
          setLoading(false);
          return;
        }

        setCardData({
          id: card.id,
          quote: card.quote || '',
          userName: (card.users as any)?.name || 'Someone',
        });

        // Fetch all goals for this card
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('id, position, goal, completed')
          .eq('bingo_card_id', card.id)
          .order('position');

        if (goalsError) {
          throw goalsError;
        }

        // Transform data to match Goal interface
        const transformedGoals: Goal[] = (goalsData || []).map((goal) => ({
          id: goal.id,
          position: goal.position || 0,
          goal: goal.goal || '',
          completed: goal.completed || false,
        }));

        setGoals(transformedGoals);
      } catch (err) {
        console.error('Error fetching card data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load bingo card'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchCardData();
  }, [cardId, supabase]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bingo-bg)' }}
      >
        <p className="text-lg" style={{ color: 'var(--color-charcoal)' }}>
          Loading bingo card...
        </p>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bingo-bg)' }}
      >
        <div className="text-center">
          <p
            className="text-lg mb-4"
            style={{ color: 'var(--color-charcoal)' }}
          >
            {error || 'Unable to load bingo card'}
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Create your own bingo card
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bingo-bg)' }}
    >
      <div className="w-full max-w-2xl">
        {/* Header showing whose card this is */}
        <div className="text-center mb-4">
          <p
            className="text-sm opacity-70"
            style={{ color: 'var(--color-charcoal)' }}
          >
            {cardData.userName}'s 2026 Vision Board
          </p>
        </div>

        <BingoCard
          goals={goals}
          quote={cardData.quote}
          onUpdateGoal={async () => {}}
          onToggleComplete={async () => {}}
          onUpdateQuote={async () => {}}
          isReadOnly={true}
        />

        {/* Footer with link to create own card */}
        <div className="text-center mt-4">
          <Link
            href="/"
            className="text-sm hover:underline"
            style={{ color: 'var(--color-tan-accent)' }}
          >
            Create your own 2026 Vision Board
          </Link>
        </div>
      </div>
    </div>
  );
}
