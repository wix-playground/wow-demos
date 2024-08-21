const ASSETS_PREFIX = "./assets";

export const DEFAULT_VIDEO_SOURCE_OPTION = 'Cloudy Night';
export const VIDEO_SOURCE_OPTIONS = {
    'tunnel futuristic': ASSETS_PREFIX+'/tunnel-futuristic.mp4',
    'neon terrain': ASSETS_PREFIX+'/neon-terrain.mp4',
    'cubes': ASSETS_PREFIX+'/cubes.mp4',
    'tunnel in': ASSETS_PREFIX+'/tunnel-in.mp4',
    'dunets': ASSETS_PREFIX+'/dunets.mp4',
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
export const getSecondVideoElement = () => document.querySelector("#video2") as HTMLVideoElement;

export const IMAGE_OPTIONS = {
    'none': 'none',
    'Cloud': ASSETS_PREFIX+"/disp-cloud.png",
    'Snow': ASSETS_PREFIX+"/disp-snow.jpg",
    'Liquid': ASSETS_PREFIX+"/disp-liquid.jpg",
    'Triangle': ASSETS_PREFIX+"/disp-tri.jpg",
}

function addCategoryToMediaName(value: Record<string, string>, text) {
    return Object.entries(value).filter(([key, value]) => value !== "none").reduce((result, [key, value]) => {
        result[`${text} ${key}`] = value;
        return result;
    }, {} as Record<string, string>);
}
export const VIDEO_AND_IMAGE_OPTIONS = {
    'none': 'none',
    ...addCategoryToMediaName(IMAGE_OPTIONS, '[image]'),
    ...addCategoryToMediaName(VIDEO_SOURCE_OPTIONS, '[video]'),
}

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
            image: IMAGE_OPTIONS.none,
        },
        duotone: {
            active: false,
            dark: "#000000",
            light: "#ffffff",
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
