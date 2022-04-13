// polyfill for form.requestSubmit in Safari, should be removed when the feature is enabled https://bugs.webkit.org/show_bug.cgi?id=197958
import formRequestSubmitPolyfill from 'https://cdn.skypack.dev/pin/form-request-submit-polyfill@v2.0.0-szOipIemxchOslzcqvLN/mode=imports,min/optimized/form-request-submit-polyfill.js';
import webfontloader from 'https://cdn.skypack.dev/webfontloader';
import { setResizableBoxEvents } from 'https://tombigel.github.io/resize-box/index.js';
import { urlToForm, formToUrl, urlToClipboard } from 'https://tombigel.github.io/form-to-url-to-form/index.js';
import { normalize, reverse } from 'https://cdn.skypack.dev/svg-path-reverse';
import serialize from 'https://cdn.skypack.dev/serialize-svg-path';
import scale from 'https://cdn.skypack.dev/scale-svg-path';
import parse from 'https://cdn.skypack.dev/parse-svg-path';

import {
    $id,
    $select,
    $selectAll,
    clamp,
    hex2rgba,
    getTempalteItem,
} from '../utils/utils.js';

function setFormEvents(form) {
    urlToForm(form);

    [...$selectAll('[data-setting-change')]?.forEach((input) =>
        input.addEventListener('change', () => {
            form.requestSubmit();
        })
    );

    [...$selectAll('[data-setting-input')]?.forEach((input) =>
        input.addEventListener('input', () => {
            form.requestSubmit();
        })
    );

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        console.log(data);

        updatePath(data);
        updateText(data);
        formToUrl(form);
    });

    // Initial setup, stupidly wait 500ms for all fonts etc to load
    setTimeout(() => form.requestSubmit(), 500);
}
/**
 * @typedef {{
 *    t: string, ff: string, fs: string, frs: boolean, tc: string, ta: string, tva: string,
 *    rp: boolean, pi: string
 * }} TextPathFormData
 * @param {data} TextPathFormData
 */
function updateText(data) {
    const {
        t: textContent,
        ff: fontFamily,
        fs: fontSize,
        frs: fontResizeWithShape,
        tsc: textStrokeColor,
        tsw: textStrokeWidth,
        tfc: textFillColor,
        tfo: textFillOpacity,
    } = data;
    const text = $id('text-path-text');

    text.textContent = textContent;

    text.style.font = fontResizeWithShape
        ? `${fontSize}px ${fontFamily}`
        : `calc(${fontSize}px * var(--font-scale-factor)) ${fontFamily}`;

    text.style.fill = textFillColor;
    text.style.fillOpacity = textFillOpacity;
    text.style.stroke = textStrokeColor;
    text.style.strokeWidth = `${textStrokeWidth}px`;

    setTextAlign(data);
}

/**
 *
 * @param {string} textAlign
 */
function setTextAlign({
    ta: textAlign,
    tva: textVerticalAlign,
    tox: textOffsetX,
    toy: textOffsetY,
    tls: textLetterSpacing,
    td: textDirection,
}) {
    textOffsetX = +textOffsetX;
    textOffsetY = +textOffsetY;
    textLetterSpacing = +textLetterSpacing;

    const path = $id('text-path-path');
    const text = $id('text-path-text');

    const pathLength = path.getTotalLength();
    const baseTextLength = text.getComputedTextLength();
    const textLength = baseTextLength + (pathLength - baseTextLength) * textLetterSpacing;
    const baseOffset =
        textAlign === 'end'
            ? pathLength - textLength
            : textAlign === 'middle'
            ? (pathLength - textLength) / 2
            : 0;

    text.setAttribute('startOffset', baseOffset + textOffsetX);
    text.style.dominantBaseline = textVerticalAlign;
    text.style.baselineShift = `${textOffsetY}`;
    text.textLength.baseVal.value = textLength;
    text.style.direction = textDirection === 'rtl' ? textDirection : '';
    text.style.textAnchor = textDirection === 'rtl' ? 'end' : '';
}

/**
 *
 * @param {data} TextPathFormData
 */
