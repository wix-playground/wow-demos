import { getSecondVideoElement } from "../constants";

export const setVideoSource = (video: HTMLVideoElement, videoFileName: string) => {
    if (video.src.endsWith(videoFileName.replace('./', '/'))) return;
    console.log("Setting video source to:", videoFileName);

    video.src = videoFileName;
    video.load();
    video.play();
    if ('startViewTransition' in document) {
        document.startViewTransition(() => {
            video.src = videoFileName;
            video.load();
            video.play();
        });
    } else {
        video.src = videoFileName;
        video.load();
        video.play();
    }
};


export function resolveVideo(video: HTMLVideoElement, resolve: (video: HTMLVideoElement) => void, reject: (error: Error) => void) {
    if (video.readyState >= 2) {
        resolve(video);
    } else {
        video.addEventListener("loadeddata", () => resolve(video), { once: true });
        video.addEventListener("error", (e) => reject(new Error(`Video loading error: ${e.message}`)), {
            once: true,
        });
    }
}



export function loadImage(src) {
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

export function loadVideo(src) {
    return new Promise((resolve, reject) => {
        console.log("Starting video load for:", src);
        const video = getSecondVideoElement();
        video.src = src;
        video.load();
        video.play();
        resolveVideo(video, resolve, reject);
    });
}
