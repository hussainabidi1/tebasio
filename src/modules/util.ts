export const random = (min: number, max: number) => Math.random() * (max - min) + min;

export const floorRandom = (min: number, max: number) => Math.floor(random(min, max));

export const randomColor = () => `hsl(${floorRandom(0, 360)}, 50%, 50%)`;