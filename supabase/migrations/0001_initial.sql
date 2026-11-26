-- Zaisaku v0.1 schema draft.
-- Not applied. Not connected. Do not run this against the Futasaku project.
-- Hosting it is a separate decision because a hosted database costs money.
--
-- The client never writes a balance. A later service role runs the same
-- commands as src/economy and src/engine, inside a transaction.
-- Row security is on. No policy below grants the public roles anything.
-- The comments say who a later policy should allow.

create extension if not exists pgcrypto;

-- Players. A guest profile can be linked later by setting auth_user_id once.
create table players (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  created_at timestamptz not null default now()
);
alter table players enable row level security;
-- later: a player can read their own row. No client insert of another person's id.

create table profiles (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null unique references players (id),
  display_name text not null,
  seed bigint not null,
  tick integer not null default 0,
  rules_version text not null default 'zaisaku-v0.1',
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
-- later: select where player_id is the caller. Updates of name only, via a command.

create table wallets (
  player_id uuid primary key references players (id),
  permanent integer not null default 0 check (permanent >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= permanent),
  cosmetic integer not null default 0 check (cosmetic >= 0),
  updated_at timestamptz not null default now()
);
alter table wallets enable row level security;
-- later: the owner can select. No client update. The service role writes after a command.
-- cosmetic must never be joined into a price.

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id),
  tick integer not null,
  amount integer not null,
  balance_after integer not null check (balance_after >= 0),
  reason text not null,
  ref text not null default '',
  created_at timestamptz not null default now()
);
create index ledger_entries_player_idx on ledger_entries (player_id, created_at);
alter table ledger_entries enable row level security;
-- later: owner select. Inserts only from the service role. Sum of amount must equal wallets.permanent.

create table item_definitions (
  id text primary key,
  version integer not null,
  body jsonb not null,
  published_at timestamptz not null default now()
);
alter table item_definitions enable row level security;
-- later: any signed-in player can select. Writes are a catalogue publish by the service role.
-- body matches ItemDefinition. It holds effect type names and params, never executable code.

create table item_instances (
  id uuid primary key default gen_random_uuid(),
  definition_id text not null references item_definitions (id),
  owner_id uuid references players (id),
  condition integer not null check (condition between 0 and 100),
  authenticity text not null check (authenticity in ('genuine', 'counterfeit')),
  acquired_at integer not null,
  acquisition_price integer not null check (acquisition_price >= 0),
  status text not null check (status in ('offered', 'held', 'listed', 'escrow', 'retired')),
  revealed_props text[] not null default '{}',
  serial text not null,
  provenance text[] not null default '{}',
  effect_state jsonb not null default '{}',
  location text not null check (location in ('duel', 'market', 'vault', 'auction', 'house')),
  unique (serial)
);
create index item_instances_owner_idx on item_instances (owner_id);
alter table item_instances enable row level security;
-- later: a player reads their own vault rows.
-- Offered duel objects and market listings are visible only as the public view, not as this full row.
-- One owner and one location. The service role moves them.

create table price_quotes (
  id bigint generated always as identity primary key,
  tick integer not null,
  instance_id uuid not null references item_instances (id),
  ask integer not null check (ask > 0),
  liquidation integer not null check (liquidation > 0),
  created_at timestamptz not null default now()
);
alter table price_quotes enable row level security;
-- later: readable with the listing or the vault row they describe. Inserts from the service role.
-- These are history. Settlement calls appraise again. It does not trust a client quote.

create table transactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id),
  tick integer not null,
  kind text not null check (kind in ('buy', 'sell', 'auction', 'reward', 'adjust')),
  instance_id uuid references item_instances (id),
  amount integer not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table transactions enable row level security;
-- later: owner select. Service role insert. A reward kind is written once per contract.

create table auctions (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references item_instances (id),
  reserve integer not null check (reserve > 0),
  increment integer not null check (increment > 0),
  remaining_ticks integer not null check (remaining_ticks >= 0),
  extensions integer not null default 0,
  max_extensions integer not null,
  status text not null check (status in ('open', 'settled', 'refunded', 'cancelled')),
  winner_id uuid references players (id),
  tick integer not null default 0
);
alter table auctions enable row level security;
-- later: players who can see the floor can select open lots. Settlement is the service role.

