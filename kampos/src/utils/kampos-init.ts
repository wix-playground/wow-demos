import { Kampos, effects } from "kampos";
import {  getVideoElement } from "../constants";
import { initPane } from "./pane";
import { getQueryValue, onStateChange, setState } from "./state";
import { setVideoSource } from "./utilts";

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

function resolveConfig(config: any) {
    return Object.fromEntries(
        Object.entries(config).filter(([_, value]) => value !== 'none' && value !== 'WIP').map(([key, value]) => {
            if (typeof value === "string" && value.startsWith("#")) {
                return [key, hexToNormalizedRGBA(value)];
            }
            return [key, value];
        })
    );
}

function updateActiveEffects() {
    activeEffects = Object.keys(effects).filter((effectName) => window.state.effects[effectName].active);
}

async function initKampos() {
    const target = document.querySelector("#target");
    updateActiveEffects();
    allEffects = {};
    activeEffects.forEach((effectName) => {
        allEffects[effectName] = effects[effectName](resolveConfig(window.state.effects[effectName]));
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

function setupDragAndDrop() {
    const dropOverlay = document.getElementById('drag-n-drop');
    const body = document.body;

    body.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dropOverlay?.classList.add('active');
    });

    body.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    body.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropOverlay?.classList.remove('active');
    });

    body.addEventListener('drop', (e) => {
        e.preventDefault();
        dropOverlay?.classList.remove('active');
        const file = e.dataTransfer?.files[0];
        if (file && (file.type === 'video/mp4' || file.type === 'video/webm')) {
            const videoURL = URL.createObjectURL(file);
            const video = getVideoElement();
            video.src = videoURL;
            video.load();
            video.play();
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
        setupDragAndDrop();
    } catch (error) {
        console.error("Error initializing demo:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const pane = initPane();
    initDemo();

    onStateChange((value)=>{
        pane.importState(value);
        setTimeout(() => {
            updateEffects();
        }, 200);

        if(!getVideoElement().src.endsWith(window.state.video)){
            setVideoSource(getVideoElement(), window.state.video);
        }
    });

    const queryState = getQueryValue();
    setState(queryState || pane.exportState());
});
