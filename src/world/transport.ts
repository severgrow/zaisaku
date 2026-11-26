import type { Facing } from './types.js';

/** Local stand-in for a future authoritative movement stream. It does not pretend anyone else is online. */
export interface PlayerInput {
  locationId: string;
  x: number;
  y: number;
  facing: Facing;
  seq: number;
}

export interface WorldTransport {
  send(input: PlayerInput): void;
}

export const localTransport = (): WorldTransport => ({
  send() {
    /* The district is local. NPCs are inhabitants, not connected players. */
  },
});
