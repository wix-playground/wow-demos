// polyfill for form.requestSubmit in Safari, should be removed when the feature is enabled https://bugs.webkit.org/show_bug.cgi?id=197958
import formRequestSubmitPolyfill from 'https://cdn.skypack.dev/pin/form-request-submit-polyfill@v2.0.0-szOipIemxchOslzcqvLN/mode=imports,min/optimized/form-request-submit-polyfill.js';
import webfontloader from 'https://cdn.skypack.dev/webfontloader';
import { setResizableBoxEvents } from 'https://tombigel.github.io/resize-box/index.js';
import { normalize, reverse } from 'https://cdn.skypack.dev/svg-path-reverse';

import {
    $id,
    $select,
    $selectAll,
    clamp,
    hex2rgba,
    getTempalteItem,
} from '../utils/utils.js';

function setFormEvents(form) {
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
        updateText(data);
    });
    form.requestSubmit();
}
/**
 * @typedef {{
 *    t: string, ff: string, fs: string, frs: boolean, tc: string, ta: string, tva: string,
 *    tsr: boolean
 * }} TextPathFormData
 * @param {data} TextPathFormData
 */
function updateText({
    t: textContent,
    ff: fontFamily,
    fs: fontSize,
    frs: fontResizeWithShape,
    tc: textColor,
    ta: textAlign,
    tva: textVerticalAlign,
    tsr: pathReverse,
}) {
    const text = $id('text-path-text');
    const path = $id('text-path-path');

    if (fontResizeWithShape) {
        text.style.font = `${fontSize}px ${fontFamily}`;
    } else {
        text.style.font = `calc(${fontSize}px * var(--font-scale-factor)) ${fontFamily}`;
    }
    text.style.fill = textColor;
    text.style.dominantBaseline = textVerticalAlign;
    text.textContent = textContent;

    if (pathReverse && !path.dataset.nonReversedD) {
        const d = path.getAttribute('d');
        path.dataset.nonReversedD = d;
        path.setAttribute('d', reverse(normalize(d)));
    } else if (!pathReverse && path.dataset.nonReversedD) {
        path.setAttribute('d', path.dataset.nonReversedD);
        delete path.dataset.nonReversedD;
    }

    setTextAlign(textAlign, path, text);
}

/**
 *
 * @param {string} textAlign
 * @param {SVGPathElement} path
 * @param {SVGTextElement} text
 */
function setTextAlign(textAlign, path, text) {
    const xyMatcher = /scale\(([-\.\d]+),\s?([-\.\d]+)\)/;
    const transform = path.getAttribute('transform') || 'scale(1,1)';
    const [, sx = 1, sy = 1] = transform.match(xyMatcher).map(v => parseFloat(v));

    // TODO: Not accurate, should we just recalc the path?
    const pathLength = path.getTotalLength() * Math.sqrt((sx ** 2 + sy ** 2) / 2);
    const textLength = text.getComputedTextLength();
    text.setAttribute(
        'startOffset',
        textAlign === 'end'
            ? pathLength - textLength
            : textAlign === 'middle'
            ? (pathLength - textLength) / 2
            : 0
    );
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
 * @param {HTMLFormElement} form
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
    const svg = $id('text-svg');
    const path = $id('text-path-path');
    const text = $id('text-path-text');
    const textAlign = document.forms[0].elements['ta'].value;

    const { width: w1, height: h1 } = svg.getBoundingClientRect();
    const { width: w2, height: h2 } = path.getBBox();

    const scale = w1 / h1 / (w2 / h2);
    const d = path.getAttribute('d');

    if (w1 / h1 > w2 / h2) {
        path.setAttribute('transform', `scale(${scale},1)`);
    } else {
        path.setAttribute('transform', `scale(1, ${1 / scale})`);
    }

    // After all the manipulations - measure the exact boundaries and resize the box
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

    // Realign text
    setTextAlign(textAlign, path, text);
}

function setInitialSizes() {
    const svg = $id('text-svg');

    // Get the path only bbox
    const { x, y, width, height } = svg.getBBox();

    // set the viewbox to the path bbox
    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);

    // Set the text scale factor to the ratio between the svg stage size and the viewbox size
    svg.style.setProperty('--font-scale-factor', width / svg.clientWidth);
}

async function init() {
    const form = document.forms[0];
    const { fonts, media } = await getConfig();
    loadWebFonts(fonts);
    setResizableBoxEvents(box, {
        container: $id('result'),
        form,
        onMove,
    });
    populateFontsList(fonts);
    setFormEvents(form);
    setInitialSizes();
}

/**
 * Not really necesary, but reminds me of the good ol' days.
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
