'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-client';
import BingoCard from '@/components/BingoCard';
import html2canvas from 'html2canvas';

interface Goal {
  id: string;
  position: number;
  goal: string;
  completed: boolean;
}

interface BingoCardData {
  id: string;
  quote: string;
}

function CardPageContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [goals, setGoals] = useState<Goal[]>([]);
  const [cardData, setCardData] = useState<BingoCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient();

  // Fetch bingo card and goals
  useEffect(() => {
    async function fetchCardData() {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch the bingo card for this user
        const { data: card, error: cardError } = await supabase
          .from('bingo_cards')
          .select('id, quote')
          .eq('user_id', userId)
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
  }, [userId, supabase]);

  const handleUpdateGoal = async (goalId: string, newText: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ goal: newText })
        .eq('id', goalId);

      if (error) throw error;

      // Update local state
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, goal: newText } : g))
      );
    } catch (err) {
      console.error('Error updating goal:', err);
      alert('Failed to update goal');
    }
  };

  const handleToggleComplete = async (goalId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ completed })
        .eq('id', goalId);

      if (error) throw error;

      // Update local state
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, completed } : g))
      );
    } catch (err) {
      console.error('Error toggling completion:', err);
      alert('Failed to update goal status');
    }
  };

  const handleUpdateQuote = async (newQuote: string) => {
    if (!cardData) return;

    try {
      const { error } = await supabase
        .from('bingo_cards')
        .update({
          quote: newQuote,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cardData.id);

      if (error) throw error;

      // Update local state
      setCardData((prev) => (prev ? { ...prev, quote: newQuote } : null));
    } catch (err) {
      console.error('Error updating quote:', err);
      alert('Failed to update intention');
    }
  };

  const handleCopyShareLink = async () => {
    if (!cardData) return;

    const shareUrl = `${window.location.origin}/card/${cardData.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link to clipboard');
    }
  };

  const handleExportImage = async () => {
    if (!cardRef.current) return;

    setExporting(true);

    try {
      // Wait a bit for images to fully load
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#F9F6F1',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true, // Allow cross-origin images
        allowTaint: true, // Allow tainted canvases
        imageTimeout: 0, // No timeout for images
        onclone: (clonedDoc) => {
          // Ensure images are properly sized in the clone
          const images = clonedDoc.getElementsByTagName('img');
          Array.from(images).forEach((img) => {
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.objectFit = 'cover';
          });

          // Hide elements that shouldn't be exported (help button, etc.)
          const noExportElements = clonedDoc.querySelectorAll('.no-export');
          noExportElements.forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });
        },
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '2026-vision-bingo.png';
        link.click();

        // Cleanup
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Failed to export image:', err);
      alert('Failed to export image');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bingo-bg)' }}
      >
        <p className="text-lg" style={{ color: 'var(--color-charcoal)' }}>
          Loading your bingo card...
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
            Return to home
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
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={handleExportImage}
            disabled={exporting}
            className="px-4 py-2 rounded-md text-white text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-tan-accent)' }}
          >
            {exporting ? 'Exporting...' : 'Download Image'}
          </button>
          <button
            onClick={handleCopyShareLink}
            className="px-4 py-2 rounded-md text-white text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--color-tan-accent)' }}
          >
            {copied ? '✓ Link Copied!' : 'Share Card'}
          </button>
        </div>

        <div ref={cardRef}>
          <BingoCard
            goals={goals}
            quote={cardData.quote}
            onUpdateGoal={handleUpdateGoal}
            onToggleComplete={handleToggleComplete}
            onUpdateQuote={handleUpdateQuote}
          />
        </div>
      </div>
    </div>
  );
}

export default function CardPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-bingo-bg)' }}
        >
          <p className="text-lg" style={{ color: 'var(--color-charcoal)' }}>
            Loading your bingo card...
          </p>
        </div>
      }
    >
      <CardPageContent />
    </Suspense>
  );
}
