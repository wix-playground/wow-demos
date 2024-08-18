
function loadImage(src) {
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

function loadVideo(src) {
    return new Promise((resolve, reject) => {
        console.log("Starting video load for:", src);
        const video = document.createElement("video");
        if (!video) {
            console.error("Video element not found");
            reject(new Error("Video element not found"));
            return;
        }
        video.src = src;
        console.log("Video src set to:", video.src);

        if (video.readyState >= 2) {
            console.log("Video already loaded");
            resolve(video);
        } else {
            video.addEventListener("loadeddata", () => {
                console.log("Video loaded successfully");
                resolve(video);
            }, { once: true });
            video.addEventListener("error", (e) => {
                console.error("Video loading error:", e);
                reject(new Error(`Video loading error: ${e.message}`));
            }, { once: true });
        }
    });
}


const mediaResolutionCache = new Map();
export async function resolveMediaFromPath(path: string) {
    // Check if the path has already been resolved
    if (mediaResolutionCache.has(path)) {
        return mediaResolutionCache.get(path);
    }

    const extension = path.split(".").pop().toLowerCase();
    let resolvedValue;

    try {
        if (["png", "jpg", "jpeg", "gif"].includes(extension)) {
            resolvedValue = await loadImage(path);
        } else if (["mp4", "webm", "ogg"].includes(extension)) {
            resolvedValue = await loadVideo(path);
        } else {
            // Fallback: Return the path as a string if it doesn't match expected extensions
            resolvedValue = path;
        }

        // Store the resolved value in the cache
        mediaResolutionCache.set(path, resolvedValue);
        return resolvedValue;
    } catch (error) {
        console.error(error);
        // In case of an error, return the path itself as a fallback
        return path;
    }
}
