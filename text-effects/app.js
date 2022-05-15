// polyfill for form.requestSubmit in Safari, should be removed when the feature is enabled https://bugs.webkit.org/show_bug.cgi?id=197958
import formRequestSubmitPolyfill from 'https://cdn.skypack.dev/pin/form-request-submit-polyfill@v2.0.0-szOipIemxchOslzcqvLN/mode=imports,min/optimized/form-request-submit-polyfill.js';
import webfontloader from 'https://cdn.skypack.dev/webfontloader';
import { createDocumentWireframe, makeWireframeElementResizable } from 'https://tombigel.github.io/resize-box/index.js';
import { urlToForm, formToUrl } from 'https://tombigel.github.io/form-to-url-to-form/index.js';
import { scalePath } from './scripts/path-utils.js';
import { setTextToolbarFontList } from './scripts/text-toolbar.js';
import { $id, $selectAll, getTempalteItem, hex2rgba, getRotatedBoundingRectScale, throttle, clamp } from '../utils/utils.js';

const ns = 'http://www.w3.org/2000/svg';

const alignToAnchor = {
    left: 'start',
    center: 'middle',
    right: 'end',
};

function resetStuff() {
    const comp = $id('comp-1');
    const content = comp.querySelector('.content');
    const media = content.querySelector('.media');
    const svg = content.querySelector('.main-svg');
    const text = svg.querySelector('text');
    const textPath = svg.querySelector('textPath');
    const path = svg.querySelector('path');

    svg.style.setProperty('--font-scale-factor', 1);
    text.style.dominantBaseline = '';
    text.style.baselineShift = '';
    textPath?.removeAttributeNS(null, 'startOffset');
    textPath?.removeAttributeNS(null, 'textLength');
    path.setAttributeNS(null, 'd', '');
    media.style.clipPath = '';
    media.hidden = 'hidden';
}

function updateBox({ x, y, w, h }) {
    const comp = $id('comp-1');
    comp.style.top = `${y}px`;
    comp.style.left = `${x}px`;
    comp.style.width = `${w}px`;
    comp.style.height = `${h}px`;
}

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
    shadowOpacity = +shadowOpacity;

    const stage = $id('stage');
    const comp = $id('comp-1');
    const content = comp.querySelector('.content');
    const textarea = $id('text');
    const svg = content.querySelector('.main-svg');
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
    text.style.fontSize = `calc(${size}px * var(--font-scale-factor))`;
    text.style.fontStyle = style ? 'italic' : 'normal';
    text.style.fontWeight = weight ? 'bold' : 'normal';
    text.style.textDecoration = under ? 'underline' : 'none';
    text.style.textAnchor = alignToAnchor[align];
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
    // textarea.style.letterSpacing = `${+spacing / 10}pt`;
    // textarea.style.lineHeight = lineHeight;

    content.style.filter =
        shadowOpacity > 0
            ? `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px ${hex2rgba(shadowColor, shadowOpacity)})`
            : '';
    stage.style.backgroundColor = bgColor;
    stage.style.backgroundImage = /^https?|data|blob/.test(bgImage) ? `url(${bgImage})` : bgImage;
}

function updateMask({
    lh: lineHeight,
    fs: fontSize,
    mi: mediaItem,
    mr: maskRotate,
    mfh: maskFlipH,
    mfv: maskFlipV,
}) {
    maskRotate = +maskRotate;
    const comp = $id('comp-1');
    const content = comp.querySelector('.content');
    const svg = content.querySelector('.main-svg');
    const text = svg.querySelector('text');
    const media = content.querySelector('.media');
    const clipPath = svg.querySelector('clipPath');
    const use = clipPath.querySelector('use');

    media.hidden = '';
    setMedia(content, ...mediaItem.split('|'));

    use.setAttributeNS(null, 'href', `#${text.id}`);
    clipPath.id = `clip-${comp.id}`;
    clipPath.appendChild(use);
    svg.appendChild(clipPath);

    media.style.clipPath = `url(#${clipPath.id})`;
    text.style.fill = 'none';

    const scale = maskRotate ? getRotatedBoundingRectScale(content.offsetWidth, content.offsetHeight, maskRotate) : 1;

    const mediaTransforms = `rotate(${maskRotate}deg) scaleX(${(maskFlipV ? -1 : 1) * scale}) scaleY(${
        (maskFlipH ? -1 : 1) * scale
    })`;
    [...media.children].forEach((el) => (el.style.transform = mediaTransforms));

    setMaskPosition({ lineHeight, fontSize });
}

