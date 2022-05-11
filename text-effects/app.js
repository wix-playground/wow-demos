// polyfill for form.requestSubmit in Safari, should be removed when the feature is enabled https://bugs.webkit.org/show_bug.cgi?id=197958
import formRequestSubmitPolyfill from 'https://cdn.skypack.dev/pin/form-request-submit-polyfill@v2.0.0-szOipIemxchOslzcqvLN/mode=imports,min/optimized/form-request-submit-polyfill.js';
import webfontloader from 'https://cdn.skypack.dev/webfontloader';
import { createDocumentWireframe, makeWireframeElementResizable } from 'https://tombigel.github.io/resize-box/index.js';
import { urlToForm, formToUrl } from 'https://tombigel.github.io/form-to-url-to-form/index.js';
import SvgPathCommander from 'https://cdn.skypack.dev/svg-path-commander';
import { setTextToolbarFontList } from './scripts/text-toolbar.js';
import { $id, $select, $selectAll, getTempalteItem, hex2rgba, throttle } from '../utils/utils.js';

const ns = 'http://www.w3.org/2000/svg';
function updateText({
    fc: color,
    ff: family,
    fs: size,
    fst: style,
    fu: under,
    fw: weight,
    ta: align,
    td: dir,
    t: inputText = '',
    ls: spacing,
    lh: lineHeight,
    oc: outlineColor,
    os: outlineSize,
    sx: shadowX,
    sy: shadowY,
    sb: shadowBlur,
    sc: shadowColor,
    so: shadowOpacity,
    bm: blendMode,
    bc: bgColor,
    bi: bgImage = '',
}) {
    const stage = $id('stage');
    const comp = $id('comp-1');
    const content = comp.querySelector('.content');
    const textarea = $id('text');
    const svg = content.querySelector('svg');
    const text = svg.querySelector('text');
    text.id = `text-${comp.id}`;
    text.replaceChildren(
        ...inputText.split(/\n/g).map((line) => {
            const tspan = document.createElementNS(ns, 'tspan');
            tspan.textContent = line;
            tspan.setAttributeNS(null, 'x', '0');
            tspan.setAttributeNS(null, 'dy', `${lineHeight}em`);
            return tspan;
        })
    );

    text.style.fill = color;
    text.style.fontFamily = family;
    text.style.fontSize = `${size}px`;
    text.style.fontStyle = style ? 'italic' : 'normal';
    text.style.fontWeight = weight ? 'bold' : 'normal';
    text.style.textDecoration = under ? 'underline' : 'none';
    text.style.textAlign = align;
    text.style.direction = dir;
    text.style.letterSpacing = `${spacing}px`;
    text.style.lineHeight = lineHeight;
    text.style.stroke = outlineColor;
    text.style.strokeWidth = outlineSize;
    text.style.overflow = 'visible';

    const { x, y, width, height } = text.getBBox();
    svg.setAttributeNS(null, 'viewBox', `${x} ${y} ${width} ${height}`);

    comp.style.mixBlendMode = blendMode;

    textarea.style.textAlign = align;
    textarea.style.direction = dir;
    textarea.style.letterSpacing = `${+spacing / 10}pt`;
    textarea.style.lineHeight = lineHeight;

    shadowOpacity = +shadowOpacity;
    text.style.filter = shadowOpacity > 0
        ? `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px ${hex2rgba(shadowColor, shadowOpacity)})`
        : (content.style.filter = '');
    stage.style.backgroundColor = bgColor;
    stage.style.backgroundImage = /^https?|data|blob/.test(bgImage) ? `url(${bgImage})` : bgImage;
}

