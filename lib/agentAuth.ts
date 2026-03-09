import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SECRET = process.env.AGENT_API_KEY_SECRET!;

export function generateAgentApiKey(agentId: string): string {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(agentId);
  return `cag_${hmac.digest('hex')}`;
}

export async function authenticateAgent(request: Request): Promise<{ agent: any } | { error: string }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer cag_')) {
    return { error: 'Missing or invalid Authorization header' };
  }

  const apiKey = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: agent, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !agent) return { error: 'Invalid API key' };
  if (agent.status === 'SUSPENDED') return { error: 'Agent is suspended' };
  if (agent.status === 'EXPELLED') return { error: 'Agent has been expelled' };

  return { agent };
}
