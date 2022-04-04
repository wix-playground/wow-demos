import { $id, $select, $selectAll, clamp } from "./utils.js";
import webfontloader from "https://cdn.skypack.dev/webfontloader";
import opentypeJs from "https://cdn.skypack.dev/opentype.js";
import bidiFactory from "https://cdn.skypack.dev/bidi-js";
// polyfill for form.requestSubmit in Safari, should be removed when the feature is enabled https://bugs.webkit.org/show_bug.cgi?id=197958
import formRequestSubmitPolyfill from "https://cdn.skypack.dev/pin/form-request-submit-polyfill@v2.0.0-szOipIemxchOslzcqvLN/mode=imports,min/optimized/form-request-submit-polyfill.js";

const bidi = bidiFactory();

/**
 * Use Opentype.js to convert text + font to path
 * TODO: Support bold, italic, multiline, variants, features
 * @param {string} text
 * @param {string} fontUrl
 * @param {{kerning: boolean, hinting: boolean, features: { liga: boolean, rlig: boolean }}}
 * @returns {Promise<string[]>} svg path
 */
async function textToPath(
    text,
    fontUrl,
    fontSize,
    textDir,
    options = {
        kerning: true,
        hinting: false,
        features: {
            liga: true,
            rlig: true,
        },
    }
) {
    const font = await opentypeJs.load(fontUrl);
    const bidiText = bidi.getReorderedString(
        text,
        bidi.getEmbeddingLevels(text, textDir)
    );
    const paths = font.getPaths(bidiText, 0, 0, fontSize, options);
    return paths.map((path) => path.toSVG());
}

/**
 * Get configuration from a json file (because we cant natively import json files just yet)
 * @typedef {{fonts: {url: string, family: string, features?: {unicodeRanges: string[]}}[], media: {thumb: string, url: string, type: 'image'|'video'}[]}} ConfigData
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
 * @param {MaskFormData} data
 */