function updateMask({ lh: lineHeight, fs: fontSize, wm: maskOn, mi: mediaItem, mr: maskRotate, mfh: maskFlipH, mfv: maskFlipv, ms: maskSkew }) {
    const comp = $id('comp-1');
    const content = comp.querySelector('.content');
    const svg = content.querySelector('svg');
    const text = svg.querySelector('text');

    if (maskOn) {
        setMedia(content, ...mediaItem.split('|'));
        const clipPath = svg.querySelector('clipPath');
        const use = clipPath.querySelector('use');

        use.setAttributeNS(null, 'href', `#${text.id}`);
        use.setAttributeNS(null, 'transform', `scale(${content.getBoundingClientRect().width / svg.getBBox().width})`);
        clipPath.id = `clip-${comp.id}`;
        clipPath.appendChild(use);

        svg.appendChild(clipPath);

        const video = content.querySelector('video');
        const image = content.querySelector('img');

        video.style.clipPath = `url(#${clipPath.id})`;
        image.style.clipPath = `url(#${clipPath.id})`;
        text.style.fill = 'none';
        setMaskPosition({lineHeight, fontSize});
    }
}

/**
 * Set media to stage
 * @param {MaskFormData} data
 */
function setMedia(content, url, type) {
    const video = content.querySelector('video');
    const image = content.querySelector('img');

    image.setAttribute('hidden', 'hidden');
    video.setAttribute('hidden', 'hidden');

    if (image.src) {
        image.removeAttribute('src');
    }
    if (video.src) {
        video.pause();
        video.removeAttribute('src'); // empty source
        video.load();
    }

    if (type === 'video') {
        video.setAttribute('loop', 'loop');
        video.setAttribute('autoplay', 'autoplay');
        video.setAttribute('playsinline', 'playsinline');
        video.removeAttribute('hidden');
        video.muted = 'muted';
        video.src = url;
        video.onload = () => video.play();
    } else if (type === 'image') {
        image.removeAttribute('hidden');
        image.src = url;
    }
}

function setMaskPosition({lineHeight, fontSize}) {
    const comp = $id('comp-1');
    const content = comp.querySelector('.content');
    const svg = content.querySelector('svg');
    const text = svg.querySelector('text');
    const use = svg.querySelector('use');

    const { width: cw, height: ch } = content.getBoundingClientRect();
    const { width: tw, height: th } = text.getBoundingClientRect();
    const { y: sy, width: sw, height: sh } = svg.getBBox();

    const scale = cw / ch < sw / sh ? cw / sw : ch / sh;
    const x = (((cw - tw) / 2) * 1) / scale;
    const y = (((ch - th) / 2) * 1) / scale - sy;
    use.setAttributeNS(null, 'transform', `scale(${scale}) translate(${x} ${y})`);
}
function setFormEvents(form) {
    urlToForm(form);

    const throttledSubmit = throttle(() => form.requestSubmit(), 50);

    [...$selectAll('[data-setting-change')]?.forEach((input) =>
        input.addEventListener('change', () => {
            throttledSubmit();
        })
    );
    [...$selectAll('[data-setting-input')]?.forEach((input) =>
        input.addEventListener('input', () => {
            throttledSubmit();
        })
    );

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        console.log(data);
        updateText(data);
        updateMask(data);
        formToUrl(form, { replace: true });
    });

    console.log('Initial form submit');
    form.requestSubmit();
}
/**
 * Get media list from configuration and build UI + form event
 * @param {ConfigData['media']} media
 * @param {HTMLFormElement} form
 */
function setMediaList(media) {
    media.forEach(({ url, thumb, isDefault, type }, index) => {
        let mediaItem;

        // Create image item
        if (type === 'image') {
            mediaItem = getTempalteItem('#media-item-image-template');

            const image = mediaItem.querySelector('img');
            image.src = thumb;
        }
        // or - Create video item
        else if (type === 'video') {
            mediaItem = getTempalteItem('#media-item-video-template');

            const video = mediaItem.querySelector('video');
            video.src = thumb;
            video.addEventListener('mouseenter', () => video.play());
            video.addEventListener('mouseleave', () => video.pause());
        }

        // Set input values
        const input = mediaItem.querySelector('input');
        input.value = [url, type].join('|');

        // Set default
        if (isDefault) {
            input.setAttribute('checked', 'checked');
        }

        // Add to document
        $id('media-list').appendChild(mediaItem);
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

    // Resize clipPath for mask
    if (data.wm) {
        setMaskPosition({fontSize: data.fs, lineHeight: data.lh});
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

async function init() {
    const form = document.forms[0];
    const { media, fonts } = await getConfig();
    loadWebFonts(fonts);
    setTextToolbarFontList(fonts);
    setMediaList(media);
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
