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
