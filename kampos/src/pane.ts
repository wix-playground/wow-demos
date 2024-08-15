
import { getVideoElement, VIDEO_SOURCES } from "./constants";
import { BindingApiEvents, Pane } from "tweakpane";



export const GUI_CONFIG = {
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

let pane: Pane;

// Mapping video sources for Tweakpane options
const VIDEO_SOURCE_OPTIONS = VIDEO_SOURCES.reduce((obj, source) => {
    obj[source] = source;
    return obj;
}, {} as Record<string, string>);


export function initPane(updateEffects: (ev?: BindingApiEvents<any>['change']) => void) {
    pane = new Pane();

    // Add video source selector
    pane.addBinding(GUI_CONFIG, "video", {
        options: VIDEO_SOURCE_OPTIONS,
    }).on("change", ({ value }) => {
        const videoFileName = value as (typeof VIDEO_SOURCES)[number];

    const video = getVideoElement();
    video.src = `./demo/${videoFileName}`;
    video.load();
    video.play();
    video.addEventListener(
        "loadeddata",
         () => {
            updateEffects();
        },
        { once: true }
    );
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
    const blendFolder = pane.addFolder({ title: "Blend Effect (missing image prop" });
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
    const alphaMaskFolder = pane.addFolder({ title: "Alpha Mask Effect (missing mask prop)" });
    alphaMaskFolder.addBinding(GUI_CONFIG.effects.alphaMask, "active").on("change", updateEffects);
    alphaMaskFolder.addBinding(GUI_CONFIG.effects.alphaMask, "isLuminance").on("change", updateEffects);

    // Displacement Effect
    const displacementFolder = pane.addFolder({ title: "Displacement Effect (missing map prop)" });
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
}
