/**
 * Path parsing utils
 * based on:
 * https://github.com/michaelrhodes/scale-svg-path
 * https://github.com/jkroso/serialize-svg-path
 * https://github.com/jkroso/parse-svg-path
 * https://github.com/jkroso/abs-svg-path
 * https://github.com/jkroso/rel-svg-path
 */

/**
 * expected argument lengths
 * @type {object}
 */
const length = { a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0 };
/**
 * segment pattern
 * @type {RegExp}
 */
const segment = /([astvzqmhlc])([^astvzqmhlc]*)/gi;
/**
 * number pattern
 * @type {RegExp}
 */
const number = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/gi;

const parseValues = (args) => (args.match(number) || []).map(Number);

/**
 * parse an svg path data string. Generates an Array
 * of commands where each command is an Array of the
 * form `[command, arg1, arg2, ...]`
 *
 * @param {string} path
 * @return {array[]}
 */
export function parse(path) {
    const data = [];
    path.replace(segment, function (_, command, args) {
        var type = command.toLowerCase();
        args = parseValues(args);

        // overloaded moveTo
        if (type == 'm' && args.length > 2) {
            data.push([command].concat(args.splice(0, 2)));
            type = 'l';
            command = command == 'm' ? 'l' : 'L';
        }

        while (true) {
            if (args.length == length[type]) {
                args.unshift(command);
                return data.push(args);
            }
            if (args.length < length[type]) throw new Error('malformed path data');
            data.push([command].concat(args.splice(0, length[type])));
        }
    });
    return data;
}

/**
 * convert parsed path to a string
 * @param {array[]} segments
 * @return {string}
 */
export function serialize(segments) {
    return segments.reduce((str, seg) => str + seg[0] + seg.slice(1).join(','), '');
}

/**
 *
 * @param {array[]} segments parsed path
 * @param {number} sx scale X pactor
 * @param {number} sy scale y factor
 * @returns {array[]}
 */
export function scaleSegments(segments, sx, sy) {
    sy = !sy && sy !== 0 ? sx : sy;

    return segments.map((segment) => {
        const name = segment[0].toLowerCase();

        // V & v are the only command, with shifted coords parity
        if (name === 'v') {
            segment[1] *= sy;
            return segment;
        }

        // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        // touch rx, ry, x, y only
        if (name === 'a') {
            segment[1] *= sx;
            segment[2] *= sy;
            segment[6] *= sx;
            segment[7] *= sy;
            return segment;
        }

        // All other commands have [cmd, x1, y1, x2, y2, x3, y3, ...] format
        return segment.map((val, i) => {
            if (!i) {
                return val;
            }
            return (val *= i % 2 ? sx : sy);
        });
    });
}

/**
 * define `path` using relative points
 *
 * @param {Array} path
 * @return {Array}
 */

export function relative(path) {
    let startX = 0;
    let startY = 0;
    let x = 0;
    let y = 0;

    return path.map(seg => {
        seg = [...seg];
        let type = seg[0];
        const command = type.toLowerCase();

        // is absolute
        if (type != command) {
            seg[0] = command;
            switch (type) {
                case 'A':
                    seg[6] -= x;
                    seg[7] -= y;
                    break;
                case 'V':
                    seg[1] -= y;
                    break;
                case 'H':
                    seg[1] -= x;
                    break;
                default:
                    for (let i = 1; i < seg.length;) {
                        seg[i++] -= x;
                        seg[i++] -= y;
                    }
            }
        }

        // update cursor state
        switch (command) {
            case 'z':
                x = startX;
                y = startY;
                break;
            case 'h':
                x += seg[1];
                break;
            case 'v':
                y += seg[1];
                break;
            case 'm':
                x += seg[1];
                y += seg[2];
                startX += seg[1];
                startY += seg[2];
                break;
            default:
                x += seg[seg.length - 2];
                y += seg[seg.length - 1];
        }

        return seg;
    });
}

/**
* redefine `path` with absolute coordinates
*
* @param {Array} path
* @return {Array}
*/

export function absolute(path) {
    let startX = 0;
    let startY = 0;
    let x = 0;
    let y = 0;

    return path.map(seg => {
        seg = [...seg];
        let type = seg[0];
        const command = type.toUpperCase();

        // is relative
        if (type != command) {
            seg[0] = command;
            switch (type) {
                case 'a':
                    seg[6] += x;
                    seg[7] += y;
                    break;
                case 'v':
                    seg[1] += y;
                    break;
                case 'h':
                    seg[1] += x;
                    break;
                default:
                    for (let i = 1; i < seg.length;) {
                        seg[i++] += x;
                        seg[i++] += y;
                    }
            }
        }

        // update cursor state
        switch (command) {
            case 'Z':
                x = startX;
                y = startY;
                break;
            case 'H':
                x = seg[1];
                break;
            case 'V':
                y = seg[1];
                break;
            case 'M':
                [x, y] = [seg[1], seg[2]];
                [startX, startY] = [x, y];
                break;
            default:
                [x, y] = [seg[seg.length - 2], seg[seg.length - 1]];
        }

        return seg;
    });
}

/**
 *
 * @param {string} path a path string
 * @param {number} sx scale X pactor
 * @param {number} sy scale y factor
 * @returns {string}
 */
export function scalePath(path, sx, sy) {
    return serialize(scaleSegments(parse(path), sx ,sy));
}
