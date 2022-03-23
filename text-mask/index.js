import { $id, $select, $selectAll, clamp } from "./utils.js";
// import fontkit from "https://cdn.skypack.dev/@pdf-lib/fontkit";

// async function registerFont(fontUrl) {
//     // const fontUrl = "https://fonts.gstatic.com/s/raviprakash/v3/8EzbM7Rymjk25jWeHxbO6CXeN0lhaNKjYxc8tNqs5DA.woff2";
//     const res = await fetch(fontUrl);
//     const ab = await res.arrayBuffer();
//     font = fontkit.create(new Buffer(ab));
// }

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

/**
 *
 * @param {{fontFamily: string, mediaItem: string, mediaType: string, text: string}} data
 */
function setSvgText({ text, fontFamily }) {
    const svg = $id("text-svg");
    const svgText = $id("text-content");
    svgText.textContent = text;
    svgText.style.cssText = `font: normal 20px ${fontFamily}; fill: hsl(0, 0%, 0%);`;
    const { x, y, width, height } = svgText.getBBox();
    svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
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
 */
function populateFonts(fonts) {
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
        input.addEventListener("change", () => form.requestSubmit());
        if (!index) {
            input.checked = "checked";
        }

        content.textContent = family;
        content.style.fontFamily = family;

        $id("fontList").appendChild(fontItem);
    });
}

/**
 *
 * @param {{thumb: string, url: string, type: "video" | "image"}[]} media
 */
function populateMedia(media) {
    media.forEach(({ thumb, url, type }, index) => {
        let mediaItem;

        if (type === "image") {
            mediaItem = getTempalteItem("#media-item-image-template");

            const image = mediaItem.querySelector("[data-thumb]");
            image.src = thumb;
        } else if (type === "video") {
            mediaItem = getTempalteItem("#media-item-video-template");

            const video = mediaItem.querySelector("[data-thumb]");
            video.src = thumb;
            video.addEventListener("mouseenter", () => video.play());
            video.addEventListener("mouseleave", () => video.pause());
        }

        const input = mediaItem.querySelector("[data-media-input]");
        input.value = url;
        input.addEventListener("change", () => form.requestSubmit());
        if (!index) {
            input.checked = "checked";
        }

        $id("mediaList").appendChild(mediaItem);
    });
}

/**
 *
 * @param {HTMLFormElement} form
 */
function handleFormSubmit(form) {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        setSvgText(data);
        resetBoxSize();
    });
    setTimeout(() => form.requestSubmit(), 500);
}

/**
 *
 * @param {HTMLElement} textBox
 */
function handleBoxResize(textBox) {
    const handles = [...$selectAll("[data-handle]"), textBox];
    handles.forEach((handle) => {
        handle.addEventListener("pointerdown", (event) => {
            const target = event.target;
            const container = $id('result');
            const containerH = container.offsetHeight;
            const containerW = container.offsetWidth;
            const corner = target.dataset.handle;
            const { offsetX: initialX, offsetY: initialY } = event;
            const initialDim = {
                top: textBox.offsetTop,
                left: textBox.offsetLeft,
                width: textBox.offsetWidth,
                height: textBox.offsetHeight
            }
            const newDim = {...initialDim};

            const handleMove = ({ offsetX, offsetY }) => {
                if (corner === "top-left") {
                    newDim.top = offsetY;
                    newDim.left = offsetX;
                    newDim.width =  initialDim.width + initialDim.left - offsetX;
                    newDim.height = initialDim.height + initialDim.top - offsetY;
                } else if (corner === "top-right") {
                    newDim.top = offsetY;
                    newDim.width = offsetX - initialDim.left;
                    newDim.height = initialDim.height + initialDim.top - offsetY;
                } else if (corner === "bottom-left") {
                    newDim.left = offsetX;
                    newDim.width = initialDim.width + initialDim.left - offsetX;
                    newDim.height = offsetY - initialDim.top;
                } else if (corner === "bottom-right") {
                    newDim.width = offsetX - initialDim.left;
                    newDim.height = offsetY - initialDim.top;
                } else if (handle === textBox) {
                    newDim.top = offsetY - initialY;
                    newDim.left = offsetX - initialX;
                }

                container.dataset.dragging = 'true';

                textBox.style.top = `${clamp(-newDim.height + 10, containerH - 10, newDim.top)}px`;
                textBox.style.left = `${clamp(-newDim.width + 10, containerW - 10, newDim.left)}px`;
                textBox.style.width = `${clamp(0, containerW * 2, newDim.width)}px`;
                textBox.style.height = `${clamp(0, containerH * 2, newDim.height)}px`;
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
    const form = document.forms[0];
    const textBox = $id("text-box");
    populateFonts(fonts);
    populateMedia(media);

    handleFormSubmit(form);
    handleBoxResize(textBox);
}

if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", init);
} else {
    // `DOMContentLoaded` has already fired
    init();
}
