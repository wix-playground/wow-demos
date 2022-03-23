import { $id, $select, $selectAll, clamp } from "./utils.js";
import opentypeJs from "https://cdn.skypack.dev/opentype.js";

/**
 * Use Opentype.js to convert text + font to path
 * TODO: Support bold, italic, multiline, variants, features
 * @param {string} text
 * @param {string} fontUrl
 * @returns {Promise<string>} svg path
 */
async function textToPath(text, fontUrl) {
    const font = await opentypeJs.load(fontUrl);
    const path = font.getPath(text, 0, 0, 20);
    return path.toSVG();
}

/**
 * Get configuration from a json file (because we cant natively import json files just yet)
 * @typedef {{fonts: {url: string, family: string, features?: any}[], media: {thumb: string, url: string, type: 'image'|'video'}[]}} ConfigData
 * @returns {Promise<ConfigData>}
 */
async function getConfig() {
    const response = await fetch("./data.json");
    return await response.json();
}

/**
 * get an html template from the dom by a selector
 * @param {string} selector
 * @returns {HTMLElement}
 */
function getTempalteItem(selector) {
    return $select(selector).content.cloneNode(true).firstElementChild;
}

/**
 * Helper matcher for SVG encoding
 */
const symbols = /[\r\n%#()<>?\[\\\]^`{|}]/g;
/**
 * encode an SVG to data url
 * (copied from Yehonathan https://github.com/wix-playground/wow-demos/blob/85639c80e98df802e7389c816c5cebeb51e6542b/video-crop/index.js#L35-L45)
 * @param {string} data svg outerHTML
 * @returns {string} svg data url
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
 * Set svg text to stage
 * @param {ConfigData} data
 */
async function setSvgText({ text, fontFamily, fontUrl }) {
    const svg = $id("text-svg");
    const media = $id("text-media");

    const pathContent = await textToPath(text, fontUrl)

    svg.innerHTML = pathContent;
    const path = svg.querySelector('path');
    const { x, y, width, height } = path.getBBox();
    svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);

    const serialized = encodeSVG(svg.outerHTML);
    console.log(serialized);
    media.style.WebkitMaskImage = serialized;
    media.style.maskImage = serialized;
}

/**
 * Set media to stage
 * @param {ConfigData} data
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

/**
 * Reset on stage box size to content limits
 */
function resetBoxSize() {
    const box = $id("text-box");
    const svg = $id("text-svg");
    const { width, height } = svg.getBoundingClientRect();
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
}

/**
 * Get font list from configuration and build UI + form event
 * @param {ConfigData['fonts']} fonts
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
 * Get media list from configuration and build UI + form event
 * @param {ConfigData['media']} media
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
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        console.log(data);
        setMedia(data);
        await setSvgText(data);
        resetBoxSize();
    });
    // Initial setup, stupidly wait 500ms for all fonts etc to load
    setTimeout(() => form.requestSubmit(), 500);
}

/**
 * Stage editbox interaction logic
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
                    newDim.top = offsetY;
                    newDim.left = offsetX;
                    newDim.width = initialDim.width + initialDim.left - offsetX;
                    newDim.height =
                        initialDim.height + initialDim.top - offsetY;
                } else if (corner === "top-right") {
                    newDim.top = offsetY;
                    newDim.width = offsetX - initialDim.left;
                    newDim.height =
                        initialDim.height + initialDim.top - offsetY;
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

                container.dataset.dragging = "true";

                textBox.style.top = `${clamp(
                    -newDim.height + 10,
                    containerH - 10,
                    newDim.top
                )}px`;
                textBox.style.left = `${clamp(
                    -newDim.width + 10,
                    containerW - 10,
                    newDim.left
                )}px`;
                textBox.style.width = `${clamp(
                    0,
                    containerW * 2,
                    newDim.width
                )}px`;
                textBox.style.height = `${clamp(
                    0,
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

/**
 * Start here
 */
async function init() {
    const { fonts, media } = await getConfig();
    populateFonts(fonts);
    populateMedia(media);

    handleFormSubmit();
    handleBoxResize();
}

/**
 * Not really necesary, but reminds me of the good ol' days.
 */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
