import { effects, noise } from "kampos";
import { loadImage, loadVideo } from "../utils/media-utils";

const mediaResolutionCache = new Map();
async function resolveMediaFromPath(path: string) {
    // Check if the path has already been resolved
    if (mediaResolutionCache.has(path)) {
        return mediaResolutionCache.get(path);
    }

    const extension = path.split(".").pop().toLowerCase();
    let resolvedValue;

    try {
        if (["png", "jpg", "jpeg", "gif"].includes(extension)) {
            resolvedValue = await loadImage(path);
        } else if (["mp4", "webm", "ogg"].includes(extension)) {
            resolvedValue = await loadVideo(path);
        } else if (path.startsWith("canvas")) {
            console.log("resolving canvas vladd", path);
            resolvedValue = document.getElementById(path);
        } else {
            // Fallback: Return the path as a string if it doesn't match expected extensions
            resolvedValue = path;
        }

        // Store the resolved value in the cache
        mediaResolutionCache.set(path, resolvedValue);
        return resolvedValue;
    } catch (error) {
        console.error(error);
        // In case of an error, return the path itself as a fallback
        return path;
    }
}

function hexToNormalizedRGBA(hex: string): number[] {
    hex = hex.replace(/^#/, "");
    let r,
        g,
        b,
        a = 1.0;
    if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 8) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        a = parseInt(hex.substring(6, 8), 16) / 255;
    } else {
        throw new Error("Invalid hex color format");
    }
    return [r / 255, g / 255, b / 255, a];
}

const effectConfigResolvers ={
    'displacement': ({scaleX, scaleY, wrap, ...effectConfig}) => ({
        ...effectConfig,
        wrap: effects.displacement[wrap],
        scale: {
            x: scaleX,
            y: scaleY,
        },
    }),
    'turbulence': ({noise: noiseParam, frequencyX, frequencyY, output, ...effectConfig}) => ({
        ...effectConfig,
        noise: noise[noiseParam],
        output: effects.turbulence[output],
        frequency: {
            x: frequencyX,
            y: frequencyY,
        },
    }),
};
function getEffectConfigResolver(effectName: string) {
    const fallbackResolver = (effectConfig) => effectConfig;
    return effectName in effectConfigResolvers ? effectConfigResolvers[effectName] : fallbackResolver;

}

export async function resolveConfig(effectName: string, config: any) {
    const effectConfigResolver = getEffectConfigResolver(effectName);
    const entries = await Promise.all(
        Object.entries(effectConfigResolver(config))
            .filter(([_, value]) => value !== "none" && value !== "WIP")
            .map(async ([key, value]) => {
                if (typeof value === "string") {
                    if (value.startsWith("#")) {
                        return [key, hexToNormalizedRGBA(value)];
                    }
                    const resolvedValue = await resolveMediaFromPath(value);
                    return [key, resolvedValue];
                }
                return [key, value];
            })
    );

    return Object.fromEntries(entries);
}

const EffectsPropsHasToBeOnInit: Record<string, string[]> = {
    alphaMask: ['isLuminance'],
    blend: ['image'],
    displacement: ['wrap', 'scale'],
    turbulence: ['noise', 'output'],
};

export function splitEffectConfigToInitialsAndSetters(effectName: string, effectConfig: any) {
    const initials: any = {};
    const setters: any = {};
    const propsToInitialize = EffectsPropsHasToBeOnInit[effectName] || [];

    Object.entries(effectConfig).forEach(([key, value]) => {
        if (propsToInitialize.includes(key)) {
            initials[key] = value;
        } else {
            setters[key] = value;
        }
    });

    return { initials, setters } as const;
}

export const onEffectApplied = (effect, effectName: string) => {
    const onEffectAppliedMapper = {
        alphaMask: () => {
            effect.textures[0].update = true
        },
        displacement: () => {
            effect.textures[0].update = true
        },
    };
    onEffectAppliedMapper[effectName]?.();
}
