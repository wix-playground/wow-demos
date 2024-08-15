// @ts-expect-error
import { Kampos, effects } from "kampos";
import {  getVideoElement } from "./constants";
import { BindingApiEvents } from "tweakpane";
import debounce from "debounce";
import { initPane, GUI_CONFIG } from "./pane";

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
    activeEffects = Object.keys(effects).filter((effectName) => GUI_CONFIG.effects[effectName].active);
}

const debounceReinitKampos = debounce(initKampos, 300);
function updateEffects(ev?: BindingApiEvents<any>['change']) {
    if(ev && ev.last || !ev){
        initKampos();
        debounceReinitKampos();
    }
}

function resolveConfig(config: any) {
    return Object.fromEntries(
        Object.entries(config).map(([key, value]) => {
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
        allEffects[effectName] = effects[effectName](resolveConfig(GUI_CONFIG.effects[effectName]));
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
    initPane(updateEffects);
    initDemo();
});

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
