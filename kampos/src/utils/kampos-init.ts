import { Kampos, effects } from "kampos";
import { getVideoElement } from "../constants";
import { initPane } from "./pane";
import { getQueryValue, onStateChange, setState } from "./state";
import { setVideoSource } from "./utilts";
import { resolveMediaFromPath } from "./kampos-media";

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

let allEffects: Record<string, any[]> = {};
let video = getVideoElement();
let kamposInstance: Kampos | null = null;
let activeEffects: string[] = [];

function updateEffects() {
    initKampos();
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

function updateActiveEffects() {
    activeEffects = Object.keys(effects).filter((effectName) => window.state.effects[effectName].active);
}

async function initKampos() {
    const target = document.querySelector("#target");
    updateActiveEffects();
    allEffects = {};
    for (const effectName of activeEffects) {
        const effectConfig = await resolveConfig(window.state.effects[effectName]);
        allEffects[effectName] = effects[effectName](effectConfig);
        console.log(effectName);
        if (effectName === "blend") {
            console.log(effectConfig);
        }
    }
    kamposInstance = new Kampos({
        target,
        effects: Object.values(allEffects),
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
        if (video.readyState >= 2) {
            resolve(video);
        } else {
            video.addEventListener("loadeddata", () => resolve(video), { once: true });
            video.addEventListener("error", (e) => reject(new Error(`Video loading error: ${e.message}`)), {
                once: true,
            });
        }
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

        setVideoSource(getVideoElement(), window.state.video);
    });

    const queryState = getQueryValue();
    setState(queryState || pane.exportState());
});
