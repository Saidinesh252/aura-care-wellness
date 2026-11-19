type PixelPalette = Record<string, string>;

export type PipExpression = 'idle' | 'blink' | 'talk';
export type PipHandFrame = 'up' | 'side';

const colors: PixelPalette = {
  '.': 'transparent',
  'X': '#0c2219', // Darkest outline
  'S': '#194935', // Deep moss shadow
  'G': '#2e7a52', // Mid shadow
  'L': '#4ebf6c', // Emerald green
  'E': '#7ee87a', // Bright mint highlight
  'H': '#c0ff9d', // Pastel glow
  'W': '#ffffff', // Specular glint
  'B': '#ff7d99', // Rosy cheek blush
  'K': '#081711', // Deep eye pupil / mouth
};

const bodyIdle = [
  '.....XXXXXX.....',
  '...XXHHHEELGXX..',
  '..XWHHHHEELLGSX.',
  '.XWHHHHEEELLGGSX',
  '.XHHHHEEELLLLGSX',
  '.XHEEELLLLLLLGSX',
  '.XEELLLLLLLLLGSX',
  '.XELLKELLKELLGSX',
  '.XELLKWWLKWWLGSX',
  '.XLLLBLLLLBLLGSX',
  '.XLLLLGXXGLLLGSX',
  '.XXLLLGGGGGGSSX.',
  '..XXGGGGGGGGSSX.',
  '...XXSSSSSSSSX..',
  '....XXXXXXXX....',
  '................',
];

const bodyBlink = [
  '.....XXXXXX.....',
  '...XXHHHEELGXX..',
  '..XWHHHHEELLGSX.',
  '.XWHHHHEEELLGGSX',
  '.XHHHHEEELLLLGSX',
  '.XHEEELLLLLLLGSX',
  '.XEELLLLLLLLLGSX',
  '.XELLLLLLLLLLGSX',
  '.XELLXLLLLXLGSX.',
  '.XLLLBLLLLBLLGSX',
  '.XLLLLGXXGLLLGSX',
  '.XXLLLGGGGGGSSX.',
  '..XXGGGGGGGGSSX.',
  '...XXSSSSSSSSX..',
  '....XXXXXXXX....',
  '................',
];

const bodyTalk = [
  '.....XXXXXX.....',
  '...XXHHHEELGXX..',
  '..XWHHHHEELLGSX.',
  '.XWHHHHEEELLGGSX',
  '.XHHHHEEELLLLGSX',
  '.XHEEELLLLLLLGSX',
  '.XEELLLLLLLLLGSX',
  '.XELLKELLKELLGSX',
  '.XELLKWWLKWWLGSX',
  '.XLLLBLLLLBLLGSX',
  '.XLLLLGKKGLLLGSX',
  '.XXLLLGKKGGGSSX.',
  '..XXGGGGGGGGSSX.',
  '...XXSSSSSSSSX..',
  '....XXXXXXXX....',
  '................',
];

const handUp = [
  '....X.X.',
  '...XEXEX',
  '..XEXEXX',
  '.XELLEEX',
  '.XLLLLSX',
  '..XGGXX.',
  '..XGXX..',
  '.XXXX...',
];

const handSide = [
  '..X.X...',
  '.XEXEX..',
  'XXEXEXX.',
  'XELLEEX.',
  '.XLLLLSX',
  '..XGGXX.',
  '...XGXX.',
  '....XXXX',
];

function drawGrid(canvas: HTMLCanvasElement, pixels: string[]) {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const [y, row] of pixels.entries()) {
    for (const [x, cell] of [...row].entries()) {
      const color = colors[cell];
      if (!color || color === 'transparent') continue;
      context.fillStyle = color;
      context.fillRect(x, y, 1, 1);
    }
  }
}

export function drawPip(canvas: HTMLCanvasElement, frame: PipExpression = 'idle') {
  const grid = frame === 'blink' ? bodyBlink : frame === 'talk' ? bodyTalk : bodyIdle;
  drawGrid(canvas, grid);
}

export function drawPipHand(canvas: HTMLCanvasElement, frame: PipHandFrame = 'up') {
  const grid = frame === 'side' ? handSide : handUp;
  drawGrid(canvas, grid);
}