function updatePath({
    rp: reversePath,
    pi: pathIndex,
    ss: showShape,
    ssc: shapeStrokeColor,
    ssw: shapeStrokeWidth,
    sfc: shapeFillColor,
    sfo: shapeFillOpacity,
}) {
    pathIndex = +pathIndex;

    const svg = $id('text-svg');
    const path = $id('text-path-path');

    if (state.get('selectedPath') !== pathIndex) {
        const pathItem = state.get('paths')[pathIndex];
        path.setAttribute('d', pathItem.path);
        updatePathState();
    }

    const w1 = svg.clientWidth;
    const h1 = svg.clientHeight;
    const w2 = state.get('originalWidth');
    const h2 = state.get('originalHeight');

    const factor = w1 / h1 / (w2 / h2);

    // Scale the path d, !no transforms!
    let d =
        w1 / h1 > w2 / h2
            ? serialize(scale(parse(state.get('original')), factor, 1))
            : serialize(scale(parse(state.get('original')), 1, 1 / factor));

    // Reverse path if needed
    if (reversePath) {
        d = reverse(normalize(d));
    }

    path.setAttribute('d', d);

    if (showShape) {
        path.style.visibility = '';
        path.style.fill = shapeFillColor;
        path.style.fillOpacity = shapeFillOpacity;
        path.style.stroke = shapeStrokeColor;
        path.style.strokeWidth = `${shapeStrokeWidth}px`;
    } else {
        path.style.visibility = 'hidden';
    }

    // After all the manipulations - measure the exact boundaries and resize the box
    setSizes();
}

/**
 * Set text size and svg viewbox by content size
 */
function setSizes() {
    const svg = $id('text-svg');
    const text = $id('text-path-text');

    // Hide the text for bbox calculation
    text.style.display = 'none';

    // Get the path only bbox
    const { x, y, width, height } = svg.getBBox();

    // set the viewbox to the path bbox
    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);

    // Set the text scale factor to the ratio between the svg stage size and the viewbox size
    svg.style.setProperty('--font-scale-factor', width / svg.clientWidth);

    // Show the text
    text.style.display = '';
}

/**
 * Get configuration from a json file (because we cant natively import json files just yet)
 * @typedef {{fonts: {url: string, family: string, features?: {unicodeRanges: string[]}}[], media: {thumb: string, url: string, type: 'image'|'video'}[]}} ConfigData
 * @returns {Promise<ConfigData>}
 */
async function getConfig() {
    const response = await fetch('./data.json');
    return await response.json();
}

/**
 * Get font list from configuration and build UI + form event
 * @param {ConfigData['fonts']} fonts
 */
function populateFontsList(fonts) {
    fonts.forEach(({ family, defaults }, index) => {
        // Create font item
        const fontItem = getTempalteItem('#font-item-template');
        const content = fontItem.querySelector('[data-font-name]');
        const input = fontItem.querySelector('[data-font-input]');

        input.value = family;
        content.textContent = family;
        content.style.fontFamily = family;

        // Set default
        if (defaults) {
            input.setAttribute('checked', 'checked');
        }

        // Add to document
        $id('fontList').appendChild(fontItem);
    });
}

/**
 * Get font list from configuration and build UI + form event
 * @param {ConfigData['paths']} fonts
 */
function populatePathsList(paths) {
    paths.forEach(({ path, defaults }, index) => {
        const pathItem = getTempalteItem('#path-item-template');
        const thumb = pathItem.querySelector('[data-thumb]');
        thumb.querySelector('path').setAttribute('d', path);

        // Set input values
        const input = pathItem.querySelector('[data-path-input]');
        input.value = index;

        // Set default
        if (defaults) {
            input.setAttribute('checked', 'checked');
        }

        // Add to document
        $id('pathList').appendChild(pathItem);

        // Get the path only bbox
        const { x, y, width, height } = thumb.getBBox();
        // set the viewbox to the path bbox
        thumb.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
    });
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

function onMove(event) {
    const form = document.forms[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Set path size
    updatePath(data);
    // Realign text
    setTextAlign(data);
}

function updatePathState() {
    const path = $id('text-path-path');
    const { width, height } = path.getBBox();

    state.set('original', path.getAttribute('d'));
    state.set('originalWidth', width);
    state.set('originalHeight', height);
}

/**
 * Start here
 */
const state = new Map(
    Object.entries({
        selectedPath: -1,
        paths: [],
        original: '',
        originalWidth: 0,
        originalHeight: 0,
    })
);

async function init() {
    const form = document.forms[0];
    const { fonts, paths } = await getConfig();
    state.set('paths', paths);
    loadWebFonts(fonts);
    populateFontsList(fonts);
    populatePathsList(paths);
    //setSizes();
    setFormEvents(form);
    setResizableBoxEvents(box, {
        container: $id('result'),
        form,
        onMove: onMove,
    });
}

/**
 * Not really necesary, but reminds me of the good ol' days.
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
