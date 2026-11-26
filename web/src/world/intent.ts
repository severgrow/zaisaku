/**
 * One navigation generation. A new tap replaces the live course inside the scene.
 * Menus, travel, and leaving World Mode bump the epoch so a stale interact cannot fire.
 */
export const navigation = { epoch: 0, suspended: false };

export const bumpNavigation = (): void => {
  navigation.epoch += 1;
};
