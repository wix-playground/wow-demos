// polyfill for form.requestSubmit in Safari, should be removed when the feature is enabled https://bugs.webkit.org/show_bug.cgi?id=197958
import formRequestSubmitPolyfill from 'https://cdn.skypack.dev/pin/form-request-submit-polyfill@v2.0.0-szOipIemxchOslzcqvLN/mode=imports,min/optimized/form-request-submit-polyfill.js';
import webfontloader from 'https://cdn.skypack.dev/webfontloader';
import { setResizableBoxEvents } from 'https://tombigel.github.io/resize-box/index.js';
import {
    urlToForm,
    formToUrl,
} from 'https://tombigel.github.io/form-to-url-to-form/index.js';
import SvgPathCommander from 'https://cdn.skypack.dev/svg-path-commander';

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
    tll: textLetterSpread,
    td: textDirection,
}) {
    textOffsetX = +textOffsetX;
    textOffsetY = +textOffsetY;
    textLetterSpacing = +textLetterSpacing;
    textLetterSpread = +textLetterSpread;

    const path = $id('text-path-path');
    const text = $id('text-path-text');

    text.style.letterSpacing =`${textLetterSpacing}pt`;

    const pathLength = path.getTotalLength();
    const baseTextLength = text.getComputedTextLength();
    const textLength =
        baseTextLength + (pathLength - baseTextLength) * textLetterSpread;
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
    fxp: flipXPath,
    fyp: flipYPath,
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
    const pathItem = state.get('paths')[pathIndex];

    const instance = new SvgPathCommander(pathItem.path);

    const boxAspect = svg.clientWidth / svg.clientHeight;

    const { width, height } = SvgPathCommander.getPathBBox(instance.segments);
    const pathAspect = width / height;
    const factor = boxAspect / pathAspect;

    // Scale the path
    instance.transform({
        scale: boxAspect > pathAspect ? [factor, 1] : [1, 1 / factor],
        origin: [0, 0],
    });

    // Reverse path if needed
    if (reversePath) {
        instance.reverse();
    }

    // Reverse path if needed
    if (flipXPath) {
        instance.flipX();
        // instance.transform({ rotate: [180, 0, 0], origin: [0, 0] });
    }

    // Reverse path if needed
    if (flipYPath) {
        instance.flipY();
        // instance.transform({ rotate: [0, 180, 0], origin: [0, 0] });
    }

    path.setAttribute('d', instance.toString());

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
    setSizes(instance.toString());
}

/**
 * Set text size and svg viewbox by content size
 */
function setSizes(d) {
    const svg = $id('text-svg');
    const path = $id('text-path-path');
    const text = $id('text-path-text');
    // const box = $id('box');

    // Hide the text for bbox calculation
    text.style.display = 'none';

    // Get the path only bbox
    const { x, y, width, height } = svg.getBBox();

    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);

    // const pathRatio = pathBox.width / pathBox.height;
    // const boxRatio = box.offsetWidth / box.offsetHeight;


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

/**
 * Start here
 */
const state = new Map(
    Object.entries({
        selectedPath: -1,
        paths: [],
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
