/**
 * Shorthand to getElementById
 * @param {string} id
 * @returns {Element | null}
 */
export const $id = (id) => document.getElementById(id);

/**
 * Shorthand to document.querySelector
 * @param {string} selector
 * @returns {Element | null}
 */
export const $select = (selector) => document.querySelector(selector);

/**
 * Shorthand to document.querySelectorAll
 * @param {string} selector
 * @returns {Element[] | null}
 */
export const $selectAll = (selector) => document.querySelectorAll(selector);

/**
 * Limit a number between 2 values, inclusive, order doesn't matter
 * @param {number} n1
 * @param {number} n2
 * @param {number} n3
 * @returns {number}
 */
export const clamp = (n1, n2 = n1, n3 = n2) => {
    const [min, num, max] = [n1, n2, n3].sort((a, b) => a - b);
    return Math.min(max, Math.max(min, num));
};

/**
 * Round with decimal precision, default round to integer
 * @param {number} num
 * @param {number} [precision=0]
 * @returns {number}
 */
export const round = (num, precision = 0) => +num.toFixed(precision);
/**
 * From https://stackoverflow.com/a/51564734
 * @param {string} hex #FFFFFF, #FFF, FFFFFF or FFF
 * @param {number} alpha 0 to 1
 * @returns {string} rgba() css color string
 */
export const hex2rgba = (hex, alpha = 1) => {
    const [r, g, b] = hex.match(hex.length > 4 ? /\w\w/g : /\w/g).map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * get an html template from the dom by a selector
 * @param {string} selector
 * @returns {HTMLElement}
 */
export function getTemplateItem(selector) {
    return $select(selector).content.cloneNode(true).firstElementChild;
}

/**
 * Delay the execution of a function until it hasen't been called a defined amount of time
 */
export function debounce(fn, delay = 100) {
    let timeoutId;

    return (...args) => {
        timeoutId && clearTimeout(timeoutId);
        timeoutId = setTimeout(function () {
            fn(...args);
        }, delay);
    };
}

/**
 * Limit the number of times a function can execute withing a defined amount of time
 * @param {(...args: any[]) => any} fn
 * @param {number} [wait=100]
 * @param {{trailing: boolean, leading: boolean}} [options = {trailing:true, leading:true}]
 * @returns
 */
export function throttle(fn, wait = 100, { trailing = true, leading = true } = {}) {
    let time = leading ? 1 : null;
    let timeoutId;

    return (...args) => {
        timeoutId && clearTimeout(timeoutId);

        if (time && Date.now() > time + wait) {
            fn(...args);
            time = Date.now();
        } else {
            timeoutId = setTimeout(function () {
                trailing && fn(...args);
                time = leading ? Date.now() : null;
            }, wait);
        }
    };
}

/**
 * Generate a UUID, using crypto with a simple fallback.
 * @returns {string} in a UUID format
 */
const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
const randomUUIDDumbPolyfill = () => `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
export const randomId = () => crypto.randomUUID?.() || randomUUIDDumbPolyfill();

/**
 * @param {number} angleInDeg
 * @returns
 */
export const deg2rad = (angleInDeg) => (angleInDeg * Math.PI) / 180;
/**
 * Calculate the scale needed for a rotated element to cover its old bounds
 * @param {number} width
 * @param {number} height
 * @param {number} angleInDeg
 * @returns
 */
export function getRotatedBoundingRectScale(width, height, angleInDeg) {
    const angleInRad = deg2rad(angleInDeg);
    const newHeight = width * Math.abs(Math.sin(angleInRad)) + height * Math.abs(Math.cos(angleInRad));
    const newWidth = width * Math.abs(Math.cos(angleInRad)) + height * Math.abs(Math.sin(angleInRad));

    return Math.max(newHeight / height, newWidth / width);
}

/**
 * Map a value from one range 'a' to different range 'b'
 * @param {number} a1
 * @param {number} a2
 * @param {number} b1
 * @param {number} b2
 * @param {number} num
 * @returns number
 */
export function mapRange(a1, a2, b1, b2, num) {
    return ((num - a1) * (b2 - b1)) / (a2 - a1) + b1;
}
