// @ts-expect-error
import { Kampos, effects } from 'kampos';
import { CONFIG_KEYS, VIDEO_SOURCES } from './constants';
import { getGuiConfig } from './gui-parts';
import * as dat from 'dat.gui'

const GUI_CONFIG = getGuiConfig();

declare namespace KAMPOS_TODO {
    type Effect = any;
}
let allEffects: Record<string, KAMPOS_TODO.Effect[]> = {};
let video: HTMLVideoElement | null = null;
let gui: dat.GUI;
let kamposInstance: Kampos | null = null;
let activeEffects: string[] = [];


function initGUI() {
    gui = new dat.GUI();
    gui.remember(GUI_CONFIG);

    // Add video source selector
    gui.add(GUI_CONFIG, CONFIG_KEYS.VIDEO, VIDEO_SOURCES).onChange((value: typeof VIDEO_SOURCES[number]) => {
        changeVideoSource(value);
    });

    // Set up dat.GUI for each effect
    const duotoneFolder = gui.addFolder('Duotone Effect');
    duotoneFolder.add(GUI_CONFIG.effects.duotone, 'active').onChange(updateEffects);
    duotoneFolder.addColor(GUI_CONFIG.effects.duotone, 'dark').onChange(updateEffects);
    // duotoneFolder.addColor(CONFIG.effects.duotone, 'light').onChange(updateColors);
    duotoneFolder.open();

    const brightnessContrastFolder = gui.addFolder('Brightness/Contrast Effect');
    brightnessContrastFolder.add(GUI_CONFIG.effects.brightnessContrast, 'active').onChange(updateEffects);
    brightnessContrastFolder
        .add(GUI_CONFIG.effects.brightnessContrast, 'brightness', 0, 2)
        .onChange(updateEffects);
    brightnessContrastFolder
        .add(GUI_CONFIG.effects.brightnessContrast, 'contrast', 0, 2)
        .onChange(updateEffects);
    brightnessContrastFolder.open();

    const hueSaturationFolder = gui.addFolder('Hue/Saturation Effect');
    hueSaturationFolder.add(GUI_CONFIG.effects.hueSaturation, 'active').onChange(updateEffects);
    hueSaturationFolder.add(GUI_CONFIG.effects.hueSaturation, 'hue', -180, 180).onChange(updateEffects);
    hueSaturationFolder.add(GUI_CONFIG.effects.hueSaturation, 'saturation', 0, 2).onChange(updateEffects);
    hueSaturationFolder.open();

    const blendFolder = gui.addFolder('Blend Effect');
    blendFolder.add(GUI_CONFIG.effects.blend, 'active').onChange(updateEffects);
    blendFolder.add(GUI_CONFIG.effects.blend, 'mode', ['normal', 'multiply', 'screen', 'overlay']).onChange(updateEffects);
    blendFolder.addColor(GUI_CONFIG.effects.blend, 'color').onChange(updateEffects);
    blendFolder.open();

    const alphaMaskFolder = gui.addFolder('Alpha Mask Effect');
    alphaMaskFolder.add(GUI_CONFIG.effects.alphaMask, 'active').onChange(updateEffects);
    alphaMaskFolder.add(GUI_CONFIG.effects.alphaMask, 'isLuminance').onChange(updateEffects);
    alphaMaskFolder.open();

    const displacementFolder = gui.addFolder('Displacement Effect');
    displacementFolder.add(GUI_CONFIG.effects.displacement, 'active').onChange(updateEffects);
    displacementFolder.add(GUI_CONFIG.effects.displacement, 'wrap', ['stretch', 'repeat', 'mirror']).onChange(updateEffects);
    displacementFolder.add(GUI_CONFIG.effects.displacement, 'scaleX', 0, 1).onChange(updateEffects);
    displacementFolder.add(GUI_CONFIG.effects.displacement, 'scaleY', 0, 1).onChange(updateEffects);
    displacementFolder.open();

    const turbulenceFolder = gui.addFolder('Turbulence Effect');
    turbulenceFolder.add(GUI_CONFIG.effects.turbulence, 'active').onChange(updateEffects);
    turbulenceFolder.add(GUI_CONFIG.effects.turbulence, 'noise', ['simplex', 'perlin', 'worley']).onChange(updateEffects);
    turbulenceFolder.add(GUI_CONFIG.effects.turbulence, 'output', ['COLOR', 'DISPLACEMENT']).onChange(updateEffects);
    turbulenceFolder.add(GUI_CONFIG.effects.turbulence, 'frequencyX', 0, 5).onChange(updateEffects);
    turbulenceFolder.add(GUI_CONFIG.effects.turbulence, 'frequencyY', 0, 5).onChange(updateEffects);
    turbulenceFolder.add(GUI_CONFIG.effects.turbulence, 'octaves', 1, 8).onChange(updateEffects);
    turbulenceFolder.add(GUI_CONFIG.effects.turbulence, 'isFractal').onChange(updateEffects);
    turbulenceFolder.add(GUI_CONFIG.effects.turbulence, 'time', 0, 10).onChange(updateEffects);
    turbulenceFolder.open();

    const kaleidoscopeFolder = gui.addFolder('Kaleidoscope Effect');
    kaleidoscopeFolder.add(GUI_CONFIG.effects.kaleidoscope, 'active').onChange(updateEffects);
    kaleidoscopeFolder.add(GUI_CONFIG.effects.kaleidoscope, 'segments', 2, 12).onChange(updateEffects);
    kaleidoscopeFolder.add(GUI_CONFIG.effects.kaleidoscope, 'offset', 0, 360).onChange(updateEffects);
    kaleidoscopeFolder.open();

    const fadeTransitionFolder = gui.addFolder('Fade Transition Effect');
    fadeTransitionFolder.add(GUI_CONFIG.effects.fadeTransition, 'active').onChange(updateEffects);
    fadeTransitionFolder.add(GUI_CONFIG.effects.fadeTransition, 'progress', 0, 1).onChange(updateEffects);
    fadeTransitionFolder.open();

    const displacementTransitionFolder = gui.addFolder('Displacement Transition Effect');
    displacementTransitionFolder.add(GUI_CONFIG.effects.displacementTransition, 'active').onChange(updateEffects);
    displacementTransitionFolder.add(GUI_CONFIG.effects.displacementTransition, 'progress', 0, 1).onChange(updateEffects);
    displacementTransitionFolder.open();

    const dissolveTransitionFolder = gui.addFolder('Dissolve Transition Effect');
    dissolveTransitionFolder.add(GUI_CONFIG.effects.dissolveTransition, 'active').onChange(updateEffects);
    dissolveTransitionFolder.add(GUI_CONFIG.effects.dissolveTransition, 'progress', 0, 1).onChange(updateEffects);
    dissolveTransitionFolder.open();

    // Setup for each effect as shown above
    // ...
}

