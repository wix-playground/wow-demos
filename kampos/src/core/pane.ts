import { getVideoElement, VIDEO_SOURCE_OPTIONS, DEFAULT_STATE, IMAGE_OPTIONS } from "../constants";
import { Pane } from "tweakpane";
import * as CamerakitPlugin from "@tweakpane/plugin-camerakit";
import { setState } from "../utils/state";
import debounce from "debounce";

const pane = new Pane();
window.pane = pane;
pane.registerPlugin(CamerakitPlugin);

window.state = structuredClone(DEFAULT_STATE);
const isDevQuery = window.location.search.includes('dev');
const disabledButNotForDev = !isDevQuery;
console.log('isDevQuery', disabledButNotForDev);

export function initPane() {
    const setVideoSource = (video, videoFileName) => {
        video.src = `${videoFileName}`;
        video.load();
        video.play();
    };

    pane.addButton({ title: "Reset" }).on("click", () => {
        setState(null);
        window.location.reload();
    });

    // Hue/Saturation Effect
    const hueSaturationFolder = pane.addFolder({ title: "Hue/Saturation Effect" });
    hueSaturationFolder.addBinding(window.state.effects.hueSaturation, "active");
    hueSaturationFolder.addBinding(window.state.effects.hueSaturation, "hue", { min: -180, max: 180 });
    hueSaturationFolder.addBinding(window.state.effects.hueSaturation, "saturation", { min: 0, max: 2 });

    // Brightness/Contrast Effect
    const brightnessContrastFolder = pane.addFolder({ title: "Brightness/Contrast Effect" });
    brightnessContrastFolder.addBinding(window.state.effects.brightnessContrast, "active");
    brightnessContrastFolder.addBinding(window.state.effects.brightnessContrast, "brightness", {
        view: "cameraring",
        series: 0,
        unit: {
            pixels: 50,
            ticks: 10,
            value: 0.1,
        },
        min: 0,
        max: 2,
    });
    brightnessContrastFolder.addBinding(window.state.effects.brightnessContrast, "contrast", { min: 0, max: 2 });

    // Duotone Effect
    const duotoneFolder = pane.addFolder({ title: "Duotone Effect" });
    duotoneFolder.addBinding(window.state.effects.duotone, "active");
    duotoneFolder.addBinding(window.state.effects.duotone, "dark", { view: "color" });
    duotoneFolder.addBinding(window.state.effects.duotone, "light", { view: "text", disabled: disabledButNotForDev });

    // Blend Effect
    const blendFolder = pane.addFolder({ title: "Blend Effect" });
    blendFolder.addBinding(window.state.effects.blend, "active");
    blendFolder.addBinding(window.state.effects.blend, "mode", {
        options: {
            normal: "normal",
            multiply: "multiply",
            screen: "screen",
            overlay: "overlay",
        },
    });
    blendFolder.addBinding(window.state.effects.blend, "color", { view: "color", color: { alpha: true } });
    blendFolder.addBinding(window.state.effects.blend, "image", { options: IMAGE_OPTIONS });

    // Alpha Mask Effect
    const alphaMaskFolder = pane.addFolder({ title: "Alpha Mask Effect (WIP)", expanded: false });
    alphaMaskFolder.addBinding(window.state.effects.alphaMask, "active", {
        disabled: disabledButNotForDev,
    });
    alphaMaskFolder.addBinding(window.state.effects.alphaMask, "isLuminance", {
        disabled: disabledButNotForDev,
    });
    alphaMaskFolder
        .addBinding(window.state.effects.alphaMask, "mask", { options: IMAGE_OPTIONS, disabled: disabledButNotForDev });

    // Displacement Effect
    const displacementFolder = pane.addFolder({ title: "Displacement Effect (WIP)", expanded: false });
    displacementFolder.addBinding(window.state.effects.displacement, "active", {
        disabled: disabledButNotForDev,
    });
    displacementFolder.addBinding(window.state.effects.displacement, "wrap", {
        disabled: disabledButNotForDev,
        options: {
            stretch: "stretch",
            disabled: disabledButNotForDev,
            repeat: "repeat",
            mirror: "mirror",
        },
    });
    displacementFolder.addBinding(window.state.effects.displacement, "scaleX", {
        disabled: disabledButNotForDev,
        min: 0,
        max: 1,
    });
    displacementFolder.addBinding(window.state.effects.displacement, "scaleY", {
        disabled: disabledButNotForDev,
        min: 0,
        max: 1,
    });
    displacementFolder.addBinding(window.state.effects.displacement, "map", {
        options: VIDEO_SOURCE_OPTIONS,
        disabled: disabledButNotForDev,
    });

    // Turbulence Effect
    const turbulenceFolder = pane.addFolder({ title: "Turbulence Effect (WIP)", expanded: false });
    turbulenceFolder.addBinding(window.state.effects.turbulence, "active", {
        disabled: disabledButNotForDev,
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, "noise", {
        disabled: disabledButNotForDev,
        options: {
            simplex: "simplex",
            perlin: "perlin",
            worley: "worley",
        },
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, "output", {
        disabled: disabledButNotForDev,
        options: {
            COLOR: "COLOR",
            DISPLACEMENT: "DISPLACEMENT",
        },
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, "frequencyX", {
        disabled: disabledButNotForDev,
        min: 0,
        max: 5,
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, "frequencyY", {
        disabled: disabledButNotForDev,
        min: 0,
        max: 5,
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, "octaves", {
        disabled: disabledButNotForDev,
        min: 1,
        max: 8,
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, "isFractal", {
        disabled: disabledButNotForDev,
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, "time", {
        disabled: disabledButNotForDev,
        min: 0,
        max: 10,
    });

    // Kaleidoscope Effect
    const kaleidoscopeFolder = pane.addFolder({ title: "Kaleidoscope Effect" });
    kaleidoscopeFolder.addBinding(window.state.effects.kaleidoscope, "active");
    kaleidoscopeFolder.addBinding(window.state.effects.kaleidoscope, "segments", { min: 2, max: 12 });
    kaleidoscopeFolder.addBinding(window.state.effects.kaleidoscope, "offset", {
        view: "camerawheel",
        series: 0,
        min: 0,
        step: 1,
        max: 360,
    });

    // not really connected to kaleidoscopeFolder, just a hacky way to hide it
    kaleidoscopeFolder
        .addBinding(window.state, "video", {
            options: VIDEO_SOURCE_OPTIONS,
            hidden: true,
        })
        .on("change", ({ value }) => {
            setVideoSource(getVideoElement(), value);
        });

    pane.addButton({ title: "Export JSON" }).on("click", () => {
        const dataStr = JSON.stringify(pane.exportState(), null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "kampos-preset.json";
        a.click();
        URL.revokeObjectURL(url);
    });

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.style.display = "none";
    input.addEventListener("change", (event) => {
        const file = (event.target as HTMLInputElement).files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result as string);
                    console.log("Imported JSON:", json);

                    if (!json.children) {
                        throw new Error("Invalid JSON structure: Missing 'children' key.");
                    }

                    pane.importState(json);
                    setState(json);
                } catch (error) {
                    console.error("Error during import:", error);
                    alert(`An error occurred: ${error.message}`);
                }
            };
            reader.readAsText(file);
        }
    });

    pane.addButton({ title: "Import JSON" }).on("click", () => {
        input.click();
    });

    document.body.appendChild(input);

    const setStateDebounced = debounce(() => {
        setState(pane.exportState());
    }, 50);

    pane.on("change", () => {
        setStateDebounced();
    });

    return pane;
}
