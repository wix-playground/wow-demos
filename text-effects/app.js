// polyfill for form.requestSubmit in Safari, should be removed when the feature is enabled https://bugs.webkit.org/show_bug.cgi?id=197958
import formRequestSubmitPolyfill from 'https://cdn.skypack.dev/pin/form-request-submit-polyfill@v2.0.0-szOipIemxchOslzcqvLN/mode=imports,min/optimized/form-request-submit-polyfill.js';
import webfontloader from 'https://cdn.skypack.dev/webfontloader';
import { createDocumentWireframe, makeWireframeElementResizable } from 'https://tombigel.github.io/resize-box/index.js';
import { urlToForm, formToUrl } from 'https://tombigel.github.io/form-to-url-to-form/index.js';
import SvgPathCommander from 'https://cdn.skypack.dev/svg-path-commander';
import { setTextToolbarFontList } from './scripts/text-toolbar.js';
import { $id, $select, $selectAll, clamp, hex2rgba, throttle } from '../utils/utils.js';

function updateText({
    fc: color,
    ff: family,
    fs: size,
    fst: style,
    fu: under,
    fw: weight,
    ta: align,
    td: dir,
    t: text,
}) {
    const content = $id('comp-1').querySelector('.content');
    const textarea = $id('text');
    content.textContent = text;
    content.style.color = color;
    content.style.fontFamily = family;
    content.style.fontSize = `${size}px`;
    content.style.fontStyle = style ? 'italic' : 'normal';
    content.style.fontWeight = weight ? 'bold' : 'normal';
    content.style.textDecoration = under ? 'underline' : 'none';
    content.style.textAlign = align;
    content.style.direction = dir;

    textarea.style.textAlign = align;
    textarea.style.direction = dir;
}
function setFormEvents(form) {
    urlToForm(form);

    [...$selectAll('[data-setting-change')]?.forEach((input) =>
        input.addEventListener('change', () => {
            form.requestSubmit();
        })
    );

    const throttledFormSubmit = throttle(() => {
        form.requestSubmit();
    }, 250);

    [...$selectAll('[data-setting-input')]?.forEach((input) => {
        input.addEventListener('input', throttledFormSubmit);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        console.log(data);
        updateText(data);

        formToUrl(form);
    });

    console.log('Initial form submit');
    form.requestSubmit();
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

async function init() {
    const form = document.forms[0];
    const { fonts } = await getConfig();
    loadWebFonts(fonts);
    setTextToolbarFontList(fonts);
    setFormEvents(form);
    createDocumentWireframe('.comp').forEach((wire) =>
        makeWireframeElementResizable(wire, {
            container: 'stage',
            onMove: onMove,
        })
    );
}

/**
 * Not really necesary, but reminds me of the good ol' days.
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
