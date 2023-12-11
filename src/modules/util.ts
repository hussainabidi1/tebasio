export const random = (min: number, max: number) => Math.random() * (max - min) + min;

export const floorRandom = (min: number, max: number) => Math.floor(random(min, max));

export const randomColor = () => `hsl(${floorRandom(0, 360)}, 50%, 50%)`;

const offsetHsl = (originalHue: number, offset: number) => {
    originalHue = (originalHue + offset) % 360; // Ensure the hue is within the valid range [0, 360)
    if (originalHue < 0) {
        originalHue += 360;
    }

    return originalHue;
}

export const offsetColor = (hsl: string) => {
    const hslInput: string = hsl;

    // Extract hue, saturation, and lightness from the input using regular expression
    const match = hslInput.match(/hsl\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);

    if (match) {
        const initialHue: number = parseFloat(match[1]);
        const initialSaturation: number = parseFloat(match[2]);
        const initialLightness: number = parseFloat(match[3]);

        // Offset values
        const hueOffset: number = 10; // You can adjust the hue offset value

        // Offset the hue
        const newHue: number = offsetHsl(initialHue, hueOffset);

        // Construct the new HSL color
        const newColor: string = `hsl(${newHue}, ${initialSaturation}%, ${initialLightness}%)`;
        return newColor;
    }
}
