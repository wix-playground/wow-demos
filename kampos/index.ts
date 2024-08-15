import { Kampos, effects } from "kampos";
import { CONFIG_KEYS, VIDEO_SOURCES } from "./constants";
import { Pane } from "tweakpane";

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

const GUI_CONFIG = {
    video: VIDEO_SOURCES[0],
    effects: {
        duotone: {
            active: true,
            dark: "#ffffff",
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
            color: "#000000ff",
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

// Mapping video sources for Tweakpane options
const VIDEO_SOURCE_OPTIONS = VIDEO_SOURCES.reduce((obj, source) => {
    obj[source] = source;
    return obj;
}, {} as Record<string, string>);

let allEffects: Record<string, any[]> = {};
let video: HTMLVideoElement | null = null;
let pane: Pane;
let kamposInstance: Kampos | null = null;
let activeEffects: string[] = [];

function initPane() {
    pane = new Pane();

    // Add video source selector
    pane.addBinding(GUI_CONFIG, "video", {
        options: VIDEO_SOURCE_OPTIONS,
    }).on("change", ({ value }) => {
        changeVideoSource(value as (typeof VIDEO_SOURCES)[number]);
    });

    // Duotone Effect
    const duotoneFolder = pane.addFolder({ title: "Duotone Effect" });
    duotoneFolder.addBinding(GUI_CONFIG.effects.duotone, "active").on("change", updateEffects);
    duotoneFolder.addBinding(GUI_CONFIG.effects.duotone, "dark", { view: "color" }).on("change", updateEffects);

    // Brightness/Contrast Effect
    const brightnessContrastFolder = pane.addFolder({ title: "Brightness/Contrast Effect" });
    brightnessContrastFolder.addBinding(GUI_CONFIG.effects.brightnessContrast, "active").on("change", updateEffects);
    brightnessContrastFolder
        .addBinding(GUI_CONFIG.effects.brightnessContrast, "brightness", { min: 0, max: 2 })
        .on("change", updateEffects);
    brightnessContrastFolder
        .addBinding(GUI_CONFIG.effects.brightnessContrast, "contrast", { min: 0, max: 2 })
        .on("change", updateEffects);

    // Hue/Saturation Effect
    const hueSaturationFolder = pane.addFolder({ title: "Hue/Saturation Effect" });
    hueSaturationFolder.addBinding(GUI_CONFIG.effects.hueSaturation, "active").on("change", updateEffects);
    hueSaturationFolder
        .addBinding(GUI_CONFIG.effects.hueSaturation, "hue", { min: -180, max: 180 })
        .on("change", updateEffects);
    hueSaturationFolder
        .addBinding(GUI_CONFIG.effects.hueSaturation, "saturation", { min: 0, max: 2 })
        .on("change", updateEffects);

    // Blend Effect
    const blendFolder = pane.addFolder({ title: "Blend Effect" });
    blendFolder.addBinding(GUI_CONFIG.effects.blend, "active").on("change", updateEffects);
    blendFolder
        .addBinding(GUI_CONFIG.effects.blend, "mode", {
            options: {
                normal: "normal",
                multiply: "multiply",
                screen: "screen",
                overlay: "overlay",
            },
        })
        .on("change", updateEffects);
    blendFolder
        .addBinding(GUI_CONFIG.effects.blend, "color", { view: "color", color: { alpha: true } })
        .on("change", updateEffects);

    // Alpha Mask Effect
    const alphaMaskFolder = pane.addFolder({ title: "Alpha Mask Effect" });
    alphaMaskFolder.addBinding(GUI_CONFIG.effects.alphaMask, "active").on("change", updateEffects);
    alphaMaskFolder.addBinding(GUI_CONFIG.effects.alphaMask, "isLuminance").on("change", updateEffects);

    // Displacement Effect
    const displacementFolder = pane.addFolder({ title: "Displacement Effect" });
    displacementFolder.addBinding(GUI_CONFIG.effects.displacement, "active").on("change", updateEffects);
    displacementFolder
        .addBinding(GUI_CONFIG.effects.displacement, "wrap", {
            options: {
                stretch: "stretch",
                repeat: "repeat",
                mirror: "mirror",
            },
        })
        .on("change", updateEffects);
    displacementFolder
        .addBinding(GUI_CONFIG.effects.displacement, "scaleX", { min: 0, max: 1 })
        .on("change", updateEffects);
    displacementFolder
        .addBinding(GUI_CONFIG.effects.displacement, "scaleY", { min: 0, max: 1 })
        .on("change", updateEffects);

    // Turbulence Effect
    const turbulenceFolder = pane.addFolder({ title: "Turbulence Effect" });
    turbulenceFolder.addBinding(GUI_CONFIG.effects.turbulence, "active").on("change", updateEffects);
    turbulenceFolder
        .addBinding(GUI_CONFIG.effects.turbulence, "noise", {
            options: {
                simplex: "simplex",
                perlin: "perlin",
                worley: "worley",
            },
        })
        .on("change", updateEffects);
    turbulenceFolder
        .addBinding(GUI_CONFIG.effects.turbulence, "output", {
            options: {
                COLOR: "COLOR",
                DISPLACEMENT: "DISPLACEMENT",
            },
        })
        .on("change", updateEffects);
    turbulenceFolder
        .addBinding(GUI_CONFIG.effects.turbulence, "frequencyX", { min: 0, max: 5 })
        .on("change", updateEffects);
    turbulenceFolder
        .addBinding(GUI_CONFIG.effects.turbulence, "frequencyY", { min: 0, max: 5 })
        .on("change", updateEffects);
    turbulenceFolder
        .addBinding(GUI_CONFIG.effects.turbulence, "octaves", { min: 1, max: 8 })
        .on("change", updateEffects);
    turbulenceFolder.addBinding(GUI_CONFIG.effects.turbulence, "isFractal").on("change", updateEffects);
    turbulenceFolder.addBinding(GUI_CONFIG.effects.turbulence, "time", { min: 0, max: 10 }).on("change", updateEffects);

    // Kaleidoscope Effect
    const kaleidoscopeFolder = pane.addFolder({ title: "Kaleidoscope Effect" });
    kaleidoscopeFolder.addBinding(GUI_CONFIG.effects.kaleidoscope, "active").on("change", updateEffects);
    kaleidoscopeFolder
        .addBinding(GUI_CONFIG.effects.kaleidoscope, "segments", { min: 2, max: 12 })
        .on("change", updateEffects);
    kaleidoscopeFolder
        .addBinding(GUI_CONFIG.effects.kaleidoscope, "offset", { min: 0, max: 360 })
        .on("change", updateEffects);
    // Fade Transition Effect
    const fadeTransitionFolder = pane.addFolder({ title: "Fade Transition Effect" });
    fadeTransitionFolder.addBinding(GUI_CONFIG.effects.fadeTransition, "active").on("change", updateEffects);
    fadeTransitionFolder
        .addBinding(GUI_CONFIG.effects.fadeTransition, "progress", { min: 0, max: 1 })
        .on("change", updateEffects);

    // Displacement Transition Effect
    const displacementTransitionFolder = pane.addFolder({ title: "Displacement Transition Effect" });
    displacementTransitionFolder
        .addBinding(GUI_CONFIG.effects.displacementTransition, "active")
        .on("change", updateEffects);
    displacementTransitionFolder
        .addBinding(GUI_CONFIG.effects.displacementTransition, "progress", { min: 0, max: 1 })
        .on("change", updateEffects);

    // Dissolve Transition Effect
    const dissolveTransitionFolder = pane.addFolder({ title: "Dissolve Transition Effect" });
    dissolveTransitionFolder.addBinding(GUI_CONFIG.effects.dissolveTransition, "active").on("change", updateEffects);
    dissolveTransitionFolder
        .addBinding(GUI_CONFIG.effects.dissolveTransition, "progress", { min: 0, max: 1 })
        .on("change", updateEffects);
}

function updateActiveEffects() {
    activeEffects = Object.keys(effects).filter((effectName) => GUI_CONFIG.effects[effectName].active);
}

function updateEffects() {
    if (kamposInstance) {
        kamposInstance.stop();
    }
    initKampos();
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

const getVideoElement = () => document.querySelector("#video") as HTMLVideoElement;

function changeVideoSource(videoFileName: string) {
    const videoElement = getVideoElement();
    videoElement.src = `./demo/${videoFileName}`;
    videoElement.load();
    videoElement.play();
    videoElement.addEventListener(
        "loadeddata",
        async () => {
            await initKampos();
            kamposInstance.play();
        },
        { once: true }
    );
}
document.addEventListener("DOMContentLoaded", () => {
    initPane();
    initDemo();
});

function prepareVideo() {
    return new Promise((resolve, reject) => {
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
