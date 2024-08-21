import { Kampos, effects } from "kampos";
import { getVideoElement } from "../constants";
import { initPane } from "./pane";
import { getQueryValue, onStateChange, setState } from "../utils/state";
import { resolveVideo } from "../utils/video-utils";
import { resolveMediaFromPath } from "./media-resolution";

let willBeAppliedEffects: Record<string, any[]> = {};
let video = getVideoElement();
let kamposInstance: any | null = null;
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

async function resolveConfig(config: any) {
    const entries = await Promise.all(
        Object.entries(config)
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

function updateEffects() {
    initKampos();
}

function getActiveEffects() {
    return Object.keys(effects).filter((effectName) => window.state.effects[effectName].active);
}

const EffectsPropsHasToBeOnInit: Record<string, string[]> = {
    alphaMask: ['isLuminance'],
};
function splitEffectConfigToInitialsAndSetters(effectConfig: any) {
    const initials: any = {};
    const setters: any = {};
    Object.entries(effectConfig).forEach(([key, value]) => {
        if (EffectsPropsHasToBeOnInit[key]) {
            EffectsPropsHasToBeOnInit[key].forEach((prop) => {
                if (typeof value[prop] !== 'undefined') {
                    initials[prop] = value[prop];
                }
            });
        } else {
            setters[key] = value;
        }
    });
    return {initials, setters} as const;
}
const onEffectApplied = (willBeAppliedEffects: any, effectName: string) => {
    const onEffectAppliedMapper = {
        alphaMask: () => {
            willBeAppliedEffects[effectName].textures[0].update = true
        },
    };
    onEffectAppliedMapper[effectName]?.();
}

async function initKampos() {
    const target = document.querySelector("#target");
    willBeAppliedEffects = {};
    for (const effectName of getActiveEffects()) {
        const effectConfig = await resolveConfig(window.state.effects[effectName]);
        console.log(`[config] ${effectName}:`, effectConfig);
        const { initials, setters } = splitEffectConfigToInitialsAndSetters(effectConfig);
        willBeAppliedEffects[effectName] = effects[effectName](initials);
        Object.entries(setters).forEach(([key, value]) => {
            willBeAppliedEffects[effectName][key] = value;
        });

        onEffectApplied(willBeAppliedEffects, effectName);
    }
    kamposInstance = new Kampos({
        target,
        effects: Object.values(willBeAppliedEffects),
    });

    kamposInstance.setSource({
        media: video,
        width: video?.videoWidth,
        height: video?.videoHeight,
    });

    kamposInstance.play();
}

function prepareVideo() {
    return new Promise<HTMLVideoElement>((resolve, reject) => {
        const video = getVideoElement();
        resolveVideo(video, resolve, reject);
    });
}

async function initDemo() {
    try {
        video = await prepareVideo();
        await initKampos();
        video.play();
        kamposInstance.play();
        updateEffects();
    } catch (error) {
        console.error("Error initializing demo:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const pane = initPane();
    initDemo();

    onStateChange((value) => {
        pane.importState(value);
        setTimeout(() => {
            updateEffects();
        }, 200);
    });

    const queryState = getQueryValue();
    setState(queryState || pane.exportState());
});
