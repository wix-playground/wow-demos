import {
    getVideoElement,
    VIDEO_SOURCE_OPTIONS,
    DEFAULT_STATE,
    IMAGE_OPTIONS,
    VIDEO_AND_IMAGE_OPTIONS,
} from '../constants';
import { Pane } from 'tweakpane';
import * as CamerakitPlugin from '@tweakpane/plugin-camerakit';
import { setState } from '../utils/state';
import debounce from 'debounce';
import { setVideoSource } from '../utils/media-utils';

const pane = new Pane();
window.pane = pane;
pane.registerPlugin(CamerakitPlugin);

window.state = structuredClone(DEFAULT_STATE);

export function initPane() {
    pane.addButton({ title: 'Reset' }).on('click', () => {
        setState(null);
        window.location.reload();
    });

    // Hue/Saturation Effect
    const hueSaturationFolder = pane.addFolder({ title: 'Hue/Saturation Effect' });
    hueSaturationFolder.addBinding(window.state.effects.hueSaturation, 'active');
    hueSaturationFolder.addBinding(window.state.effects.hueSaturation, 'hue', { min: -180, max: 180 });
    hueSaturationFolder.addBinding(window.state.effects.hueSaturation, 'saturation', { min: 0, max: 2 });

    // Brightness/Contrast Effect
    const brightnessContrastFolder = pane.addFolder({ title: 'Brightness/Contrast Effect' });
    brightnessContrastFolder.addBinding(window.state.effects.brightnessContrast, 'active');
    brightnessContrastFolder.addBinding(window.state.effects.brightnessContrast, 'brightness', {
        view: 'cameraring',
        series: 0,
        unit: {
            pixels: 50,
            ticks: 10,
            value: 0.1,
        },
        min: 0,
        max: 2,
    });
    brightnessContrastFolder.addBinding(window.state.effects.brightnessContrast, 'contrast', { min: 0, max: 2 });

    // Duotone Effect
    const duotoneFolder = pane.addFolder({ title: 'Duotone Effect' });
    duotoneFolder.addBinding(window.state.effects.duotone, 'active');
    duotoneFolder.addBinding(window.state.effects.duotone, 'dark', { view: 'color' });
    duotoneFolder.addBinding(window.state.effects.duotone, 'light', { view: 'color' });

    // Blend Effect
    const blendFolder = pane.addFolder({ title: 'Blend Effect' });
    blendFolder.addBinding(window.state.effects.blend, 'active');
    blendFolder.addBinding(window.state.effects.blend, 'mode', {
        options: {
            normal: 'normal',
            multiply: 'multiply',
            screen: 'screen',
            overlay: 'overlay',
            darken: 'darken',
            lighten: 'lighten',
            'color-dodge': 'color-dodge',
            'color-burn': 'color-burn',
            'hard-light': 'hard-light',
            'soft-light': 'soft-light',
            difference: 'difference',
            exclusion: 'exclusion',
            hue: 'hue',
            saturation: 'saturation',
            color: 'color',
            luminosity: 'luminosity',
        },
    });
    blendFolder.addBinding(window.state.effects.blend, 'color', { view: 'color', color: { alpha: true } });
    blendFolder.addBinding(window.state.effects.blend, 'image', { options: IMAGE_OPTIONS });

    // Alpha Mask Effect
    const alphaMaskFolder = pane.addFolder({ title: 'Alpha Mask Effect', expanded: false });
    alphaMaskFolder.addBinding(window.state.effects.alphaMask, 'active');
    alphaMaskFolder.addBinding(window.state.effects.alphaMask, 'isLuminance');
    alphaMaskFolder.addBinding(window.state.effects.alphaMask, 'mask', {
        options: VIDEO_AND_IMAGE_OPTIONS,
    });

    // Displacement Effect
    const displacementFolder = pane.addFolder({ title: 'Displacement Effect', expanded: false });
    displacementFolder.addBinding(window.state.effects.displacement, 'active');
    displacementFolder.addBinding(window.state.effects.displacement, 'wrap', {
        options: {
            clamp: 'CLAMP',
            discard: 'DISCARD',
            wrap: 'WRAP',
        },
    });
    displacementFolder.addBinding(window.state.effects.displacement, 'scaleX', {
        min: 0,
        max: 1,
    });
    displacementFolder.addBinding(window.state.effects.displacement, 'scaleY', {
        min: 0,
        max: 1,
    });
    displacementFolder.addBinding(window.state.effects.displacement, 'map', {
        options: VIDEO_SOURCE_OPTIONS,
    });

    // Turbulence Effect
    const turbulenceFolder = pane.addFolder({ title: 'Turbulence Effect', expanded: false });
    turbulenceFolder.addBinding(window.state.effects.turbulence, 'active', {});
    turbulenceFolder.addBinding(window.state.effects.turbulence, 'noise', {
        options: {
            perlinNoise: 'perlinNoise',
            simplex: 'simplex',
            cellular: 'cellular',
        },
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, 'output', {
        options: {
            COLOR: 'COLOR',
            ALPHA: 'ALPHA',
        },
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, 'frequencyX', {
        min: 0,
        max: 5,
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, 'frequencyY', {
        min: 0,
        max: 5,
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, 'octaves', {
        min: 1,
        max: 8,
    });
    turbulenceFolder.addBinding(window.state.effects.turbulence, 'isFractal', {});
    turbulenceFolder.addBinding(window.state.effects.turbulence, 'time', {
        min: 0,
        max: 10,
    });

    // Kaleidoscope Effect
    const kaleidoscopeFolder = pane.addFolder({ title: 'Kaleidoscope Effect' });
    kaleidoscopeFolder.addBinding(window.state.effects.kaleidoscope, 'active');
    kaleidoscopeFolder.addBinding(window.state.effects.kaleidoscope, 'segments', { min: 2, max: 12 });
    kaleidoscopeFolder.addBinding(window.state.effects.kaleidoscope, 'offset', {
        view: 'camerawheel',
        series: 0,
        min: 0,
        step: 1,
        max: 360,
    });

    // not really connected to kaleidoscopeFolder, just a hacky way to hide it
    kaleidoscopeFolder
        .addBinding(window.state, 'video', {
            options: VIDEO_SOURCE_OPTIONS,
            hidden: true,
        })
        .on('change', ({ value }) => {
            setVideoSource(getVideoElement(), value);
        });

    pane.addButton({ title: 'Export JSON' }).on('click', () => {
        const dataStr = JSON.stringify(pane.exportState(), null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kampos-preset.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.style.display = 'none';
    input.addEventListener('change', (event) => {
        const file = (event.target as HTMLInputElement).files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result as string);
                    console.log('Imported JSON:', json);

                    if (!json.children) {
                        throw new Error("Invalid JSON structure: Missing 'children' key.");
                    }

                    pane.importState(json);
                    setState(json);
                } catch (error) {
                    console.error('Error during import:', error);
                    alert(`An error occurred: ${error.message}`);
                }
            };
            reader.readAsText(file);
        }
    });

    pane.addButton({ title: 'Import JSON' }).on('click', () => {
        input.click();
    });

    document.body.appendChild(input);

    const setStateDebounced = debounce(() => {
        setState(pane.exportState());
    }, 50);

    pane.on('change', () => {
        setStateDebounced();
    });

    return pane;
}