function updatePath({
    pi: pathIndex,
    pfs: flipSide,
    t: inputText = '',
    ta: align,
    td: dir,
    psw: strokeWidth,
    psc: strokeColor,
    pso: strokeOpacity,
    pfc: fillColor,
    pfo: fillOpacity,
    par: aspectRatio,
    pts: keepTextSize,
    pva: pathVerticalAlign,
    ps: pathTextSpread,
    mox: manualOffsetX,
    moy: manualOffsetY,
}) {
    const comp = $id('comp-1');
    const content = comp.querySelector('.content');
    const text = content.querySelector('.main-svg text');
    const path = content.querySelector('.main-svg path');
    const textPath = document.createElementNS(ns, 'textPath');

    path.id = `path-${comp.id}`;

    textPath.textContent = inputText;
    textPath.setAttributeNS(null, 'href', `#${path.id}`);

    text.replaceChildren(textPath);

    path.style.strokeWidth = `${strokeWidth}px`;
    path.style.stroke = strokeColor;
    path.style.strokeOpacity = strokeOpacity;
    path.style.fill = fillColor;
    path.style.fillOpacity = fillOpacity;

    setPathSize({
        par: aspectRatio,
        pts: keepTextSize,
        pi: pathIndex,
        pfs: flipSide,
        pva: pathVerticalAlign,
        ps: pathTextSpread,
        mox: manualOffsetX,
        moy: manualOffsetY,
        ta: align,
        td: dir,
    });
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

function setMaskPosition() {
    const comp = $id('comp-1');
    const content = comp.querySelector('.content');
    const svg = content.querySelector('.main-svg');
    const text = svg.querySelector('text');
    const use = svg.querySelector('use');

    const { width: cw, height: ch } = content.getBoundingClientRect();
    const { width: tw, height: th } = text.getBoundingClientRect();
    const { x: sx, y: sy, width: sw, height: sh } = svg.getBBox();

    const scale = cw / ch < sw / sh ? cw / sw : ch / sh;
    const x = (((cw - tw) / 2) * 1) / scale - sx;
    const y = (((ch - th) / 2) * 1) / scale - sy;
    use.setAttributeNS(null, 'transform', `scale(${scale}) translate(${x} ${y})`);
}

function setPathSize({
    par: aspectRatio,
    pts: keepTextSize,
    pi: pathIndex,
    pfs: flipSide,
    pva: pathVerticalAlign,
    ps: pathTextSpread,
    mox: manualOffsetX,
    moy: manualOffsetY,
    ta: align,
    td: dir,
}) {
    manualOffsetX = +manualOffsetX
    manualOffsetY = +manualOffsetY
    pathTextSpread = +pathTextSpread

    const d = $id(`${flipSide ? 'htap' : 'path'}-${pathIndex}`).getAttributeNS(null, 'd');

    const comp = $id('comp-1');
    const content = comp.querySelector('.content');
    const svg = content.querySelector('.main-svg');
    const path = svg.querySelector('path');
    const text = svg.querySelector('text');
    const textPath = svg.querySelector('textPath');

    path.setAttributeNS(null, 'd', d);

    const { width, height } = path.getBBox();
    const pathAspect = width / height;
    const contentAspect = content.offsetWidth / content.offsetHeight;
    const scaleX = contentAspect > pathAspect;
    const scale = scaleX ? contentAspect / pathAspect : pathAspect / contentAspect;

    const fontScaleBySide = scaleX ? height / svg.clientHeight : width / svg.clientWidth;
    const fontScaleFactor = keepTextSize ? fontScaleBySide : 1;

    svg.style.setProperty('--font-scale-factor', fontScaleFactor);

    path.setAttributeNS(null, 'd', aspectRatio ? d : scalePath(d, scaleX ? scale : 1, scaleX ? 1 : scale));

    // Override viewBox
    const { x, y, width: w, height: h } = path.getBBox();
    svg.setAttributeNS(null, 'viewBox', `${x} ${y} ${w} ${h}`);

    // Text aligmnets
    const pathLength = path.getTotalLength();
    const baseTextLength = text.getComputedTextLength();
    const textLength = baseTextLength + (pathLength - baseTextLength) * pathTextSpread;
    const baseOffset =
        align === 'right' ? pathLength - textLength : align === 'center' ? (pathLength - textLength) / 2 : 0;
        textPath.setAttribute('startOffset', baseOffset + manualOffsetX);
        textPath.textLength.baseVal.value = textLength;
        text.style.dominantBaseline = pathVerticalAlign;
        text.style.baselineShift = manualOffsetY;
        text.style.textAnchor = dir === 'rtl' ? 'end' : 'start';
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
        const effect = data.we;

        console.log(data);

        resetStuff();
        updateBox(data);
        updateText(data);
        effect === 'mask' && updateMask(data);
        effect === 'path' && updatePath(data);
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
    media.forEach(({ url, thumb, selected, type }, index) => {
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
        if (selected) {
            input.setAttribute('checked', 'checked');
        }

        // Add to document
        $id('media-list').appendChild(mediaItem);
    });
}

/**
 * Get paths list from configuration and build UI + form event
 * @param {ConfigData['paths']} media
 */
function setPathsList(paths) {
    paths.forEach(({ path, htap, selected }, index) => {
        const item = getTempalteItem('#media-item-path-template');
        const svg = item.querySelector('svg');
        const normal = item.querySelector('path.normal');
        const reversed = item.querySelector('path.reversed');
        const input = item.querySelector('input');
        normal.setAttributeNS(null, 'd', path);
        reversed.setAttributeNS(null, 'd', htap);
        normal.id = `path-${index}`;
        reversed.id = `htap-${index}`;
        input.value = index;

        // Set default
        if (selected) {
            input.setAttribute('checked', 'checked');
        }

        // Add to document
        $id('path-list').appendChild(item);

        // set the viewbox to the path bbox
        const { x, y, width, height } = normal.getBBox();
        svg.setAttributeNS(null, 'viewBox', `${x} ${y} ${width} ${height}`);
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
    if (data.we === 'mask') {
        setMaskPosition();
    }

    if (data.we === 'path') {
        setPathSize(data);
    }

    const comp = $id('comp-1');
    const {top, left, width, height} = comp.style;

    form.x.value = parseInt(left, 10);
    form.y.value = parseInt(top, 10);
    form.w.value = parseInt(width, 10);
    form.h.value = parseInt(height, 10);
}

function onEnd() {
    const form = document.forms[0];
    formToUrl(form, { replace: true });
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
    const { paths, media, fonts } = await getConfig();
    loadWebFonts(fonts);
    setTextToolbarFontList(fonts);
    setMediaList(media);
    setPathsList(paths);
    setFormEvents(form);
    createDocumentWireframe('.comp').forEach((wire) =>
        makeWireframeElementResizable(wire, {
            container: 'stage',
            onMove: onMove,
            onEnd: onEnd,
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
