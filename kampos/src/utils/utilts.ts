export const setVideoSource = (video: HTMLVideoElement, videoFileName: string) => {
    if (!video.src.endsWith(window.state.video)) return;
    console.log("Setting video source to:", videoFileName);
    video.src = videoFileName;
    video.load();
    video.play();
};
