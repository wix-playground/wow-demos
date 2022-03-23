import { $id, $select, $selectAll, clamp } from "./utils.js";
import opentypeJs from "https://cdn.skypack.dev/opentype.js";

async function textToPath(text, fontUrl) {
    const font = await opentypeJs.load(fontUrl);
    const path = font.getPath(text, 0, 0, 20);
    return path.toSVG();
}

/**
 *
 * @returns {Promise<{fonts: {url: string, family: string, features?: any}[], media: {thumb: string, url: string, type: 'image'|'video'}[]}>}
 */
async function getConfig() {
    const response = await fetch("./data.json");
    return await response.json();
}

/**
 *
 * @param {string} selector
 * @returns {HTMLElement}
 */
function getTempalteItem(selector) {
    return $select(selector).content.cloneNode(true).firstElementChild;
}

const symbols = /[\r\n%#()<>?\[\\\]^`{|}]/g;
/**
 * From Yehonathan
 * @param {string} data svg outerHTML
 * @returns
 */
function encodeSVG(data) {
    // Use single quotes instead of double to avoid encoding.
    const escaped = data
        .replace(/"/g, "'")
        .replace(/>\s{1,}</g, "><")
        .replace(/\s{2,}/g, " ")
        .replace(symbols, encodeURIComponent);

    return `url("data:image/svg+xml,${escaped}")`;
}
/**
 *
 * @param {{fontFamily: string, fontUrl: string, mediaItem: string, mediaType: string, text: string}} data
 */
function setSvgText({ text, fontFamily, fontUrl }) {
    const svg = $id("text-svg");
    const media = $id("text-media");

    textToPath(text, fontUrl).then(pathContent => {
        svg.innerHTML = pathContent;
        const path = svg.querySelector('path');
        const { x, y, width, height } = path.getBBox();
        svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);

        const serialized = encodeSVG(svg.outerHTML);
        console.log(serialized);
        media.style.WebkitMaskImage = serialized;
        media.style.maskImage = serialized;
    })


}

/**
 *
 * @param {{fontFamily: string, fontUrl: string, mediaItem: string, mediaType: string, text: string}} data
 */
function setMedia({ mediaItem, mediaType }) {
    const video = $id("media-video");
    const image = $id("media-image");

    if (image.src) {
        image.setAttribute("hidden", "hidden");
        image.removeAttribute("src");
    }
    if (video.src) {
        video.setAttribute("hidden", "hidden");
        video.pause();
        video.removeAttribute("src"); // empty source
        video.load();
    }

    if (mediaType === "video") {
        video.removeAttribute("hidden");
        video.src = mediaItem;
    } else if (mediaType === "image") {
        image.removeAttribute("hidden");
        image.src = mediaItem;
    }
}

function resetBoxSize() {
    const box = $id("text-box");
    const svg = $id("text-svg");
    const { width, height } = svg.getBoundingClientRect();
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
}

/**
 *
 * @param {{url: string, family: string, features?: any}[]} fonts
 * @param {HTMLFormElement} form
 */
function populateFonts(fonts, form = document.forms[0]) {
    const fontUrlInput = $select("[data-font-url]");

    fonts.forEach(({ url, family }, index) => {
        // Load font
        const font = new FontFace(family, `url(${url})`);
        font.load();
        document.fonts.add(font);

        // Create font item
        const fontItem = getTempalteItem("#font-item-template");
        const content = fontItem.querySelector("[data-font-name]");
        const input = fontItem.querySelector("[data-font-input]");

        input.value = family;
        input.addEventListener("change", () => {
            fontUrlInput.value = url;
            form.requestSubmit();
        });
        content.textContent = family;
        content.style.fontFamily = family;

        // Set default
        if (!index) {
            fontUrlInput.value = url;
            input.checked = "checked";
        }

        // Add to document
        $id("fontList").appendChild(fontItem);
    });
}

/**
 *
 * @param {{thumb: string, url: string, type: "video" | "image"}[]} media
 * @param {HTMLFormElement} form
 */
function populateMedia(media, form = document.forms[0]) {
    const typeInput = $select("[data-media-type]");

    media.forEach(({ thumb, url, type }, index) => {
        let mediaItem;

        // Create image item
        if (type === "image") {
            mediaItem = getTempalteItem("#media-item-image-template");

            const image = mediaItem.querySelector("[data-thumb]");
            image.src = thumb;
        }
        // or - Create video item
        else if (type === "video") {
            mediaItem = getTempalteItem("#media-item-video-template");

            const video = mediaItem.querySelector("[data-thumb]");
            video.src = thumb;
            video.addEventListener("mouseenter", () => video.play());
            video.addEventListener("mouseleave", () => video.pause());
        }

        // Set input values
        const input = mediaItem.querySelector("[data-media-input]");
        input.value = url;
        input.addEventListener("change", () => {
            // Set currently selected type
            typeInput.value = type;
            form.requestSubmit();
        });

        // Set default
        if (!index) {
            typeInput.value = type;
            input.checked = "checked";
        }

        // Add to document
        $id("mediaList").appendChild(mediaItem);
    });
}

/**
 * this is the single point of update for stage content
 * @param {HTMLFormElement} form
 */
function handleFormSubmit(form = document.forms[0]) {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        console.log(data);
        setMedia(data);
        setSvgText(data);
        resetBoxSize();
    });
    setTimeout(() => form.requestSubmit(), 500);
}

