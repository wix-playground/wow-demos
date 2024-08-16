export const setVideoSource = (video: HTMLVideoElement, videoFileName: string) => {
    video.src = `./assets/${videoFileName}`;
    video.load();
    video.play();
};