function updateActiveEffects() {
    console.log('Updating active effects...');
    //@ts-expect-error
    activeEffects = Object.keys(effects).filter((effectName) => (GUI_CONFIG.effects[effectName]).active);
}
function updateEffects() {
    console.log('Updating effects...');
    initKampos();
}

async function initKampos() {
    const target = document.querySelector('#target');
    updateActiveEffects();
    allEffects = {};
    activeEffects.forEach((effectName) => {
        //@ts-expect-error
        allEffects[effectName] = effects[effectName](GUI_CONFIG.effects[effectName] as Kampos.Effect);
    });

    kamposInstance = new Kampos({
        target,
        effects: Object.values(allEffects),
    });

    // Set the video source and start playing
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
        console.error('Error initializing demo:', error);
        console.error('There was an error initializing the demo. Please check the console for more information.');
    }
}

const getVideoElement = () => document.querySelector('#video') as HTMLVideoElement;

function changeVideoSource(videoFileName: string) {
    const videoElement = getVideoElement();
    videoElement.src = `./demo/${videoFileName}`;
    videoElement.load();
    videoElement.play();

    // Reinitialize Kampos with the new video source
    videoElement.addEventListener('loadeddata', async () => {
        await initKampos();
        kamposInstance.play();
    }, { once: true });
}


document.addEventListener('DOMContentLoaded', () => {
    initGUI();
    initDemo();
});

function prepareVideo() {
    return new Promise<HTMLVideoElement>((resolve, reject) => {
        const video = getVideoElement();
        if (video.readyState >= 2) {
            resolve(video);
        } else {
            video.addEventListener('loadeddata', () => resolve(video), { once: true });
            video.addEventListener('error', (e) => reject(new Error(`Video loading error: ${e.message}`)), {
                once: true,
            });
        }
    });
}
