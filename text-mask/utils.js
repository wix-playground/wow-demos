export const $id = (id) => document.getElementById(id);
export const $select = (selector) => document.querySelector(selector);
export const $selectAll = (selector) => document.querySelectorAll(selector);
/**
 * Limit a number between 2 values, inclusive
 * @param {number} min
 * @param {number} max
 * @param {number} num
 * @returns {number}
 */
export function clamp(min, max, num) {
    return Math.min(max, Math.max(min, num));
}

/**
 * From https://stackoverflow.com/a/51564734
 * @param {string} hex #9ABCDEF or 9ABCDEF
 * @param {number} alpha 0 to 1
 * @returns {string} rgba() css color string
 */
const hex2rgba = (hex, alpha = 1) => {
    const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
};