create table auction_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references auctions (id),
  bidder_id uuid references players (id),
  label text not null,
  amount integer not null check (amount > 0),
  tick integer not null,
  simulated boolean not null default false,
  withdrawn boolean not null default false
);
alter table auction_bids enable row level security;
-- later: visible to anyone who can see the auction. simulated must stay true for house bidders.
-- The client does not insert a bid. The command checks funds, increment, and escrow.

create table contracts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id),
  match_id uuid,
  template_id text not null,
  title text not null,
  description text not null,
  reward integer not null check (reward >= 0),
  target integer not null check (target > 0),
  scope text not null check (scope in ('match', 'persistent')),
  status text not null check (status in ('active', 'complete', 'expired')),
  progress integer not null default 0,
  reward_paid boolean not null default false,
  assigned_tick integer not null
);
alter table contracts enable row level security;
-- later: a player reads their own rows only. The opponent's match contract is never selected for them.
-- reward_paid flips once, in the same transaction as the ledger entry.

create table market_events (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('match', 'floor')),
  match_id uuid,
  template_id text not null,
  name text not null,
  start_tick integer not null,
  end_tick integer not null,
  body jsonb not null,
  resolved boolean not null default false
);
alter table market_events enable row level security;
-- later: active events and the current rumour are public to the match or the floor.
-- body.summary for a future event is not included in the client view.

create table matches (
  id uuid primary key default gen_random_uuid(),
  rules_version text not null,
  rules_snapshot jsonb not null,
  seed bigint not null,
  status text not null check (status in ('open', 'complete', 'abandoned')),
  round integer not null default 1,
  created_at timestamptz not null default now()
);
alter table matches enable row level security;

create table match_players (
  match_id uuid not null references matches (id),
  player_id uuid not null references players (id),
  seat text not null check (seat in ('p0', 'p1')),
  simulated boolean not null default false,
  primary key (match_id, seat),
  unique (match_id, player_id)
);
alter table match_players enable row level security;
-- later: a player reads matches they sit. They do not read the other seat's private columns.
-- Private papers live on item_instances.revealed_props filtered by the view, and on contracts.

create table match_actions (
  id bigint generated always as identity primary key,
  match_id uuid not null references matches (id),
  seat text not null check (seat in ('p0', 'p1')),
  round integer not null,
  action jsonb not null,
  created_at timestamptz not null default now(),
  unique (match_id, seat, round)
);
alter table match_actions enable row level security;
-- later: a player does not read the opponent's row until the round resolves.
-- Reconnect replays this log with replayDuel. The server discards a client cash patch.

create table match_results (
  match_id uuid primary key references matches (id),
  winner text not null check (winner in ('p0', 'p1', 'draw')),
  scores jsonb not null,
  created_at timestamptz not null default now()
);
alter table match_results enable row level security;
-- later: both seats can read the result. Ranked code reads this table, not wallets.

create table ratings (
  player_id uuid primary key references players (id),
  value integer not null default 1000,
  matches integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table ratings enable row level security;
-- later: public read of the number. Writes only from a finished match_results row.
-- The permanent wallet is not an input.

create table cosmetics (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id),
  kind text not null check (kind in ('theme', 'frame')),
  token_set text not null,
  granted_at timestamptz not null default now()
);
alter table cosmetics enable row level security;
-- later: owner select. A theme recolours CSS variables. appraise does not read this table.

create table idempotency_keys (
  player_id uuid not null references players (id),
  key text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (player_id, key)
);
alter table idempotency_keys enable row level security;
-- later: the service role reads and writes. A duplicate key returns the stored result and does not move money.

alter table contracts
  add constraint contracts_match_fk foreign key (match_id) references matches (id);
alter table market_events
  add constraint market_events_match_fk foreign key (match_id) references matches (id);

-- No grants to anon or authenticated. Add policies in a later migration when a
-- Zaisaku-only project exists, matching the comments above.
revoke all on all tables in schema public from anon, authenticated;
