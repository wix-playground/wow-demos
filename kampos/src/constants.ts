const ASSETS_PREFIX = "./assets";

export const DEFAULT_VIDEO_SOURCE_OPTION = 'Cloudy Night';
export const VIDEO_SOURCE_OPTIONS = {
    'cloudy night': ASSETS_PREFIX+'/cloudy-night.mp4',
    'drop water': ASSETS_PREFIX+'/drop-water.mp4',
    'man on beach': ASSETS_PREFIX+'/man-on-beach.mp4',
    'starry night': ASSETS_PREFIX+'/starry-night.mp4',
    'shell beach': ASSETS_PREFIX+'/shell-beach.mp4',
    'wheat field': ASSETS_PREFIX+'/wheat-field.mp4',
}

const VIDEO_MASK_SOURCE_OPTIONS = {
    'none': 'none',
    ...VIDEO_SOURCE_OPTIONS,
}

export const DEFAULT_MASK_VIDEO_SOURCE_OPTION = VIDEO_MASK_SOURCE_OPTIONS.none;

export const getVideoElement = () => document.querySelector("#video") as HTMLVideoElement;

export const IMAGE_OPTIONS = [
    { text: "none", value: "none", src: "" },
    { text: "Cloud", value: ASSETS_PREFIX+"/disp-cloud.png", src: "./disp-cloud.png" },
    { text: "Snow", value: ASSETS_PREFIX+"/disp-snow.jpg", src: "./disp-snow.jpg" },
    { text: "Liquid", value: ASSETS_PREFIX+"/disp-liquid.jpg", src: "./disp-liquid.jpg" },
    { text: "Triangle", value: ASSETS_PREFIX+"/disp-tri.jpg", src: "./disp-tri.jpg" },
];

export const DEFAULT_STATE = {
    video: DEFAULT_VIDEO_SOURCE_OPTION,
    video2: "none",
    effects: {
        hueSaturation: {
            active: true,
            hue: 0.0,
            saturation: 1.0,
        },
        brightnessContrast: {
            active: false,
            brightness: 1.0,
            contrast: 1.0,
        },
        blend: {
            active: false,
            mode: "normal",
            color: "#000000ff",
            image: IMAGE_OPTIONS[0].value,
        },
        duotone: {
            active: false,
            dark: "#ffffff",
            light: "WIP",
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