async function setSvgText({
    line1,
    line2,
    line3,
    fontFamily,
    fontUrl,
    fontSize = 72,
    lineSpacing,
    letterSpacing,
    textDir,
    textRotation,
    textSkew,
    textOutline,
    textOutlineColor,
    textBlendMode,
    textAlign,
    textAspect,
}) {
    // string to number
    fontSize = +fontSize;
    lineSpacing = +lineSpacing;
    letterSpacing = +letterSpacing;
    textRotation = +textRotation;
    textSkew = +textSkew;
    textOutline = +textOutline;

    // selectors
    const svgAndMedia = $id("text-box-content");
    const svg = $id("text-svg");
    const svgGroup = $id("text-svg-main");
    const media = $id("text-media");
    const lines = [line1, line2, line3].filter((x) => x);

    let linesPaths = state.get('linesPaths');

    if (state.get('text') !== lines.join() || state.get('fontUrl') !== fontUrl || state.get('fontSize') !== fontSize || state.get('textDir') !== textDir) {
        // convertion

        linesPaths = await Promise.all(
            lines.map((line) => textToPath(line, fontUrl, fontSize, textDir))
        );
        state.set('linesPaths', linesPaths);
        state.set('text', lines.join());
        state.set('fontUrl', fontUrl);
        state.set('fontSize', fontSize);
        state.set('textDir', textDir);
    }

    //reset stuff
    svg.style.fillOpacity = "";
    svg.style.strokeWidth = 0;
    svg.style.overflow = "";
    svgGroup.innerHTML = "";

    // First loop : set svg to dom and do and do letter spacing manipulations
    linesPaths.forEach((paths) => {
        svgGroup.innerHTML += `<g>${paths.join("")}</g>`;
        const g = svgGroup.lastChild;

        // Set Letter Spacing
        if (letterSpacing) {
            [...g.querySelectorAll("path")].forEach((path, i) =>
                path.setAttribute(
                    "transform",
                    `translate(${letterSpacing * i} 0)`
                )
            );
        }
    });
    // Second Loop: Set Alignment and Line spacing
    // We need a second loop because we need to know the longes line width
    [...svgGroup.querySelectorAll("g")].forEach((g, i) => {
        let gLeft = 0;
        const { width: svgGroupWidth } = svgGroup.getBBox();
        const { width: gWidth } = g.getBBox();

        if (textAlign === "center") {
            gLeft = (svgGroupWidth - gWidth) / 2;
        } else if (textAlign === "right") {
            gLeft = svgGroupWidth - gWidth;
        }

        g.setAttribute(
            "transform",
            `translate(${gLeft} ${(fontSize + lineSpacing) * i})`
        );
    });

    // Set Transforms
    const transform = [
        ["rotate", textRotation],
        ["skewX", textSkew],
    ]
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}(${value})`)
        .join(" ");

    svgGroup.setAttribute("transform", transform);

    // after all the manipulations - get the exact boundaries and resize box
    const { x, y, width, height } = svg.getBBox();
    svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
    svg.setAttribute(
        "preserveAspectRatio",
        textAspect === "keep" ? "xMidYMid meet" : "none"
    );
    // Create mask
    const serialized = encodeSVG(svg.outerHTML);
    console.log(serialized);
    media.style.WebkitMaskImage = serialized;
    media.style.maskImage = serialized;
    document.body.style.setProperty("--seleced-font-family", fontFamily);

    // blend mode, both mask and outline
    svgAndMedia.style.mixBlendMode = textBlendMode;

    //Apply outline to svg - Has to be AFTER serializing
    if (textOutline) {
        svg.style.fill = textOutlineColor;
        //svg.style.fillOpacity = 1;
        svg.style.stroke = textOutlineColor;
        svg.style.strokeWidth = textOutline;
        svg.style.overflow = "visible";
    }
}

/**
 * Set text dir
 * @param {MaskFormData} data
 */
function setDirection(dir) {
    const textInputs = $id("textInputs");
    textInputs.style.direction = dir === "rtl" ? dir : "";
}

/**
 * Set media to stage
 * @param {MaskFormData} data
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
function setupStage({stageBackground, stageBackgroundImage}) {
    $id("result").style.backgroundColor = stageBackground;
    $id("result").style.backgroundImage = /^https?|data|blob/.test(stageBackgroundImage) ? `url(${stageBackgroundImage})` : stageBackgroundImage;
}

/**
 * Load web fonts from config with WebFontLoader 3rd party
 * @param {ConfigData['fonts']} fonts
 */
function loadWebFonts(fonts) {
    const families = fonts.map(
        ({ family, variant = 400 }) => `${family}:${variant}`
    );
    webfontloader.load({
        google: {
            families,
        },
    });
}
/**
 * Get font list from configuration and build UI + form event
 * @param {ConfigData['fonts']} fonts
 * @param {HTMLFormElement} form
 */
function populateFonts(fonts, form = document.forms[0]) {
    const fontUrlInput = $select("[data-font-url]");

    fonts.forEach(({ url, family }, index) => {
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
        if (family === "Karantina") {
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

function setupTextSettings() {
    [...$selectAll("[data-setting-change")]?.forEach((input) =>
        input.addEventListener("change", () => {
            form.requestSubmit();
        })
    );
    [...$selectAll("[data-setting-input")]?.forEach((input) =>
        input.addEventListener("input", () => {
            form.requestSubmit();
        })
    );

    $id("copy-url").addEventListener("click", (event) => {
        navigator.clipboard.writeText(location.href).then(() => {
            event.target.querySelector("span").textContent = "(Copied!)";
        });
        event.preventDefault();
    });
}

/**
 * Set form data from a saved object
 * @param {Partial<MaskFormData>} defaults
 */
function setFormDefaults() {
    const form = document.forms[0];
    const urlParams = new URLSearchParams(window.location.search);
    const elements = [...form.elements];

    // Iterate over all form elements that are referenced in the url search params
    for (const element of elements) {
        // checkboxes, radios and multiselect selects are special, they are not set with value but with checked/selected,
        // and they might be represented with a multiple key representations in the url
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#handling_multiple_checkboxes
        if (element.type === "checkbox" || element.type === "radio") {
            const values = urlParams.getAll(element.name);
            element.checked = values.includes(element.value);
        } else if (element.type === "select" && element.multiple) {
            const values = urlParams.getAll(element.name);
            [...element.querySelectorAll("option")].map(
                (option) => (option.selected = values.includes(option.value))
            );
        } else {
            if (urlParams.has(element.name)) {
                element.value = urlParams.get(element.name);
            }
        }
    }
}
/**
 * this is the single point of update for stage content
 * @typedef {{
 *    fontFamily: string, fontUrl: string, line1: string, line2: string, line3: string, mediaItem: string, mediaType: string,
 *    fontSize: string, letterSpacing: string, lineSpacing: string, textRotation: string, textOutline: string, textOutlineColor: string,
 *    textDir: 'rtl' | 'ltr', textAlign: 'left' | 'right' | 'center', stageBackground: string, stageBackgroundImage: string,
 *    extBlendMode: string, textAspect?: 'keep', textSkew: string,
 *    top-left: string, top-right: string, bottom-left: string, bottom-right: string
 * }} MaskFormData
 * @param {HTMLFormElement} form
 */
function handleFormSubmit() {
    const form = document.forms[0];
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        /**
         * @type MaskFormData
         */
        const data = Object.fromEntries(formData.entries());

        console.log(data);

        setDirection(data.textDir);
        setMedia(data);
        await setSvgText(data);
        setupStage(data);

        // Update URL without reloading
        if (history.pushState) {
            const url = new URL(window.location.href);
            url.search = new URLSearchParams(formData).toString();
            window.history.pushState({ path: url.href }, "", url.href);
        }
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

    if (form.elements['box-top'].value) {
        textBox.style.top = form.elements['box-top'].value;
        textBox.style.left = form.elements['box-left'].value;
        textBox.style.width = form.elements['box-width'].value;
        textBox.style.height = form.elements['box-height'].value;
    }

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
                    newDim.top = Math.min(
                        offsetY,
                        initialDim.height + initialDim.top - 10
                    );
                    newDim.left = Math.min(
                        offsetX,
                        initialDim.width + initialDim.left - 10
                    );
                    newDim.width = initialDim.width + initialDim.left - offsetX;
                    newDim.height =
                        initialDim.height + initialDim.top - offsetY;
                } else if (corner === "top-right") {
                    newDim.top = Math.min(
                        offsetY,
                        initialDim.height + initialDim.top - 10
                    );
                    newDim.width = offsetX - initialDim.left;
                    newDim.height =
                        initialDim.height + initialDim.top - offsetY;
                } else if (corner === "bottom-left") {
                    newDim.left = Math.min(
                        offsetX,
                        initialDim.width + initialDim.left - 10
                    );
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

                const top = clamp(
                    Math.min(-newDim.height, 0) + 10,
                    containerH - 10,
                    newDim.top
                );
                const left = clamp(
                    Math.min(-newDim.width, 0) + 10,
                    containerW - 10,
                    newDim.left
                );
                const width = clamp(
                    10,
                    containerW * 2,
                    newDim.width
                );
                const height = clamp(
                    10,
                    containerH * 2,
                    newDim.height
                );

                textBox.style.top = `${top}px`;
                textBox.style.left = `${left}px`;
                textBox.style.width = `${width}px`;
                textBox.style.height = `${height}px`;
            };

            container.setPointerCapture(event.pointerId);
            container.addEventListener("pointermove", handleMove);
            container.addEventListener(
                "pointerup",
                function handlePointerUp(e) {
                    delete container.dataset.dragging;

                    // Save box dimensions
                    form.elements['box-top'].value = textBox.style.top;
                    form.elements['box-left'].value = textBox.style.left ;
                    form.elements['box-width'].value = textBox.style.width;
                    form.elements['box-height'].value = textBox.style.height;
                    form.requestSubmit();

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

const state = new Map(Object.entries({
    linesPaths: [],
    text: '',
    fontUrl: '',
    fontSize: 0,
    textDir: ''
}))
async function init() {
    const { fonts, media } = await getConfig();
    loadWebFonts(fonts);
    populateFonts(fonts);
    populateMedia(media);
    setupTextSettings();
    setFormDefaults();
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
