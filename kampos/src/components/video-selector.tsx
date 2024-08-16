import { createSignal, onMount } from 'solid-js';
import { getVideoElement, VIDEO_SOURCE_OPTIONS } from '../constants';
import { setState, getQueryValue } from '../utils/state';
import { setVideoSource } from '../utils/utilts';

export function VideoSelector() {
    const [selectedVideo, setSelectedVideo] = createSignal(getQueryValue()?.children?.find((v) => v.label === 'video')?.binding.value);
  onMount(() => {
    const initialState = getQueryValue(); // Access the global state using getQueryValue
    const initialVideo = initialState?.children?.find((v) => v.label === 'video')?.binding.value;
    if (initialVideo) {
      updateSelectedVideo(initialVideo);
    }
  });

  const updateSelectedVideo = (source) => {
    setSelectedVideo(source);
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb) => {
      thumb.classList.toggle('selected', (thumb as HTMLImageElement).dataset.source === source);
    });
  };

  const selectVideo = (source) => {
    const currentState = getQueryValue();
    const videoChild = currentState?.children?.find((v) => v.label === 'video');
    if (videoChild) {
      videoChild.binding.value = source;
    }
    setVideoSource(getVideoElement(), source);
    setState(currentState);
    updateSelectedVideo(source);
  };

  return (
    <div
      class="fixed bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 p-2 rounded-lg"
    >
      {Object.entries(VIDEO_SOURCE_OPTIONS).map(([name, source]) => (
        <img
          class={`thumbnail w-20 h-11 border-2 rounded cursor-pointer transition-transform duration-300 ease-in-out ${
            selectedVideo() === source ? 'border-white' : 'border-transparent'
          } hover:scale-110 hover:shadow-lg`}
          src={`./assets/${source.replace('.mp4', '.jpg')}`}
          alt={name}
          data-source={source}
          onClick={() => selectVideo(source)}
        />
      ))}
      <div class="thumbnail flex flex-col items-center justify-center w-20 h-11 bg-white bg-opacity-20 rounded text-white text-xs text-center cursor-default border-2 border-dashed border-white">
        <span>Drag file</span>
      </div>
    </div>
  );
}
