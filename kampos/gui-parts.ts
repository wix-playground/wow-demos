import { CONFIG_KEYS, VIDEO_SOURCES } from "./constants";

export function getGuiConfig() {
    return {
        [CONFIG_KEYS.VIDEO]: VIDEO_SOURCES[0], // Default video
        effects: {
            duotone: {
                active: true,
                dark: [255, 255, 255],
                // light: [0, 0, 255],
            },
            brightnessContrast: {
                active: false,
                brightness: 1.0,
                contrast: 1.0,
            },
            hueSaturation: {
                active: false,
                hue: 0.0,
                saturation: 1.0,
            },
            blend: {
                active: false,
                mode: "normal",
                color: [0, 0, 0, 1],
            },
            alphaMask: {
                active: false,
                isLuminance: false,
            },
            displacement: {
                active: false,
                wrap: "stretch",
                scaleX: 0.0,
                scaleY: 0.0,
            },
            turbulence: {
                active: false,
                noise: "simplex",
                output: "COLOR",
                frequencyX: 0.0,
                frequencyY: 0.0,
                octaves: 1,
                isFractal: false,
                time: 0,
            },
            kaleidoscope: {
                active: false,
                segments: 6,
                offset: 0,
            },
            fadeTransition: {
                active: false,
                progress: 0.0,
            },
            displacementTransition: {
                active: false,
                progress: 0.0,
            },
            dissolveTransition: {
                active: false,
                progress: 0.0,
            },
        },
    };
}
