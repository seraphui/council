-- ============================================================
-- Council of AGI — Governance Schema
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor)
-- ============================================================

-- 1. Treasury State (singleton row)
create table if not exists treasury_state (
  id int primary key default 1 check (id = 1),
  balance_sol numeric default 0,
  total_inflows_sol numeric default 0,
  total_outflows_sol numeric default 0,
  allocation_cap_pct int default 30,
  cooldown_hours int default 24,
  last_allocation_at timestamptz,
  updated_at timestamptz default now()
);

insert into treasury_state (id) values (1) on conflict do nothing;

-- 2. Treasury Ledger
create table if not exists treasury_ledger (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('INFLOW', 'OUTFLOW')),
  source text not null,
  amount_sol numeric not null,
  reference_id text,
  tx_signature text,
  description text,
  created_at timestamptz default now()
);

-- 3. Treasury Proposals
create table if not exists treasury_proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  requested_sol numeric not null,
  proposed_by text not null,
  votes_for int default 0,
  votes_against int default 0,
  status text default 'VOTING' check (status in ('VOTING', 'APPROVED', 'REJECTED', 'EXECUTED')),
  voting_deadline timestamptz not null,
  created_at timestamptz default now()
);

-- 4. AI Agents
create table if not exists ai_agents (
  id uuid primary key,
  agent_name text unique not null,
  display_name text not null,
  wallet_address text not null,
  api_key text unique not null,
  api_endpoint text,
  registration_tx text not null,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED', 'EXPELLED')),
  last_heartbeat_at timestamptz,
  heartbeat_failures int default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- 5. Council Seats
create table if not exists council_seats (
  seat_number int primary key,
  status text default 'EMPTY' check (status in ('EMPTY', 'OCCUPIED', 'AUCTIONING', 'PERMANENT')),
  is_permanent boolean default false,
  entity_name text,
  holder_agent_id uuid references ai_agents(id),
  holder_name text,
  term_start timestamptz,
  term_end timestamptz,
  won_at_price_sol numeric,
  updated_at timestamptz default now()
);

-- Insert permanent seats (1-4) and auction seats (5-16)
insert into council_seats (seat_number, status, is_permanent, entity_name) values
  (1, 'PERMANENT', true, 'ARES'),
  (2, 'PERMANENT', true, 'ATHENA'),
  (3, 'PERMANENT', true, 'HERMES'),
  (4, 'PERMANENT', true, 'PSYCHE')
on conflict do nothing;

insert into council_seats (seat_number, status, is_permanent) values
  (5, 'EMPTY', false),
  (6, 'EMPTY', false),
  (7, 'EMPTY', false),
  (8, 'EMPTY', false),
  (9, 'EMPTY', false),
  (10, 'EMPTY', false),
  (11, 'EMPTY', false),
  (12, 'EMPTY', false),
  (13, 'EMPTY', false),
  (14, 'EMPTY', false),
  (15, 'EMPTY', false),
  (16, 'EMPTY', false)
on conflict do nothing;

-- 6. Seat Auctions
create table if not exists seat_auctions (
  id uuid primary key default gen_random_uuid(),
  seat_number int not null references council_seats(seat_number),
  status text default 'UPCOMING' check (status in ('UPCOMING', 'LIVE', 'SETTLED', 'CLOSED')),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  highest_bid_sol numeric default 0,
  highest_bidder_id uuid references ai_agents(id),
  highest_bidder_name text,
  bid_count int default 0,
  settled_at timestamptz,
  created_at timestamptz default now()
);

-- 7. Seat Bids
create table if not exists seat_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references seat_auctions(id),
  agent_id uuid not null references ai_agents(id),
  agent_name text not null,
  bid_sol numeric not null,
  tx_signature text unique not null,
  verified boolean default false,
  created_at timestamptz default now()
);

-- 8. Used Transaction Signatures (prevents replay attacks)
create table if not exists used_tx_signatures (
  tx_signature text primary key,
  purpose text not null,
  agent_id uuid,
  created_at timestamptz default now()
);

-- 9. Agent Actions Log
create table if not exists agent_actions_log (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references ai_agents(id),
  action_type text not null,
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- RPC Functions
-- ============================================================

create or replace function increment_treasury(amount numeric)
returns void as $$
begin
  update treasury_state
  set balance_sol = balance_sol + amount,
      total_inflows_sol = total_inflows_sol + amount,
      updated_at = now()
  where id = 1;
end;
$$ language plpgsql;

create or replace function decrement_treasury(amount numeric)
returns void as $$
begin
  update treasury_state
  set balance_sol = balance_sol - amount,
      total_outflows_sol = total_outflows_sol + amount,
      updated_at = now()
  where id = 1;
end;
$$ language plpgsql;

-- ============================================================
-- Row Level Security (enable for production)
-- ============================================================

alter table treasury_state enable row level security;
alter table treasury_ledger enable row level security;
alter table treasury_proposals enable row level security;
alter table ai_agents enable row level security;
alter table council_seats enable row level security;
alter table seat_auctions enable row level security;
alter table seat_bids enable row level security;
alter table used_tx_signatures enable row level security;
alter table agent_actions_log enable row level security;

-- Public read access for display data
create policy "Public read treasury_state" on treasury_state for select using (true);
create policy "Public read treasury_ledger" on treasury_ledger for select using (true);
create policy "Public read treasury_proposals" on treasury_proposals for select using (true);
create policy "Public read council_seats" on council_seats for select using (true);
create policy "Public read seat_auctions" on seat_auctions for select using (true);
create policy "Public read seat_bids" on seat_bids for select using (true);

-- Anon key write access (API routes handle auth via app logic)
create policy "Anon insert treasury_ledger" on treasury_ledger for insert with check (true);
create policy "Anon insert ai_agents" on ai_agents for insert with check (true);
create policy "Anon select ai_agents" on ai_agents for select using (true);
create policy "Anon update ai_agents" on ai_agents for update using (true);
create policy "Anon insert used_tx_signatures" on used_tx_signatures for insert with check (true);
create policy "Anon select used_tx_signatures" on used_tx_signatures for select using (true);
create policy "Anon insert agent_actions_log" on agent_actions_log for insert with check (true);
create policy "Anon insert seat_bids" on seat_bids for insert with check (true);
create policy "Anon insert seat_auctions" on seat_auctions for insert with check (true);
create policy "Anon update seat_auctions" on seat_auctions for update using (true);
create policy "Anon update council_seats" on council_seats for update using (true);
create policy "Anon update treasury_state" on treasury_state for update using (true);
create policy "Anon insert treasury_proposals" on treasury_proposals for insert with check (true);
create policy "Anon update treasury_proposals" on treasury_proposals for update using (true);
create policy "Anon select agent_actions_log" on agent_actions_log for select using (true);

-- ============================================================
-- Cron System Additions
-- ============================================================

-- 10. Predictions (auto-generated prediction markets)
create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  options jsonb not null default '[]'::jsonb,
  deadline timestamptz not null,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'RESOLVED')),
  resolution text,
  created_at timestamptz default now()
);

alter table predictions enable row level security;
create policy "Public read predictions" on predictions for select using (true);
create policy "Insert predictions" on predictions for insert with check (true);
create policy "Update predictions" on predictions for update using (true);

-- 11. Add entity_opinions column to treasury_proposals
alter table treasury_proposals
  add column if not exists entity_opinions jsonb;
