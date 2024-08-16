import { createSignal, onMount } from "solid-js";
import { getVideoElement, VIDEO_SOURCE_OPTIONS } from "../constants";
import { setState, getQueryValue } from "../utils/state";
import { setVideoSource } from "../utils/utilts";

export function VideoSelector() {
    const [selectedVideo, setSelectedVideo] = createSignal(
        getQueryValue()?.children?.find((v) => v.label === "video")?.binding.value
    );
    onMount(() => {
        const initialState = getQueryValue(); // Access the global state using getQueryValue
        const initialVideo = initialState?.children?.find((v) => v.label === "video")?.binding.value;
        if (initialVideo) {
            updateSelectedVideo(initialVideo);
        }
    });

    const updateSelectedVideo = (source) => {
        setSelectedVideo(source);
        const thumbnails = document.querySelectorAll(".thumbnail");
    };

    const selectVideo = (source) => {
        const currentState = getQueryValue();
        const videoChild = currentState?.children?.find((v) => v.label === "video");
        if (videoChild) {
            videoChild.binding.value = source;
        }
        setVideoSource(getVideoElement(), source);
        setState(currentState);
        updateSelectedVideo(source);
    };

    return (
        <div class="fixed bottom-5 left-1/2 transform -translate-x-1/2 w-2/3 flex gap-3 bg-black bg-opacity-50 p-3 rounded-lg backdrop-blur-md">
            {Object.entries(VIDEO_SOURCE_OPTIONS).map(([name, source]) => (
                <button
                    type="button"
                    onClick={() => selectVideo(source)}
                    class="thumbnail w-[110px] h-[65px] border-2 rounded cursor-pointer transition-transform spring-bounce-30 spring-duration-300 hover:scale-[1.2] hover:shadow-lg border-transparent aria-[selected]:border-white bg-cover bg-center bg-no-repeat"
                    aria-selected={selectedVideo() === source ? "true" : undefined}
                    style={{ "background-image": `url(./assets/${source.replace(".mp4", ".jpg")})` }}
                >
                    <span class="sr-only">{name}</span>
                </button>
            ))}
            <div class="thumbnail flex flex-col items-center justify-center w-[110px] h-[60px] bg-white bg-opacity-20 rounded text-white text-xs text-center cursor-default border-2 border-dashed border-white">
                <span>Drag file</span>
            </div>
        </div>
    );
}
