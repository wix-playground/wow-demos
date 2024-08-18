import { createSignal } from "solid-js";
import { VIDEO_SOURCE_OPTIONS } from "../constants";
import { setState, getQueryValue } from "../utils/state";

const getCurrentVideoState = () => getQueryValue()?.children.find(v=>v.title==='Kaleidoscope Effect')?.children?.find((v) => v.label === "video");
export function VideoSelector() {
    const [selectedVideo, setSelectedVideo] = createSignal(
        getCurrentVideoState()?.binding?.value
    );

    const selectVideo = (source) => {
        setSelectedVideo(source);
        const videoChild = getCurrentVideoState();
        if (videoChild) {
            videoChild.binding.value = source;
        }
        // works cause of mutation above
        setState(getQueryValue());
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
