import { Pane } from 'tweakpane';

export {};

declare global {
    type State = {
        video: string;
        video2: string;
        effects: {
            duotone: {
                active: boolean;
                dark: string;
                light: string;
            };
            brightnessContrast: {
                active: boolean;
                brightness: number;
                contrast: number;
            };
            hueSaturation: {
                active: boolean;
                hue: number;
                saturation: number;
            };
            blend: {
                active: boolean;
                mode: string;
                color: string;
                image: string;
            };
            alphaMask: {
                active: boolean;
                isLuminance: boolean;
                mask: string;
            };
            displacement: {
                active: boolean;
                wrap: string;
                scaleX: number;
                scaleY: number;
                map: string;
            };
            turbulence: {
                active: boolean;
                noise: string;
                output: string;
                frequencyX: number;
                frequencyY: number;
                octaves: number;
                isFractal: boolean;
                time: number;
            };
            kaleidoscope: {
                active: boolean;
                segments: number;
                offset: number;
            };
            fadeTransition: {
                active: boolean;
                progress: number;
            };
            displacementTransition: {
                active: boolean;
                progress: number;
            };
            dissolveTransition: {
                active: boolean;
                progress: number;
            };
        };
    };
    interface Window {
        state: State;
        pane: Pane;
        kamposCanvas: any; // TODO kamposInstance
    }
}
