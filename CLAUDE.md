# CLAUDE.md

- Read `docs/GAME-RULES.md` and `docs/ECONOMY.md` before changing play. They are the source of truth for v0.1.
- TypeScript strict, Vitest, Node 20+ (20.19+, required by Vite). Run `npm run check` before finishing.
- `src/engine/` stays pure and deterministic: no `Math.random`, no I/O, no timers.
- Write tests first for rules. Never change a rule or weaken a test to make it pass.
- If a rule is ambiguous, stop and ask. Do not invent real-money, payment, or shared-Futasaku behaviour.
