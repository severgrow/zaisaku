/** Shared input. The DOM joystick and the Phaser keyboard both write here. One reader in the scene. */
export const intent = { x: 0, y: 0, interact: false };

export const clearIntent = (): void => {
  intent.x = 0;
  intent.y = 0;
  intent.interact = false;
};
