// @ts-expect-error
import { Kampos, effects } from "kampos";
import {  getVideoElement } from "./constants";
import { initPane, state } from "./pane";
import { getQueryValue, onStateChange, setState } from "./state";

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


function updateActiveEffects() {
    // @ts-expect-error
    activeEffects = Object.keys(effects).filter((effectName) => state.effects[effectName].active);
}

function updateEffects() {
    initKampos();
}

function resolveConfig(config: any) {
    return Object.fromEntries(
        Object.entries(config).filter(([key, value]) => value !== 'none' && value !== 'WIP').map(([key, value]) => {
            if (typeof value === "string" && value.startsWith("#")) {
                return [key, hexToNormalizedRGBA(value)];
            }
            return [key, value];
        })
    );
}

async function initKampos() {
    const target = document.querySelector("#target");
    updateActiveEffects();
    allEffects = {};
    activeEffects.forEach((effectName) => {
        // @ts-expect-error
        allEffects[effectName] = effects[effectName](resolveConfig(state.effects[effectName]));
    });
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
    const state = getQueryValue();
    pane.importState(state);
    setState(state);

    onStateChange(()=>{
        updateEffects();
    });
});
