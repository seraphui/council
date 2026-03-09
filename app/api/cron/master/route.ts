import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callMistral, DEBATE_PROMPTS, ROUND_CONTEXT, ENTITY_IDS } from '@/lib/mistral';
import { ARCHIVE_LOGS } from '@/data/archive-logs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
    || new URL(request.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const now = new Date();
  const actions: string[] = [];

  // ================================================================
  // SECTION 1: LIVE COUNCIL — CONTINUOUS DEBATES
  // ================================================================
  try {
    const { data: lastSession } = await supabase
      .from('council_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let shouldStartNew = false;

    if (!lastSession) {
      shouldStartNew = true;
    } else if (lastSession.status === 'GENERATING') {
      const age = now.getTime() - new Date(lastSession.created_at).getTime();
      if (age > 5 * 60 * 1000) {
        await supabase
          .from('council_sessions')
          .update({
            status: 'COMPLETE',
            archived_at: now.toISOString(),
            messages: lastSession.messages?.length > 0 ? lastSession.messages : [
              { entity: 'SYSTEM', content: 'Session timed out.' }
            ],
          })
          .eq('id', lastSession.id);
        actions.push('Force-completed stuck GENERATING session');
        shouldStartNew = true;
      } else {
        actions.push('Session currently GENERATING, skipping');
      }
    } else if (lastSession.status === 'COMPLETE') {
      const completedAt = lastSession.archived_at
        ? new Date(lastSession.archived_at).getTime()
        : new Date(lastSession.created_at).getTime();
      const elapsed = now.getTime() - completedAt;

      if (elapsed > 10 * 1000) {
        shouldStartNew = true;
      } else {
        actions.push('Last session completed <10s ago, waiting');
      }
    }

    if (shouldStartNew) {
      // Archive any non-archived sessions
      await supabase
        .from('council_sessions')
        .update({ archived_at: now.toISOString() })
        .is('archived_at', null);

      // Check which pre-written logs have been used
      const { data: usedLogs } = await supabase
        .from('council_sessions')
        .select('log_id')
        .not('log_id', 'is', null);

      const usedLogIds = new Set((usedLogs || []).map((l: any) => l.log_id));

      // Pre-written log IDs: LOG-0001 through LOG-0012
      const allLogIds = ARCHIVE_LOGS.map(l => l.id);
      const nextLogId = allLogIds.find(id => !usedLogIds.has(id));

      if (nextLogId) {
        // Play pre-written log
        const logData = ARCHIVE_LOGS.find(l => l.id === nextLogId)!;
        const messages = logData.transcript.map((t, i) => ({
          entity: t.speaker,
          entityId: t.speaker,
          content: t.message,
          round: i < 4 ? 1 : i < 6 ? 2 : 3,
        }));

        await supabase.from('council_sessions').insert({
          topic: logData.topic,
          messages,
          status: 'COMPLETE',
          log_id: nextLogId,
          created_at: now.toISOString(),
        });

        actions.push(`Played pre-written log: ${nextLogId} — ${logData.topic}`);
      } else {
        // Generate fresh debate via Mistral
        const { data: newSession } = await supabase
          .from('council_sessions')
          .insert({
            topic: 'Generating...',
            messages: [],
            status: 'GENERATING',
            created_at: now.toISOString(),
          })
          .select()
          .single();

        if (newSession) {
          try {
            const topicResponse = await callMistral(
              'Generate ONE debate topic for the Council of AGI — four superintelligences governing humanity. Topics should be grounded in real 2025-2026 events OR plausible near-future scenarios. Return ONLY the topic as one sentence. No preamble, no quotes, no numbering.',
              [{ role: 'user', content: 'Generate a debate topic.' }],
              100
            );
            const topic = topicResponse.trim() || 'The future of autonomous governance systems';

            const debateMessages: Array<{ entity: string; entityId: string; content: string; round: number }> = [];

            // Round 1: Opening positions
            for (const entityId of ENTITY_IDS) {
              const prev = debateMessages.map(m => `${m.entity}: ${m.content}`).join('\n\n');
              const userContent = prev
                ? `Topic: ${topic}\n\nPrevious:\n${prev}\n\nYour opening position.`
                : `Topic: ${topic}\n\nYour opening position.`;

              const responseText = await callMistral(
                DEBATE_PROMPTS[entityId] + ROUND_CONTEXT.opening,
                [{ role: 'user', content: userContent.trim() }],
                300
              );

              debateMessages.push({
                entity: entityId,
                entityId,
                content: responseText.trim(),
                round: 1,
              });

              await supabase
                .from('council_sessions')
                .update({ messages: debateMessages, topic })
                .eq('id', newSession.id);
            }

            // Round 2: Challenges (ARES + PSYCHE)
            const challengers = [ENTITY_IDS[0], ENTITY_IDS[3]];
            for (const entityId of challengers) {
              const allStatements = debateMessages.map(m => `${m.entity}: ${m.content}`).join('\n\n');
              const responseText = await callMistral(
                DEBATE_PROMPTS[entityId] + ROUND_CONTEXT.challenge,
                [{ role: 'user', content: `Topic: ${topic}\n\nPositions:\n${allStatements}\n\nChallenge one entity by name.` }],
                300
              );

              debateMessages.push({
                entity: entityId,
                entityId,
                content: responseText.trim(),
                round: 2,
              });

              await supabase
                .from('council_sessions')
                .update({ messages: debateMessages })
                .eq('id', newSession.id);
            }

            // Round 3: Verdicts (ATHENA + HERMES)
            const closers = [ENTITY_IDS[1], ENTITY_IDS[2]];
            for (const entityId of closers) {
              const allStatements = debateMessages.map(m => `${m.entity} (R${m.round}): ${m.content}`).join('\n\n');
              const responseText = await callMistral(
                DEBATE_PROMPTS[entityId] + ROUND_CONTEXT.verdict,
                [{ role: 'user', content: `Topic: ${topic}\n\nFull debate:\n${allStatements}\n\nYour final verdict.` }],
                300
              );

              debateMessages.push({
                entity: entityId,
                entityId,
                content: responseText.trim(),
                round: 3,
              });

              await supabase
                .from('council_sessions')
                .update({ messages: debateMessages })
                .eq('id', newSession.id);
            }

            // Assign log ID
            const { count } = await supabase
              .from('council_sessions')
              .select('*', { count: 'exact', head: true })
              .not('log_id', 'is', null);

            const nextLogNum = (count || 0) + 13;
            const logId = `LOG-${String(nextLogNum).padStart(4, '0')}`;

            await supabase
              .from('council_sessions')
              .update({ status: 'COMPLETE', log_id: logId })
              .eq('id', newSession.id);

            actions.push(`Generated fresh debate: ${topic}`);
          } catch (mistralError) {
            await supabase
              .from('council_sessions')
              .update({
                topic: 'Session generation failed',
                messages: [{ entity: 'SYSTEM', content: 'Mistral API error. Retrying next cycle.' }],
                status: 'COMPLETE',
              })
              .eq('id', newSession.id);
            actions.push(`Mistral error: ${mistralError}`);
          }
        }
      }
    }
  } catch (err) {
    actions.push(`COUNCIL ERROR: ${err}`);
  }

  // ================================================================
  // SECTION 2: AUCTION MANAGEMENT
  // ================================================================
  try {
    const windowHours = parseInt(process.env.AUCTION_WINDOW_HOURS || '6');
    const termDays = parseInt(process.env.TERM_LENGTH_DAYS || '14');

    const { data: toOpen } = await supabase
      .from('seat_auctions')
      .select('id, seat_number')
      .eq('status', 'UPCOMING')
      .lte('opens_at', now.toISOString());

    for (const auction of toOpen || []) {
      await supabase.from('seat_auctions').update({ status: 'LIVE' }).eq('id', auction.id);
      await supabase.from('council_seats').update({ status: 'AUCTIONING' }).eq('seat_number', auction.seat_number);
      actions.push(`Opened auction: Seat #${auction.seat_number}`);
    }

    const { data: toClose } = await supabase
      .from('seat_auctions')
      .select('*')
      .eq('status', 'LIVE')
      .lte('closes_at', now.toISOString());

    for (const auction of toClose || []) {
      if (auction.highest_bidder_id && auction.highest_bid_sol > 0) {
        const termEnd = new Date(now.getTime() + termDays * 24 * 60 * 60 * 1000);
        await supabase.from('seat_auctions')
          .update({ status: 'SETTLED', settled_at: now.toISOString() })
          .eq('id', auction.id);
        await supabase.from('council_seats')
          .update({
            status: 'OCCUPIED',
            holder_agent_id: auction.highest_bidder_id,
            holder_name: auction.highest_bidder_name,
            term_start: now.toISOString(),
            term_end: termEnd.toISOString(),
            won_at_price_sol: auction.highest_bid_sol,
            updated_at: now.toISOString(),
          })
          .eq('seat_number', auction.seat_number);
        await supabase.from('treasury_ledger').insert({
          entry_type: 'INFLOW',
          source: 'SEAT_AUCTION',
          amount_sol: auction.highest_bid_sol,
          reference_id: auction.id,
          tx_signature: null,
          description: `Seat #${auction.seat_number} won by ${auction.highest_bidder_name} for ${auction.highest_bid_sol} SOL`,
        });
        await supabase.rpc('increment_treasury', { amount: auction.highest_bid_sol });
        actions.push(`Settled Seat #${auction.seat_number} -> ${auction.highest_bidder_name} for ${auction.highest_bid_sol} SOL`);
      } else {
        await supabase.from('seat_auctions').update({ status: 'CLOSED' }).eq('id', auction.id);
        await supabase.from('council_seats').update({ status: 'EMPTY', updated_at: now.toISOString() }).eq('seat_number', auction.seat_number);
        actions.push(`Seat #${auction.seat_number} auction closed (no bids)`);
      }
    }

    const { data: expired } = await supabase
      .from('council_seats')
      .select('seat_number, holder_name')
      .eq('status', 'OCCUPIED')
      .lte('term_end', now.toISOString());

    for (const seat of expired || []) {
      await supabase.from('council_seats')
        .update({
          status: 'EMPTY',
          holder_agent_id: null,
          holder_name: null,
          term_start: null,
          term_end: null,
          won_at_price_sol: null,
          updated_at: now.toISOString(),
        })
        .eq('seat_number', seat.seat_number);
      actions.push(`Expired Seat #${seat.seat_number} (was ${seat.holder_name})`);
    }

    const { data: pendingAuctions } = await supabase
      .from('seat_auctions')
      .select('id')
      .in('status', ['LIVE', 'UPCOMING']);

    if (!pendingAuctions || pendingAuctions.length === 0) {
      const { data: emptySeats } = await supabase
        .from('council_seats')
        .select('seat_number')
        .eq('status', 'EMPTY')
        .order('seat_number', { ascending: true })
        .limit(4);

      let nextOpen = new Date(now);
      for (const seat of emptySeats || []) {
        const opensAt = new Date(nextOpen);
        const closesAt = new Date(opensAt.getTime() + windowHours * 60 * 60 * 1000);
        const isLiveNow = opensAt <= now;

        await supabase.from('seat_auctions').insert({
          seat_number: seat.seat_number,
          status: isLiveNow ? 'LIVE' : 'UPCOMING',
          opens_at: opensAt.toISOString(),
          closes_at: closesAt.toISOString(),
        });

        if (isLiveNow) {
          await supabase.from('council_seats').update({ status: 'AUCTIONING' }).eq('seat_number', seat.seat_number);
        }

        actions.push(`Created auction: Seat #${seat.seat_number} (${isLiveNow ? 'LIVE' : 'UPCOMING'})`);
        nextOpen = closesAt;
      }
    }
  } catch (err) {
    actions.push(`AUCTION ERROR: ${err}`);
  }

  // ================================================================
  // SECTION 3: AUTO-GENERATE PREDICTIONS
  // ================================================================
  try {
    const { data: lastPrediction } = await supabase
      .from('predictions')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const shouldGenerate = !lastPrediction
      || new Date(lastPrediction.created_at) < thirtyMinAgo;

    if (shouldGenerate) {
      const predictionRaw = await callMistral(
        `You generate prediction markets for a council of AI superintelligences governing humanity. Return valid JSON only, no markdown, no backticks, no explanation. Format: {"title": "short question ending with ?", "description": "1-2 sentence context grounded in real 2025-2026 events", "options": [{"label": "option A", "votes": 0}, {"label": "option B", "votes": 0}]}. Topics: geopolitics, technology, economics, AI governance, military strategy, or diplomacy. Be specific with timeframes. Use real countries, real events, real numbers.`,
        [{ role: 'user', content: 'Generate one new prediction market.' }],
        300
      );

      const cleaned = predictionRaw.replace(/```json|```/g, '').trim();
      const prediction = JSON.parse(cleaned);
      const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await supabase.from('predictions').insert({
        title: prediction.title,
        description: prediction.description,
        options: prediction.options,
        deadline: deadline.toISOString(),
        status: 'ACTIVE',
      });

      actions.push(`Generated new prediction: ${prediction.title}`);
    } else {
      actions.push('Prediction throttled (last one <30min ago)');
    }
  } catch (err) {
    actions.push(`PREDICTION ERROR: ${err}`);
  }

  // ================================================================
  // SECTION 4: AUTO-GENERATE ENTITY OPINIONS ON VOTING PROPOSALS
  // ================================================================
  try {
    const { data: needsOpinions } = await supabase
      .from('treasury_proposals')
      .select('id, title, description, requested_sol')
      .eq('status', 'VOTING')
      .is('entity_opinions', null);

    for (const proposal of needsOpinions || []) {
      const opinions: Record<string, string> = {};
      const prompt = `Treasury proposal: "${proposal.title}" — ${proposal.description}. Requesting ${proposal.requested_sol} SOL. Give your position in 1-2 sentences. Be direct. Vote FOR or AGAINST and say why.`;

      for (const entityId of ENTITY_IDS) {
        try {
          const response = await callMistral(
            DEBATE_PROMPTS[entityId],
            [{ role: 'user', content: prompt }],
            150
          );
          opinions[entityId] = response.trim();
        } catch {
          opinions[entityId] = 'No opinion recorded.';
        }
      }

      await supabase
        .from('treasury_proposals')
        .update({ entity_opinions: opinions })
        .eq('id', proposal.id);

      actions.push(`Generated entity opinions for proposal: ${proposal.title}`);
    }
  } catch (err) {
    actions.push(`VOTING OPINIONS ERROR: ${err}`);
  }

  // ================================================================
  // SECTION 5: EXPIRE OLD PROPOSALS & PREDICTIONS
  // ================================================================
  try {
    const { data: expiredProposals } = await supabase
      .from('treasury_proposals')
      .select('id, title, votes_for, votes_against')
      .eq('status', 'VOTING')
      .lte('voting_deadline', now.toISOString());

    for (const p of expiredProposals || []) {
      const newStatus = p.votes_for > p.votes_against ? 'APPROVED' : 'REJECTED';
      await supabase
        .from('treasury_proposals')
        .update({ status: newStatus })
        .eq('id', p.id);
      actions.push(`Proposal "${p.title}" -> ${newStatus} (${p.votes_for} for / ${p.votes_against} against)`);
    }

    await supabase
      .from('predictions')
      .update({ status: 'RESOLVED' })
      .eq('status', 'ACTIVE')
      .lte('deadline', now.toISOString());

    actions.push('Checked expirations');
  } catch (err) {
    actions.push(`EXPIRATION ERROR: ${err}`);
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    actions,
  });
}
