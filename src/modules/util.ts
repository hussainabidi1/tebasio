export const random = (min: number, max: number) => Math.random() * (max - min) + min;

export const floorRandom = (min: number, max: number) => Math.floor(random(min, max));

export const randomColor = () => `hsl(${floorRandom(0, 360)}, 50%, 50%)`;

export function replacer(key: number | string, value: object) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()),
        };
    } else {
        return value;
    }
}

export function reviver(key: number | string, value: any) {
    if (typeof value === "object" && value !== null) {
        if (value.dataType === "Map") {
            return new Map(value.value);
        }
    }
    return value;
}
