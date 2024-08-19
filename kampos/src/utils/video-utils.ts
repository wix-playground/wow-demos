export const setVideoSource = (video: HTMLVideoElement, videoFileName: string) => {
    if (video.src.endsWith(videoFileName.replace('./', '/'))) return;
    console.log("Setting video source to:", videoFileName);

    video.src = videoFileName;
    video.load();
    video.play();
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
