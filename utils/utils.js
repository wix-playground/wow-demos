/**
 * Shorthand to getElementById
 * @param {string} id
 * @returns {Element | null}
 */
export const $id = (id) => document.getElementById(id);

/**
 * Shorthand to document.querySelector
 * @param {string} id
 * @returns {Element | null}
 */
export const $select = (selector) => document.querySelector(selector);

/**
 * Shorthand to document.querySelectorAll
 * @param {string} id
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
    const [min, num, max] = [n1, n2, n3].sort((a, b)=>  a - b);
    return Math.min(max, Math.max(min, num));
}

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
    const [r, g, b] = hex
        .match(hex.length > 4 ? /\w\w/g : /\w/g)
        .map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * get an html template from the dom by a selector
 * @param {string} selector
 * @returns {HTMLElement}
 */
export function getTempalteItem(selector) {
    return $select(selector).content.cloneNode(true).firstElementChild;
}
