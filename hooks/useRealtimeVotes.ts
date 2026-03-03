'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeVotes(onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('votes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}

export function useRealtimeVotesForProposal(
  proposalId: string,
  onUpdate: () => void
) {
  useEffect(() => {
    const channel = supabase
      .channel(`votes:${proposalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `proposal_id=eq.${proposalId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proposalId, onUpdate]);
}
