import { getVideoElement, DEFAULT_VIDEO_SOURCE_OPTION, VIDEO_SOURCE_OPTIONS, DEFAULT_MASK_VIDEO_SOURCE_OPTION } from "./constants";
import { Pane } from "tweakpane";
import * as CamerakitPlugin from "@tweakpane/plugin-camerakit";
import { setState } from "./state";
import debounce from "debounce";

const pane = new Pane();

pane.registerPlugin(CamerakitPlugin);

const DEFAULT_STATE = {
    video: DEFAULT_VIDEO_SOURCE_OPTION,
    video2: "none",
    effects: {
        duotone: {
            active: true,
            dark: "#ffffff",
            light: 'WIP',
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
            image: '' ,
        },
        alphaMask: {
            active: false,
            isLuminance: false,
            mask: DEFAULT_MASK_VIDEO_SOURCE_OPTION,
        },
        displacement: {
            active: false,
            wrap: "stretch",
            scaleX: 0.0,
            scaleY: 0.0,
            map: DEFAULT_MASK_VIDEO_SOURCE_OPTION,
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

export const state = structuredClone(DEFAULT_STATE);

export function initPane() {
    const setStateDebounced = debounce(() => {
        setState(pane.exportState());
    }, 300);

    const updateQuery = () => {
        setStateDebounced();
    };

    const setVideoSource = (video: HTMLVideoElement, videoFileName: string) => {
        video.src = `./assets/${videoFileName}`;
        video.load();
        video.play();
    };

    pane.addButton({ title: "Reset" }).on("click", () => {
        setState(null);
        window.location.reload();
    });

    // Add video source selector for the first video
    pane.addBinding(state, "video", {
        options: VIDEO_SOURCE_OPTIONS,
    }).on("change", ({ value }) => {
        setVideoSource(getVideoElement(), value);
    });

    // Duotone Effect
    const duotoneFolder = pane.addFolder({ title: "Duotone Effect" });
    duotoneFolder.addBinding(state.effects.duotone, "active").on("change", updateQuery);
    duotoneFolder.addBinding(state.effects.duotone, "dark", { view: "color" }).on("change", updateQuery);
    duotoneFolder.addBinding(state.effects.duotone, "light", { view: "text", disabled: true });

    // Brightness/Contrast Effect
    const brightnessContrastFolder = pane.addFolder({ title: "Brightness/Contrast Effect" });
    brightnessContrastFolder.addBinding(state.effects.brightnessContrast, "active").on("change", updateQuery);
    brightnessContrastFolder
        .addBinding(state.effects.brightnessContrast, "brightness", {
            view: "cameraring",
            series: 0,
            unit: {
                pixels: 50,
                ticks: 10,
                value: 0.1,
            },
            min: 0,
            max: 2,
        })
        .on("change", updateQuery);
    brightnessContrastFolder
        .addBinding(state.effects.brightnessContrast, "contrast", { min: 0, max: 2 })
        .on("change", updateQuery);

    // Hue/Saturation Effect
    const hueSaturationFolder = pane.addFolder({ title: "Hue/Saturation Effect" });
    hueSaturationFolder.addBinding(state.effects.hueSaturation, "active").on("change", updateQuery);
    hueSaturationFolder
        .addBinding(state.effects.hueSaturation, "hue", { min: -180, max: 180 })
        .on("change", updateQuery);
    hueSaturationFolder
        .addBinding(state.effects.hueSaturation, "saturation", { min: 0, max: 2 })
        .on("change", updateQuery);

    // Blend Effect
    const blendFolder = pane.addFolder({ title: "Blend Effect" });
    blendFolder.addBinding(state.effects.blend, "active").on("change", updateQuery);
    blendFolder
        .addBinding(state.effects.blend, "mode", {
            options: {
                normal: "normal",
                multiply: "multiply",
                screen: "screen",
                overlay: "overlay",
            },
        })
        .on("change", updateQuery);
    blendFolder
        .addBinding(state.effects.blend, "color", { view: "color", color: { alpha: true } })
        .on("change", updateQuery);
    blendFolder
        .addBinding(state.effects.blend, "image", { options: VIDEO_SOURCE_OPTIONS, disabled: true })
        .on("change", updateQuery);

    // Alpha Mask Effect
    const alphaMaskFolder = pane.addFolder({ title: "Alpha Mask Effect (WIP)", expanded: false });
    alphaMaskFolder.addBinding(state.effects.alphaMask, "active",{
        disabled: true,
    }).on("change", updateQuery);
    alphaMaskFolder.addBinding(state.effects.alphaMask, "isLuminance",{
        disabled: true,
    }).on("change", updateQuery);
    alphaMaskFolder
        .addBinding(state.effects.alphaMask, "mask", { options: VIDEO_SOURCE_OPTIONS, disabled: true })
        .on("change", ({value}) => {
            console.log('mask', value);
            // setVideoSource(getSecondVideoElement(), value);
        });

    // Displacement Effect
    const displacementFolder = pane.addFolder({ title: "Displacement Effect (WIP)", expanded: false });
    displacementFolder
        .addBinding(state.effects.displacement, "active", {
            disabled: true,
        })
        .on("change", updateQuery);
    displacementFolder
        .addBinding(state.effects.displacement, "wrap", {
            disabled: true,
            options: {
                stretch: "stretch",
                disabled: true,
                repeat: "repeat",
                mirror: "mirror",
            },
        })
        .on("change", updateQuery);
    displacementFolder
        .addBinding(state.effects.displacement, "scaleX", {
            disabled: true,
            min: 0,
            max: 1,
        })
        .on("change", updateQuery);
    displacementFolder
        .addBinding(state.effects.displacement, "scaleY", {
            disabled: true,
            min: 0,
            max: 1,
        })
        .on("change", updateQuery);
    displacementFolder
        .addBinding(state.effects.displacement, "map", { options: VIDEO_SOURCE_OPTIONS, disabled: true })
        .on("change", updateQuery);

    // Turbulence Effect
    const turbulenceFolder = pane.addFolder({ title: "Turbulence Effect (WIP)", expanded: false });
    turbulenceFolder
        .addBinding(state.effects.turbulence, "active", {
            disabled: true,
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(state.effects.turbulence, "noise", {
            disabled: true,
            options: {
                simplex: "simplex",
                perlin: "perlin",
                worley: "worley",
            },
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(state.effects.turbulence, "output", {
            disabled: true,
            options: {
                COLOR: "COLOR",
                DISPLACEMENT: "DISPLACEMENT",
            },
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(state.effects.turbulence, "frequencyX", {
            disabled: true,
            min: 0,
            max: 5,
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(state.effects.turbulence, "frequencyY", {
            disabled: true,
            min: 0,
            max: 5,
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(state.effects.turbulence, "octaves", {
            disabled: true,
            min: 1,
            max: 8,
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(state.effects.turbulence, "isFractal", {
            disabled: true,
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(state.effects.turbulence, "time", {
            disabled: true,
            min: 0,
            max: 10,
        })
        .on("change", updateQuery);
    // Kaleidoscope Effect
    const kaleidoscopeFolder = pane.addFolder({ title: "Kaleidoscope Effect" });
    kaleidoscopeFolder.addBinding(state.effects.kaleidoscope, "active").on("change", updateQuery);
    kaleidoscopeFolder
        .addBinding(state.effects.kaleidoscope, "segments", { min: 2, max: 12 })
        .on("change", updateQuery);
    kaleidoscopeFolder
        .addBinding(state.effects.kaleidoscope, "offset", {
            view: "camerawheel",
            series: 0,
            min: 0,
            step: 1,
            max: 360,
        })
        .on("change", updateQuery);

    return pane;
}
