import type { Component } from 'solid-js';
import { VideoSelector } from './components/video-selector';

const App: Component = () => {
    return (
        <>
            <div id="drag-n-drop" class="fixed inset-0 z-0 w-full h-full">
                <canvas id="target" class="absolute inset-0 z-0 w-full h-full" />
            </div>
            <canvas id="canvas" class="hidden" />
            <video
                id="video"
                src="./assets/cloudy-night.mp4"
                autoplay
                loop
                muted
                preload="auto"
                crossorigin="anonymous"
                hidden
                playsinline
            ></video>
            <video id="video2" autoplay loop muted preload="auto" crossorigin="anonymous" hidden playsinline></video>
            <VideoSelector />
        </>
    );
};

export default App;
