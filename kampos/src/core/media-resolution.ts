import { getSecondVideoElement } from "../constants";
import { resolveVideo } from "../utils/video-utils";

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = function () {
            console.log("loaded");
            resolve(this);
        };

        img.onerror = function () {
            reject(new Error(`Failed to load image: ${src}`));
        };

        img.src = src;
    });
}

function loadVideo(src) {
    return new Promise((resolve, reject) => {
        console.log("Starting video load for:", src);
        const video = getSecondVideoElement();
        video.src = src;
        video.load();
        video.play();
        resolveVideo(video, resolve, reject);
    });
}


const mediaResolutionCache = new Map();
export async function resolveMediaFromPath(path: string) {
    // Check if the path has already been resolved
    if (mediaResolutionCache.has(path)) {
        return mediaResolutionCache.get(path);
    }

    const extension = path.split(".").pop().toLowerCase();
    let resolvedValue;

    try {
        if (["png", "jpg", "jpeg", "gif"].includes(extension)) {
            resolvedValue = await loadImage(path);
        } else if (["mp4", "webm", "ogg"].includes(extension)) {
            resolvedValue = await loadVideo(path);
        } else {
            // Fallback: Return the path as a string if it doesn't match expected extensions
            resolvedValue = path;
        }

        // Store the resolved value in the cache
        mediaResolutionCache.set(path, resolvedValue);
        return resolvedValue;
    } catch (error) {
        console.error(error);
        // In case of an error, return the path itself as a fallback
        return path;
    }
}
