import { getVideoElement, VIDEO_SOURCE_OPTIONS, DEFAULT_STATE } from "../constants";
import { Pane } from "tweakpane";
import * as CamerakitPlugin from "@tweakpane/plugin-camerakit";
import { setState } from "./state";
import debounce from "debounce";

const pane = new Pane();
window.pane = pane;
pane.registerPlugin(CamerakitPlugin);

window.state = structuredClone(DEFAULT_STATE);
export function initPane() {
    const setStateDebounced = debounce(() => {
        setState(pane.exportState());
    }, 50);

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

    pane.addBinding(window.state, "video", {
        options: VIDEO_SOURCE_OPTIONS,
    }).on("change", ({ value }) => {
        setVideoSource(getVideoElement(), value);
    });

    // Hue/Saturation Effect
    const hueSaturationFolder = pane.addFolder({ title: "Hue/Saturation Effect" });
    hueSaturationFolder.addBinding(window.state.effects.hueSaturation, "active").on("change", updateQuery);
    hueSaturationFolder
        .addBinding(window.state.effects.hueSaturation, "hue", { min: -180, max: 180 })
        .on("change", updateQuery);
    hueSaturationFolder
        .addBinding(window.state.effects.hueSaturation, "saturation", { min: 0, max: 2 })
        .on("change", updateQuery);

    // Brightness/Contrast Effect
    const brightnessContrastFolder = pane.addFolder({ title: "Brightness/Contrast Effect" });
    brightnessContrastFolder.addBinding(window.state.effects.brightnessContrast, "active").on("change", updateQuery);
    brightnessContrastFolder
        .addBinding(window.state.effects.brightnessContrast, "brightness", {
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
        .addBinding(window.state.effects.brightnessContrast, "contrast", { min: 0, max: 2 })
        .on("change", updateQuery);

    // Duotone Effect
    const duotoneFolder = pane.addFolder({ title: "Duotone Effect" });
    duotoneFolder.addBinding(window.state.effects.duotone, "active").on("change", updateQuery);
    duotoneFolder.addBinding(window.state.effects.duotone, "dark", { view: "color" }).on("change", updateQuery);
    duotoneFolder.addBinding(window.state.effects.duotone, "light", { view: "text", disabled: true });

    // Blend Effect
    const blendFolder = pane.addFolder({ title: "Blend Effect" });
    blendFolder.addBinding(window.state.effects.blend, "active").on("change", updateQuery);
    blendFolder
        .addBinding(window.state.effects.blend, "mode", {
            options: {
                normal: "normal",
                multiply: "multiply",
                screen: "screen",
                overlay: "overlay",
            },
        })
        .on("change", updateQuery);
    blendFolder
        .addBinding(window.state.effects.blend, "color", { view: "color", color: { alpha: true } })
        .on("change", updateQuery);
    blendFolder
        .addBinding(window.state.effects.blend, "image", { options: VIDEO_SOURCE_OPTIONS, disabled: true })
        .on("change", updateQuery);

    // Alpha Mask Effect
    const alphaMaskFolder = pane.addFolder({ title: "Alpha Mask Effect (WIP)", expanded: false });
    alphaMaskFolder
        .addBinding(window.state.effects.alphaMask, "active", {
            disabled: true,
        })
        .on("change", updateQuery);
    alphaMaskFolder
        .addBinding(window.state.effects.alphaMask, "isLuminance", {
            disabled: true,
        })
        .on("change", updateQuery);
    alphaMaskFolder
        .addBinding(window.state.effects.alphaMask, "mask", { options: VIDEO_SOURCE_OPTIONS, disabled: true })
        .on("change", ({ value }) => {
            console.log("mask", value);
            // setVideoSource(getSecondVideoElement(), value);
        });

    // Displacement Effect
    const displacementFolder = pane.addFolder({ title: "Displacement Effect (WIP)", expanded: false });
    displacementFolder
        .addBinding(window.state.effects.displacement, "active", {
            disabled: true,
        })
        .on("change", updateQuery);
    displacementFolder
        .addBinding(window.state.effects.displacement, "wrap", {
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
        .addBinding(window.state.effects.displacement, "scaleX", {
            disabled: true,
            min: 0,
            max: 1,
        })
        .on("change", updateQuery);
    displacementFolder
        .addBinding(window.state.effects.displacement, "scaleY", {
            disabled: true,
            min: 0,
            max: 1,
        })
        .on("change", updateQuery);
    displacementFolder
        .addBinding(window.state.effects.displacement, "map", { options: VIDEO_SOURCE_OPTIONS, disabled: true })
        .on("change", updateQuery);

    // Turbulence Effect
    const turbulenceFolder = pane.addFolder({ title: "Turbulence Effect (WIP)", expanded: false });
    turbulenceFolder
        .addBinding(window.state.effects.turbulence, "active", {
            disabled: true,
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(window.state.effects.turbulence, "noise", {
            disabled: true,
            options: {
                simplex: "simplex",
                perlin: "perlin",
                worley: "worley",
            },
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(window.state.effects.turbulence, "output", {
            disabled: true,
            options: {
                COLOR: "COLOR",
                DISPLACEMENT: "DISPLACEMENT",
            },
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(window.state.effects.turbulence, "frequencyX", {
            disabled: true,
            min: 0,
            max: 5,
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(window.state.effects.turbulence, "frequencyY", {
            disabled: true,
            min: 0,
            max: 5,
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(window.state.effects.turbulence, "octaves", {
            disabled: true,
            min: 1,
            max: 8,
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(window.state.effects.turbulence, "isFractal", {
            disabled: true,
        })
        .on("change", updateQuery);
    turbulenceFolder
        .addBinding(window.state.effects.turbulence, "time", {
            disabled: true,
            min: 0,
            max: 10,
        })
        .on("change", updateQuery);
    // Kaleidoscope Effect
    const kaleidoscopeFolder = pane.addFolder({ title: "Kaleidoscope Effect" });
    kaleidoscopeFolder.addBinding(window.state.effects.kaleidoscope, "active").on("change", updateQuery);
    kaleidoscopeFolder
        .addBinding(window.state.effects.kaleidoscope, "segments", { min: 2, max: 12 })
        .on("change", updateQuery);
    kaleidoscopeFolder
        .addBinding(window.state.effects.kaleidoscope, "offset", {
            view: "camerawheel",
            series: 0,
            min: 0,
            step: 1,
            max: 360,
        })
        .on("change", updateQuery);

    return pane;
}
