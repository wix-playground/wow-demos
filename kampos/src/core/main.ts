import { Kampos, effects } from "kampos";
import { EFFECT_NAMES, getVideoElement } from "../constants";
import { initPane } from "./pane";
import { getQueryValue, onStateChange, setState } from "../utils/state";
import { resolveVideo } from "../utils/media-utils";
import { onEffectApplied, resolveConfig, splitEffectConfigToInitialsAndSetters } from "./kampos-effects";

let willBeAppliedEffects: Record<string, any[]> = {};
let video = getVideoElement();
let kamposInstance: any | null = null;

function updateEffects() {
    initKampos();
}

function getActiveEffects() {
    return Object.keys(effects).filter((effectName) => window.state.effects[effectName].active);
}

function initTurbulenceEffect(effect) {
    const target = document.querySelector("#canvas");
    window.kamposCanvas = new Kampos({
        target,
        effects: [effect],
        noSource: true
    });
    window.kamposCanvas.play((time) => (effect.time = time * 2)); // TOOD: maybe configurable
};

async function initKampos() {
    const target = document.querySelector("#target");
    willBeAppliedEffects = {};
    for (const effectName of getActiveEffects()) {
        const effectConfig = await resolveConfig(effectName, window.state.effects[effectName]);
        console.log(`[config] ${effectName}:`, effectConfig);
        const { initials, setters } = splitEffectConfigToInitialsAndSetters(effectName, effectConfig);
        // console.log('split',effectName, {initials, setters});
        const effect = effects[effectName](initials);

        Object.entries(setters).forEach(([key, value]) => {
            effect[key] = value;
        });
        onEffectApplied(effect, effectName);
        if(effectName === EFFECT_NAMES.turbulence) {
            initTurbulenceEffect(effect);
            continue;
        }
        willBeAppliedEffects[effectName] = effect;
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
