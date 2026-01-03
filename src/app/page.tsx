'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-client';

export default function Home() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('name', name.trim())
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (existingUser) {
        // User exists, load their bingo card
        router.push(`/card?userId=${existingUser.id}`);
      } else {
        // Create new user
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert({ name: name.trim() })
          .select()
          .single();

        if (createUserError || !newUser) throw createUserError;

        // Create bingo card for new user
        const { data: newCard, error: createCardError } = await supabase
          .from('bingo_cards')
          .insert({ user_id: newUser.id, quote: '' })
          .select()
          .single();

        if (createCardError || !newCard) throw createCardError;

        // Create 25 empty goals
        const goals = Array.from({ length: 25 }, (_, i) => ({
          bingo_card_id: newCard.id,
          position: i,
          goal: '',
          completed: false,
        }));

        const { error: createGoalsError } = await supabase
          .from('goals')
          .insert(goals);

        if (createGoalsError) throw createGoalsError;

        router.push(`/card?userId=${newUser.id}`);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <main className="flex flex-col items-center justify-center max-w-md w-full px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">2026 Vision Bingo Card</h1>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Enter your name to get started
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Continue'}
          </button>
        </form>
      </main>
    </div>
  );
}
