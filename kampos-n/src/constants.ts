export const VIDEO_SOURCES = [
    'cloudy-night.mp4',
    'drop-water.mp4',
    'man-on-beach.mp4',
    'starry-night.mp4',
    'shell-beach.mp4',
    'wheat-field.mp4',
];

const [firstVideoSource, ...ALL_EXCEPT_FIRST_VIDEO_SOURCES] = VIDEO_SOURCES;

const VIDEO_MASK_SOURCES = [
    'none',
    ...ALL_EXCEPT_FIRST_VIDEO_SOURCES,
    firstVideoSource,
];

export const VIDEO_SOURCE_OPTIONS = VIDEO_SOURCES.reduce((obj, source) => {
    obj[source] = source;
    return obj;
}, {} as Record<string, string>);

export const VIDEO_MASK_SOURCE_OPTIONS = VIDEO_MASK_SOURCES.reduce((obj, source) => {
    obj[source] = source;
    return obj;
}, {} as Record<string, string>);

export const DEFAULT_VIDEO_SOURCE_OPTION = firstVideoSource;
export const DEFAULT_MASK_VIDEO_SOURCE_OPTION = VIDEO_MASK_SOURCES[0];

export const getVideoElement = () => document.querySelector("#video") as HTMLVideoElement;
