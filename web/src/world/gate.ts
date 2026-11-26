/** One Phaser game, loaded only when World Mode opens. Terminal Mode never imports this module's Phaser chunk. */

let game: import('phaser').Game | null = null;
let loading: Promise<void> | null = null;
let wanted = false;
let asleep = false;

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (!game) return;
    game.scale.resize(Math.max(320, window.innerWidth), Math.max(320, window.innerHeight));
  });
}

const ensure = async (): Promise<void> => {
  if (game || loading) return loading ?? Promise.resolve();
  loading = (async () => {
    const Phaser = (await import('phaser')).default;
    const { DistrictScene } = await import('./scene.js');
    if (!wanted) return;
    game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: 'world-host',
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      backgroundColor: '#141311',
      banner: false,
      disableContextMenu: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: Math.max(320, window.innerWidth),
        height: Math.max(320, window.innerHeight),
      },
      scene: [DistrictScene],
      audio: { noAudio: true },
    });
  })();
  try {
    await loading;
  } finally {
    loading = null;
  }
};

export const enterWorld = async (): Promise<void> => {
  wanted = true;
  if (game) {
    if (asleep) {
      game.loop.wake();
      asleep = false;
    }
    game.scale.refresh();
    return;
  }
  await ensure();
};

export const leaveWorld = (): void => {
  wanted = false;
  if (game && !asleep) {
    game.loop.sleep();
    asleep = true;
  }
};

export const onVisibility = (hidden: boolean, inWorld: boolean): void => {
  if (!game) return;
  if (hidden && !asleep) {
    game.loop.sleep();
    asleep = true;
    return;
  }
  if (!hidden && inWorld && asleep) {
    game.loop.wake();
    asleep = false;
    game.scale.refresh();
  }
};
