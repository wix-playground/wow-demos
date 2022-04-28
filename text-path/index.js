// polyfill for form.requestSubmit in Safari, should be removed when the feature is enabled https://bugs.webkit.org/show_bug.cgi?id=197958
import formRequestSubmitPolyfill from 'https://cdn.skypack.dev/pin/form-request-submit-polyfill@v2.0.0-szOipIemxchOslzcqvLN/mode=imports,min/optimized/form-request-submit-polyfill.js';
import webfontloader from 'https://cdn.skypack.dev/webfontloader';
import { setResizableBoxEvents } from 'https://tombigel.github.io/resize-box/index.js';
import { urlToForm, formToUrl } from 'https://tombigel.github.io/form-to-url-to-form/index.js';
import SvgPathCommander from 'https://cdn.skypack.dev/svg-path-commander';
import gsap from 'https://cdn.skypack.dev/gsap';

import { $id, $select, $selectAll, clamp, hex2rgba, getTempalteItem } from '../utils/utils.js';

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
        updateAnimation(data);
        formToUrl(form);
    });

    console.log('Initial form submit');
    form.requestSubmit();
}
/**
 * @typedef {{
 *    t: string, ff: string, fs: string, frs: boolean, tc: string, ta: string, tva: string,
 *    rp: boolean, pi: string, at: 'smil' | 'js', adi: 'b' | 'f' | 'fb', ad: string, ar: string, as: boolean
 * }} TextPathFormData
 * @param {TextPathFormData} data
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

    text.style.letterSpacing = `${textLetterSpacing}pt`;

    const pathLength = path.getTotalLength();
    const baseTextLength = text.getComputedTextLength();
    const textLength = baseTextLength + (pathLength - baseTextLength) * textLetterSpread;
    const baseOffset =
        textAlign === 'end' ? pathLength - textLength : textAlign === 'middle' ? (pathLength - textLength) / 2 : 0;
    text.setAttribute('startOffset', baseOffset + textOffsetX);
    text.style.dominantBaseline = textVerticalAlign;
    text.style.baselineShift = `${textOffsetY}`;
    text.textLength.baseVal.value = textLength;
    text.style.direction = textDirection === 'rtl' ? textDirection : '';
    text.style.textAnchor = textDirection === 'rtl' ? 'end' : '';
}

/**
 * @param {TextPathFormData} data
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
function setSizes() {
    const svg = $id('text-svg');
    // const path = $id('text-path-path');
    const text = $id('text-path-text');

    // Hide the text for bbox calculation
    text.style.display = 'none';

    // Get the path only bbox
    const { x, y, width, height } = svg.getBBox();

    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);

    // Set the text scale factor to the ratio between the svg stage size and the viewbox size
    svg.style.setProperty('--font-scale-factor', width / svg.clientWidth);

    // Show the text
    text.style.display = '';
}

/**
 * @param {TextPathFormData} data
 */
function updateAnimation({
    at: animationType,
    adi: animationDirection,
    ad: animationDuration,
    ar: animationRepeat,
    as: animationSeamless,
}) {
    animationDuration = +animationDuration;
    animationRepeat = +animationRepeat;

    const play = $id('play-btn');
    const pause = $id('pause-btn');

    const path = $id('text-path-path');
    const text = $id('text-path-text');

    let animation = $id('text-path-animation');

    let startOffset = text.startOffset.baseVal.value;
    let seemlessOffset = 0;
    const textLength = text.textLength.baseVal.value;
    const pathLength = path.getTotalLength();
    const duration = animationDirection === 'fb' ? animationDuration * 2 : animationDuration;
    const textDuplications = Math.ceil((pathLength * 2) / textLength);

    if (animationSeamless) {
        startOffset = animationDirection !== 'b' ? 0 : pathLength - textLength;
        seemlessOffset = animationDirection !== 'b' ? pathLength : textLength;

        text.textContent = [...Array(textDuplications)].fill(text.textContent).join(' ');
        text.textLength.baseVal.value = textLength * textDuplications;
        text.startOffset.baseVal.value = 0;
    }

    if (state.timeline) {
        state.timeline.pause();
        state.timeline.kill();
        state.timeline.clear();
        state.timeline = null;
    }

    if (animation) {
        text.removeChild(animation);
    }

    if (animationType === 'smil') {
        animation = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animation.setAttribute('id', 'text-path-animation');

        const values = [];
        if (animationDirection === 'f') {
            values.push(startOffset - seemlessOffset);
            values.push(pathLength - seemlessOffset);
        } else if (animationDirection === 'b') {
            values.push(startOffset - seemlessOffset);
            values.push(-textLength - seemlessOffset);
        } else {
            values.push(startOffset - seemlessOffset);
            values.push(pathLength - seemlessOffset);
            values.push(startOffset - seemlessOffset);
        }
        animation.setAttribute('values', values.join(';'));
        animation.setAttribute('attributeName', 'startOffset');
        animation.setAttribute('fill', 'freeze');
        animation.setAttribute('restart', 'always');
        animation.setAttribute('dur', `${duration}ms`);
        animation.setAttribute('repeatCount', animationRepeat === -1 ? 'indefinite' : animationRepeat);
        text.appendChild(animation);
    } else if (animationType === 'js') {
    }
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
    const families = fonts.map(({ family, variant = 400 }) => `${family}:${variant}`);
    webfontloader.load({
        google: {
            families,
        },
        active: function () {
            const form = document.forms[0];
            console.log('Fonts loaded form submit');
            form.requestSubmit();
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
        timeline: null,
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
