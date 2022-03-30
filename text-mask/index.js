import { $id, $select, $selectAll, clamp } from "./utils.js";
import webfontloader from 'https://cdn.skypack.dev/webfontloader';
import opentypeJs from "https://cdn.skypack.dev/opentype.js";
import bidiFactory from 'https://cdn.skypack.dev/bidi-js';
// polyfill for form.requestSubmit in Safari, should be removed when the feature is enabled https://bugs.webkit.org/show_bug.cgi?id=197958
import formRequestSubmitPolyfill from 'https://cdn.skypack.dev/pin/form-request-submit-polyfill@v2.0.0-szOipIemxchOslzcqvLN/mode=imports,min/optimized/form-request-submit-polyfill.js';

const bidi = bidiFactory()

/**
 * Use Opentype.js to convert text + font to path
 * TODO: Support bold, italic, multiline, variants, features
 * @param {string} text
 * @param {string} fontUrl
 * @param {{kerning: boolean, hinting: boolean, features: { liga: boolean, rlig: boolean }}}
 * @returns {Promise<string[]>} svg path
 */
async function textToPath(text, fontUrl, fontSize, textDir, options = {
    kerning: true,
    hinting: false,
    features: {
        liga: true,
        rlig: true
    }
}) {
    const font = await opentypeJs.load(fontUrl);
    const bidiText = bidi.getReorderedString(text, bidi.getEmbeddingLevels(text, textDir));
    const paths = font.getPaths(bidiText, 0, 0, fontSize, options);
    return paths.map(path => path.toSVG());
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
 * Get Settings saved to URL
 * @returns {Partial<MaskFormData>}
 */
function getSettingsFromUrl() {
    var urlParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(urlParams.entries());
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
async function setSvgText({ line1, line2, line3, fontFamily, fontUrl, fontSize = 72, lineSpacing, letterSpacing, textDir, textRotation, textOutline, textOutlineColor, textBlendMode, textAlign }) {
    // string to number
    fontSize = +fontSize;
    lineSpacing = +lineSpacing;
    letterSpacing = +letterSpacing;
    textRotation = +textRotation;
    textOutline = +textOutline;

    // selectors
    const svgAndMedia = $id("text-box-content");
    const svg = $id("text-svg");
    const svgGroup = $id('text-svg-main');
    const media = $id("text-media");

    // convertion
    const lines = [line1, line2, line3].filter(x => x);
    const linesPaths = await Promise.all(lines.map(line => textToPath(line, fontUrl, fontSize, textDir)));

    //reset stuff
    svg.style.fillOpacity = '';
    svg.style.strokeWidth = 0;
    svg.style.overflow = '';
    svgGroup.innerHTML ='';

    // First loop : set svg to dom and do and do letter spacing manipulations
    linesPaths.forEach((paths) => {
        svgGroup.innerHTML += `<g>${paths.join('')}</g>`;
        const g = svgGroup.lastChild;

        // Set Letter Spacing
        if (letterSpacing) {
            [...g.querySelectorAll('path')].forEach((path, i) => path.setAttribute('transform', `translate(${letterSpacing * i} 0)`))
        }
    });
    // Second Loop: Set Alignment and Line spacing
    // We need a second loop because we need to know the longes line width
    [...svgGroup.querySelectorAll('g')].forEach((g, i) => {
        let gLeft = 0;
        const {width: svgGroupWidth} = svgGroup.getBBox();
        const {width: gWidth} = g.getBBox();

        if (textAlign === 'center') {
            gLeft = (svgGroupWidth - gWidth) / 2;
        } else if (textAlign === 'right') {
            gLeft = svgGroupWidth - gWidth;
        }

        g.setAttribute('transform', `translate(${gLeft} ${(fontSize + lineSpacing) * i})`);
    })

    // Set Rotation
    svgGroup.setAttribute('transform', `rotate(${textRotation})`)

    // after all the manipulations - get the exact boundaries and resize box
    const { x, y, width, height } = svg.getBBox();
    svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);

    // Create mask
    const serialized = encodeSVG(svg.outerHTML);
    console.log(serialized);
    media.style.WebkitMaskImage = serialized;
    media.style.maskImage = serialized;
    document.body.style.setProperty('--seleced-font-family', fontFamily);

    // blend mode, both mask and outline
    svgAndMedia.style.mixBlendMode = textBlendMode;

    //Apply outline to svg - Has to be AFTER serializing
    if (textOutline) {
        svg.style.fill = textOutlineColor;
        //svg.style.fillOpacity = 1;
        svg.style.stroke = textOutlineColor;
        svg.style.strokeWidth = textOutline;
        svg.style.overflow = 'visible';
    }
}

/**
 * Set text dir
 * @param {MaskFormData} data
 */
function setDirection(dir) {
    const textInputs = $id('textInputs');
    textInputs.style.direction = dir === 'rtl' ? dir : '';
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
function setupStage(bgColor) {
    // fit box to svg
    const box = $id("text-box");
    const svg = $id("text-svg");
    const { width, height } = svg.getBoundingClientRect();
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;

    // set bg color
    $id('result').style.background = bgColor;
}

/**
 * Load web fonts from config with WebFontLoader 3rd party
 * @param {ConfigData['fonts']} fonts
 */
function loadWebFonts(fonts) {
    const families = fonts.map(({family, variant = 400}) => `${family}:${variant}`)
    webfontloader.load({
        google: {
          families
        }
      })
}
/**
 * Get font list from configuration and build UI + form event
 * @param {ConfigData['fonts']} fonts
 * @param {HTMLFormElement} form
 */
function populateFonts(fonts, form = document.forms[0]) {
    const fontUrlInput = $select("[data-font-url]");

    fonts.forEach(({ url, family}, index) => {
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
        if (family === 'Karantina') {
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

function setupTextSettings(){
    [...$selectAll('[data-setting-change')]?.forEach(input => input.addEventListener('change', () => {
        form.requestSubmit();
    }));
    [...$selectAll('[data-setting-input')]?.forEach(input => input.addEventListener('input', () => {
        form.requestSubmit();
    }));

    $id('copy-url').addEventListener('click', (event) => {
        navigator.clipboard.writeText(location.href).then(() => {
            event.target.querySelector('span').textContent = '(Copied!)';
        })
        event.preventDefault();
    })
}

/**
 * Set form data from a saved object
 * @param {Partial<MaskFormData>} defaults
 */
function setFormDefaults(defaults) {
    const form = document.forms[0];

    Object.entries(defaults).forEach(([key, value]) => {
        if (form.elements[key]) {
            form.elements[key].value = value
        }
    })
}
/**
 * this is the single point of update for stage content
 * @typedef {{
 *    fontFamily: string, fontUrl: string, line1: string, line2: string, line3: string, mediaItem: string, mediaType: string,
 *    fontSize: string, letterSpacing: string, lineSpacing: string, textRotation: string, textOutline: string, textOutlineColor: string,
 *    textDir: 'rtl' | 'ltr', textAlign: 'left' | 'right' | 'center', stageBackground: string, textBlendMode: string
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
        setupStage(data.stageBackground);

        // Update URL without reloading
        if (history.pushState) {
            const dataAsString = [...formData.entries()].map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
            var newurl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${dataAsString}`;
            window.history.pushState({path:newurl},'',newurl);
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

/**
 * Start here
 */
async function init() {
    const { fonts, media } = await getConfig();
    const defaults = getSettingsFromUrl();
    loadWebFonts(fonts);
    populateFonts(fonts);
    populateMedia(media);
    setupTextSettings();
    setFormDefaults(defaults);
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
