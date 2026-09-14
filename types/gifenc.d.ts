declare module 'gifenc' {
  export function GIFEncoder(...args: any[]): any;
  export function quantize(rgba: Uint8ClampedArray | Uint8Array, maxColors: number, opts?: any): any;
  export function applyPalette(rgba: Uint8ClampedArray | Uint8Array, palette: any, format?: any): Uint8Array;
}
