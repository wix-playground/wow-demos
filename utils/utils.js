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
 * Limit a number between 2 values, inclusive
 * @param {number} min
 * @param {number} [max]
 * @param {number} num
 * @returns {number}
 */
export const clamp = (min, max = min, num = max) =>
    Math.min(max, Math.max(min, num));

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
export function getTempalteItem(selector) {
   return $select(selector).content.cloneNode(true).firstElementChild;
}


// TODO: PATH TOOLS, Will we use them?

/**
 * https://github.com/michaelrhodes/scale-svg-path
 * @param {array} segments
 * @param {number} sx
 * @param {number} sy
 * @returns
 */
export function scaleSvgPath(segments, sx, sy) {
    sy = (!sy && (sy !== 0)) ? sx : sy

    return segments.map(function(segment) {
      var name  = segment[0].toLowerCase()

      // V & v are the only command, with shifted coords parity
      if (name === 'v') {
        segment[1] *= sy
        return segment
      }

      // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
      // touch rx, ry, x, y only
      if (name === 'a') {
        segment[1] *= sx
        segment[2] *= sy
        segment[6] *= sx
        segment[7] *= sy
        return segment
      }

      // All other commands have [cmd, x1, y1, x2, y2, x3, y3, ...] format
      return segment.map(function(val, i) {
        if (!i) {
          return val
        }
        return val *= i % 2 ? sx : sy
      })
    })
  }

/**
 * expected argument lengths
 * @type {Object}
 */
const length = {a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0}

/**
 * segment pattern
 * @type {RegExp}
 */
const segment = /([astvzqmhlc])([^astvzqmhlc]*)/ig

/**
 * parse an svg path data string. Generates an Array
 * of commands where each command is an Array of the
 * form `[command, arg1, arg2, ...]`
 * @param {String} path
 * @return {Array}
 */
const number = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/ig

function parseValues(args) {
	const numbers = args.match(number)
	return numbers ? numbers.map(Number) : []
}
/**
 * https://github.com/jkroso/parse-svg-path
 * @param {string} path
 * @returns
 */
export function parseSvgPath(path) {
	const data = []
	path.replace(segment, function(_, command, args){
		let type = command.toLowerCase()
		args = parseValues(args)

		// overloaded moveTo
		if (type === 'm' && args.length > 2) {
			data.push([command].concat(args.splice(0, 2)))
			type = 'l'
			command = command === 'm' ? 'l' : 'L'
		}

		while (true) {
			if (args.length == length[type]) {
				args.unshift(command)
				return data.push(args)
			}
			if (args.length < length[type]) throw new Error('malformed path data')
			data.push([command].concat(args.splice(0, length[type])))
		}
	})
	return data
}

/**
 * https://github.com/jkroso/serialize-svg-path
 * convert `path` to a string
 * @param {Array} path
 * @return {String}
 */

export function serializeSvgPath(path){
	return path.reduce(function(str, seg){
		return str + seg[0] + seg.slice(1).join(',')
	}, '')
}
