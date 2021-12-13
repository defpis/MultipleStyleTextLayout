export interface Transform {
  x: number;
  y: number;
  z: number;
}

export const translate: Transform = { x: 0, y: 0, z: 0 };
export const scale: Transform = { x: 1, y: 1, z: 1 };
