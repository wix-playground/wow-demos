export const setVideoSource = (video: HTMLVideoElement, videoFileName: string) => {
    video.src = `./demo/${videoFileName}`;
    video.load();
    video.play();
};
