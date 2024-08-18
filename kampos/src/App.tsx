import type { Component } from 'solid-js';
import { VideoSelector } from './components/video-selector';

const App: Component = () => {
  return (
    <>
        <div id="drag-n-drop" class="fixed inset-0 z-0 w-full h-full">
            <canvas id="target"
                class="absolute inset-0 z-0 w-full h-full"
             />
        </div>
        <video id="video" src="./assets/cloudy-night.mp4" loop muted hidden></video>
        <video id="videoLoader" loop muted hidden></video>
        <VideoSelector />
    </>
  );
};

export default App;
