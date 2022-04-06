import { $id, $select, $selectAll, clamp, hex2rgba } from "./utils.js";
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
 * @param {number} fontSize
 * @param {'rtl'|'ltr'} textDir
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
    l1: line1,
    l2: line2,
    l3: line3,
    fi: selectedIndex,
    fs: fontSize = 72,
    ls: lineSpacing,
    lts: letterSpacing,
    td: textDirRaw,
    tr: textRotation = 0,
    ts: textSkew,
    to: textOutline,
    toc: textOutlineColor,
    tbm: textBlendMode,
    ta: textAlign,
    tas: textAspect,
    tsc: textShadowColor,
    tso: textShadowOpacity,
    tsx: textShadowX,
    tsy: textShadowY,
    tsb: textShadowBlur,
    tfv: textFlipVertical = 1,
    tfh: textFlipHorizontal = 1,
    textDir = textDirRaw === 'rtl' ? 'rtl' : 'ltr',
    textVertical = textDirRaw === 'v'
}) {
    const fonts = state.get("fonts");
    const { url } = fonts[selectedIndex];

    // string to number
    fontSize = +fontSize;
    lineSpacing = +lineSpacing;
    letterSpacing = +letterSpacing;
    textRotation = +textRotation;
    textSkew = +textSkew;
    textOutline = +textOutline;
    textShadowOpacity = +textShadowOpacity;

    // selectors
    const svgAndMedia = $id("text-box-content");
    const svg = $id("text-svg");
    const svgGroup = $id("text-svg-main");
    const media = $id("text-media");

    const lines = [line1, line2, line3].filter((x) => x);

    let linesPaths = state.get("linesPaths");

    // Should we convert the text to vector?
    if (
        state.get("text") !== lines.join() ||
        state.get("fontUrl") !== url ||
        state.get("fontSize") !== fontSize ||
        state.get("textDir") !== textDir
    ) {
        linesPaths = await Promise.all(
            lines.map((line) => textToPath(line, url, fontSize, textDir))
        );
        state.set("linesPaths", linesPaths);
        state.set("text", lines.join());
        state.set("fontUrl", url);
        state.set("fontSize", fontSize);
        state.set("textDir", textDir);
    }

    //reset stuff
    svgAndMedia.style.filter = "";
    svg.style.fillOpacity = "";
    svg.style.stroke = "";
    svg.style.strokeWidth = 0;
    svg.style.overflow = "";
    svgGroup.innerHTML = "";

    // First loop:
    // Set svg to dom and do and do letter spacing manipulations
    (textVertical ? [...linesPaths].reverse() : linesPaths).forEach((paths) => {
        svgGroup.innerHTML += `<g>${paths.join("")}</g>`;
        const g = svgGroup.lastChild;
        // Set Letter transforms
        [...g.querySelectorAll("path")].forEach((path, i) => {
            let transform;

            if (textVertical) {
                const spacing = letterSpacing ? `translate(0 ${letterSpacing * i})` : '';
                const rect = path.getBBox();
                const vertical = `rotate(-90,${rect.x + rect.width/2},${rect.y + rect.height/2})`;
                transform = `${vertical}${spacing}`;
            }
            else {
                transform = letterSpacing ? `translate(${letterSpacing * i} 0)` : '';
            }

            if (transform) {
                path.setAttribute("transform", transform)
            }
        });

    });

    // Second Loop:
    // Set Alignment and Line spacing
    // We need a second loop because we need to measure sizes per line
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
    // Must happen after the measurements
    const transform = [
        ["rotate", textRotation],
        ["skewX", textSkew],
        ["scale", `${textFlipHorizontal}, ${textFlipVertical}`],
    ]
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}(${value})`)
        .join(" ");

    svgGroup.setAttribute("transform", transform);

    // After all the manipulations - measure the exact boundaries and resize the box
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

    // Blend mode, both mask and outline
    svgAndMedia.style.mixBlendMode = textBlendMode;

    // Apply outline and shadow to svg - Has to be AFTER serializing
    if (textOutline) {
        svg.style.fill = textOutlineColor;
        //svg.style.fillOpacity = 1;
        svg.style.stroke = textOutlineColor;
        svg.style.strokeWidth = textOutline;
        svg.style.overflow = "visible";
    }
    if (textShadowOpacity) {
        svgAndMedia.style.filter = `drop-shadow(${textShadowX}px ${textShadowY}px ${textShadowBlur}px ${hex2rgba(
            textShadowColor,
            textShadowOpacity
        )})`;
    }
}

/**
 * Set text dir
 * @param {MaskFormData} data
 */
function setDirection({ td: textDirection }) {
    const textInputs = $id("textInputs");
    textInputs.style.direction = textDirection === "rtl" ? textDirection : "";
}

/**
 * Set media to stage
 * @param {MaskFormData} data
 */
function setMedia({ mi: selectedIndex }) {
    const media = state.get("media");
    const { type, url } = media[selectedIndex];

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

    if (type === "video") {
        video.removeAttribute("hidden");
        video.src = url;
    } else if (type === "image") {
        image.removeAttribute("hidden");
        image.src = url;
    }
}

/**
 * Reset on stage box size to content limits
 */
function setupStage({ sb: stageBackground, sbi: stageBackgroundImage }) {
    $id("result").style.backgroundColor = stageBackground;
    $id("result").style.backgroundImage = /^https?|data|blob/.test(
        stageBackgroundImage
    )
        ? `url(${stageBackgroundImage})`
        : stageBackgroundImage;
}

/**
 * Load web fonts from config with WebFontLoader 3rd party
 * @param {ConfigData['fonts']} fonts
 */
function loadWebFonts() {
    const fonts = state.get("fonts");
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
function populateFontsList() {
    const fonts = state.get("fonts");

    fonts.forEach(({ family, defaults }, index) => {
        // Create font item
        const fontItem = getTempalteItem("#font-item-template");
        const content = fontItem.querySelector("[data-font-name]");
        const input = fontItem.querySelector("[data-font-input]");

        input.value = index;
        content.textContent = family;
        content.style.fontFamily = family;

        // Set default
        if (defaults) {
            input.setAttribute('checked', 'checked');
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
function populateMediaList() {
    const media = state.get("media");

    media.forEach(({ thumb, defaults, type }, index) => {
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
        input.value = index;

        // Set default
        if (defaults) {
            input.setAttribute('checked', 'checked');
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
            $id("copy-url").querySelector("span").textContent = "(Copied!)";
        });
        event.preventDefault();
    });
}

/**
 * Set form data from URLSearchParams
 */
function setupFormDefaults() {
    const urlParams = new URLSearchParams(window.location.search);
    const elements = [...form.elements];

    if ([...urlParams.entries()].length === 0) {
        form.reset();
        return;
    }
    // Iterate over all form elements that are referenced in the url search params
    for (const element of elements) {
        // checkboxes, radios and multiselect selects are special, they are not set with value but with checked/selected,
        // and they might multiple key representations in the url
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#handling_multiple_checkboxes
        if (urlParams.has(element.name)) {
            if (element.type === "checkbox" || element.type === "radio") {
                const values = urlParams.getAll(element.name);
                element.checked = values.includes(element.value);
            } else if (element.type === "select-multiple") {
                const values = urlParams.getAll(element.name);
                [...element.querySelectorAll("option")].map(
                    (option) =>
                        (option.selected = values.includes(option.value))
                );
            } else {
                element.value = urlParams.get(element.name);
            }
        } else if (
            (element.type === "checkbox" || element.type === "radio") &&
            element.checked
        ) {
            element.checked = false;
        }
    }
}
/*
 {
    fontFamily: string, fontUrl: string, line1: string, line2: string, line3: string, mediaItem: string, mediaType: string,
    fontSize: string, letterSpacing: string, lineSpacing: string, textRotation: string, textOutline: string, textOutlineColor: string,
    textDir: 'rtl' | 'ltr', textAlign: 'left' | 'right' | 'center', stageBackground: string, stageBackgroundImage: string,
    extBlendMode: string, textAspect?: 'keep', textSkew: string,
    top-left: string, top-right: string, bottom-left: string, bottom-right: string
 }
*/
/**
 * this is the single point of update for stage content
 * @typedef {{
 *    fi: string, l1: string, l2: string, l3: string, mi: string,
 *    fs: string, lts: string, ls: string, tr: string, to: string, toc: string,
 *    td: 'rtl' | 'ltr' | 'v', ta: 'left' | 'right' | 'center', sb: string, sbi: string,
 *    tbm: string, tas?: 'keep', ts: string, tfv: 'v', tfh: 'h', tv: 'v'
 *    x: string, y: string, w: string, h: string,
 *    tsc: string, tso: string, tsx: string, tsy: string, tsb: string, tss: string
 * }} MaskFormData
 */
function setupFormSubmit() {
    const form = document.forms[0];
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        /**
         * @type MaskFormData
         */
        const data = Object.fromEntries(formData.entries());

        console.log(data);

        setDirection(data);
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
function setupBoxResize(textBox = $id("text-box")) {
    const handles = [...$selectAll("[data-handle]"), textBox];

    if (form.elements["y"].value) {
        textBox.style.top = form.elements["y"].value;
        textBox.style.left = form.elements["x"].value;
        textBox.style.width = form.elements["w"].value;
        textBox.style.height = form.elements["h"].value;
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
                const width = clamp(10, containerW * 2, newDim.width);
                const height = clamp(10, containerH * 2, newDim.height);

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
                    form.elements["y"].value = textBox.style.top;
                    form.elements["x"].value = textBox.style.left;
                    form.elements["w"].value = textBox.style.width;
                    form.elements["h"].value = textBox.style.height;
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
const state = new Map(
    Object.entries({
        fonts: [],
        media: [],
        linesPaths: [],
        text: "",
        fontUrl: "",
        fontSize: 0,
        textDir: "",
    })
);
async function init() {
    const { fonts, media } = await getConfig();
    state.set("fonts", fonts);
    state.set("media", media);
    loadWebFonts();
    populateFontsList();
    populateMediaList();
    setupTextSettings();
    setupFormDefaults();
    setupFormSubmit();
    setupBoxResize();
}

/**
 * Not really necesary, but reminds me of the good ol' days.
 */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