/**
 * Stagee editbox logic
 * @param {HTMLElement} textBox
 */
function handleBoxResize(textBox = $id("text-box")) {
    const handles = [...$selectAll("[data-handle]"), textBox];
    handles.forEach((handle) => {
        handle.addEventListener("pointerdown", (event) => {
            const target = event.target;
            const container = $id("result");
            const containerH = container.offsetHeight;
            const containerW = container.offsetWidth;
            const corner = target.dataset.handle;
            const { offsetX: initialX, offsetY: initialY } = event;
            const initialDim = {
                top: textBox.offsetTop,
                left: textBox.offsetLeft,
                width: textBox.offsetWidth,
                height: textBox.offsetHeight,
            };
            const newDim = { ...initialDim };

            const handleMove = ({ offsetX, offsetY }) => {
                if (corner === "top-left") {
                    newDim.top = Math.min(offsetY, initialDim.height + initialDim.top - 10);
                    newDim.left = Math.min(offsetX, initialDim.width + initialDim.left - 10);
                    newDim.width = initialDim.width + initialDim.left - offsetX;
                    newDim.height = initialDim.height + initialDim.top - offsetY;
                } else if (corner === "top-right") {
                    newDim.top = Math.min(offsetY, initialDim.height + initialDim.top - 10);
                    newDim.width = offsetX - initialDim.left;
                    newDim.height = initialDim.height + initialDim.top - offsetY;
                } else if (corner === "bottom-left") {
                    newDim.left = Math.min(offsetX, initialDim.width + initialDim.left - 10);
                    newDim.width = initialDim.width + initialDim.left - offsetX;
                    newDim.height = offsetY - initialDim.top;
                } else if (corner === "bottom-right") {
                    newDim.width = offsetX - initialDim.left;
                    newDim.height = offsetY - initialDim.top;
                } else if (handle === textBox) {
                    newDim.top = offsetY - initialY;
                    newDim.left = offsetX - initialX;
                }

                container.dataset.dragging = "true";

                textBox.style.top = `${clamp(
                    Math.min(-newDim.height, 0) + 10,
                    containerH - 10,
                    newDim.top
                )}px`;
                textBox.style.left = `${clamp(
                    Math.min(-newDim.width, 0) + 10,
                    containerW - 10,
                    newDim.left
                )}px`;
                textBox.style.width = `${clamp(
                    10,
                    containerW * 2,
                    newDim.width
                )}px`;
                textBox.style.height = `${clamp(
                    10,
                    containerH * 2,
                    newDim.height
                )}px`;
            };

            container.setPointerCapture(event.pointerId);
            container.addEventListener("pointermove", handleMove);
            container.addEventListener(
                "pointerup",
                function handlePointerUp(e) {
                    delete container.dataset.dragging;
                    container.removeEventListener("pointerup", handlePointerUp);
                    container.removeEventListener("pointermove", handleMove);
                }
            );
        });
    });
}

async function init() {
    const { fonts, media } = await getConfig();
    populateFonts(fonts);
    populateMedia(media);

    handleFormSubmit();
    handleBoxResize();
}

if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", init);
} else {
    // `DOMContentLoaded` has already fired
    init();
}
