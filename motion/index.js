import { getAdjustedDirection, getClipPolygonParams } from './utils.js';

function getCssCode (rotation, name, data) {
    const { parent, animations } = data;

    return `
                --rectTop: ${rectTop}px;
                --rectBottom: ${rectBottom}px;
                --rectLeft: ${rectLeft}px;
                --rectRight: ${rectRight}px;
                --rectWidth: ${rectWidth}px;

                --rotation: ${rotation}deg;

                ${animations.map(({ frames }, index) => (`@keyframes ${animations.length > 1 ? `${name}-${index}` : name} {
                    ${Object.entries(frames).map(([offset, props]) => (`${offset} {
                        ${props}
                    }`)).join(`
                    `)}
                }`)).join(`

                `)}

                #component {
                    animation: ${animations.map(({ easing, duration, delay, part }, index) => (
                        part ? '' : `${animations.length > 1
                            ? `${name}-${index}`
                            : name
                        } ${duration || '1s'}${delay ? ` ${delay}` : ''} ${easing}`)
                    ).filter(a => a).join(`,
                               `)};
                }
                ${animations.map(({ part, easing, duration, delay }, index) => (
                    part ? `${part} {
                    animation: ${name}-${index} ${duration || '1s'}${delay ? ` ${delay}` : ''} ${easing};
                }` : '')).filter(a => a).join(`

                `)}
                ${parent ? `

                #comp-wrapper {
                    ${parent}
                }` : ''}`;
}

const controls = document.querySelector('#controls');
const output = document.querySelector('#controls-output-content');

const EASINGS = {
    linear: 'linear',
    circOut: 'cubic-bezier(0, 0.55, 0.45, 1)',
    sineIn: 'cubic-bezier(0.12, 0, 0.39, 0)',
    sineInOut: 'cubic-bezier(0.37, 0, 0.63, 1)',
    sineOut: 'cubic-bezier(0.61, 1, 0.88, 1)',
    cubicIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
    cubicInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    quintIn: 'cubic-bezier(0.64, 0, 0.78, 0)'
};

const propertiesGenerators = {
    arc: () => {
        const isRight = data['screen-in-arc-side'] === 'right';

        return {
            parent: `perspective: 200px;`,
            animations: [{
                frames: {
                    from: `opacity: 0;
                        transform-origin: 50% 50% calc(-1.5 * var(--rectWidth));
                        transform:
                            rotateY(${isRight ? '' : '-'}180deg)
                            rotate(var(--rotation));`,
                    to: `transform-origin: 50% 50% calc(-1.5 * var(--rectWidth));`
                },
                easing: EASINGS.sineInOut
            }]
        };
    },
    bounce: () => {
        const power = +data['screen-in-bounce-power'];
        const [y, x] = data['screen-in-bounce-dir'].split('|').map(a => +a);

        return { from: `opacity: 0.01;
                        transform:
                            translateX(${x ? `calc(50% * ${x})` : x})
                            translateY(${y ? `calc(50% * ${y})` : y})
                            scale(0)
                            rotate(var(--rotation));`,
                '30%': `opacity: 1;
                        transform:
                            translateX(${x ? `calc(33% * ${x})` : x})
                            translateY(${y ? `calc(33% * ${y})` : y})
                            scale(0.3)
                            rotate(var(--rotation));`,
                '41%': `transform:
                            translateX(${x ? `calc(33% * ${x} * -0.32)` : x})
                            translateY(${y ? `calc(33% * ${y} * -0.32)` : y})
                            scale(1.32)
                            rotate(var(--rotation));`,
                '50%': `transform:
                            translateX(${x ? `calc(33% * ${x} * 0.13)` : x})
                            translateY(${y ? `calc(33% * ${y} * 0.13)` : y})
                            scale(0.87)
                            rotate(var(--rotation));`,
                '61%': `transform:
                            translateX(${x ? `calc(33% * ${x} * -0.05)` : x})
                            translateY(${y ? `calc(33% * ${y} * -0.05)` : y})
                            scale(1.05)
                            rotate(var(--rotation));`,
                '71%': `transform:
                            translateX(${x ? `calc(33% * ${x} * 0.02)` : x})
                            translateY(${y ? `calc(33% * ${y} * 0.02)` : y})
                            scale(0.98)
                            rotate(var(--rotation));`,
                '81%': `transform:
                            translateX(${x ? `calc(33% * ${x} * -0.01)` : x})
                            translateY(${y ? `calc(33% * ${y} * -0.01)` : y})
                            scale(1.01)
                            rotate(var(--rotation));`,
                '92%': `transform:
                            translateX(${x ? `calc(33% * ${x} * 0.002)` : x})
                            translateY(${y ? `calc(33% * ${y} * 0.002)` : y})
                            scale(1)
                            rotate(var(--rotation));`
        };
    },
    drop: () => {
        const power = data['screen-in-drop-power'];

        return {
            animations: [{
                frames: {
                    from: `opacity: 0;`
                },
                easing: EASINGS.sineIn,
                duration: '0.25s'
            }, {
                frames: {
                    from: `transform:
                            scale(${power})
                            rotate(var(--rotation));`
                },
                easing: EASINGS.sineIn
            }]
        };
    },
    expand: () => {
        const scale = data['screen-in-expand-power'];

        return {
            animations: [{
                frames: {
                    from: `opacity: 0.01;`
                },
                easing: EASINGS.cubicIn
            }, {
                frames: {
                    from: `transform:
                            scale(${scale})
                            rotate(var(--rotation));`
                },
                easing: EASINGS.sineIn
            }]
        };
    },
    fade: () => ({ animations: [{ frames: { from: `opacity: 0;` }, easing: EASINGS.cubicIn }] }),
    flip: () => {
        const [angleY, angleX] = data['screen-in-flip-dir'].split('|');

        return {
            animations: [{
                frames: {
                    from: `opacity: 0.01;`,
                    to  : `opacity: 1;`
                },
                easing: EASINGS.quintIn,
                duration: '0.25s'
            }, {
                frames: {
                    from: `transform:
                            perspective(800px)
                            rotateX(${angleX * 90}deg)
                            rotateY(${angleY * 90}deg)
                            rotate(var(--rotation));`,
                    to: `transform:
                            perspective(800px)
                            rotateX(0deg)
                            rotateY(0deg)
                            rotate(var(--rotation));`
                },
                easing: EASINGS.quintIn,
                duration: '0.75s',
                delay: '0.25s'
            }]
        };
    },
    float: () => {
        const [dy, dx] = data['screen-in-float-dir'].split('|').map(a => +a);

        return {
            animations: [{
                frames: {
                    from: `opacity: 0;`
                },
                easing: EASINGS.cubicIn
            }, {
                frames: {
                    from: `transform:
                            translateX(
                                ${dx > 0
                        ? `max(0, min(calc(100vw - var(--rectRight)), 120px))`
                        : `${dx ? `calc(-1 * max(0, min(var(--rectLeft), 120px)))` : '0'}`
                    }
                            )
                            translateY(
                                ${dy ? `${dy === -1 ? '-' : ''}60px` : '0'}
                            )
                            rotate(var(--rotation));`
                },
                easing: EASINGS.sineOut
            }]
        };
    },
    fly: () => {
        const [dy, dx] = data['screen-in-fly-dir'].split('|').map(a => +a);

        return {
            animations: [{
                frames: {
                    from: `opacity: 0;`
                },
                easing: EASINGS.linear
            }, {
                frames: {
                    from: `transform:
                            translateX(
                                ${dx > 0 ? `calc(100vw - var(--rectRight))` : `${dx ? `calc(-1 * var(--rectLeft))` : '0'}`}
                            )
                            translateY(
                                ${dy > 0 ? `calc(100vh - var(--rectTop))` : `${dy ? `calc(-1 * var(--rectBottom))` : '0'}`}
                            )
                            rotate(var(--rotation));`
                },
                easing: EASINGS.sineOut
            }]
        };
    },
    fold: () => {
        const [rotateX, rotateY, originX, originY] = data['screen-in-fold-dir'].split('|').map(a => +a);

        return {
            animations: [{
                frames: {
                    from: `opacity: 0.01;`
                },
                easing: EASINGS.cubicInOut,
                duration: '0.25s'
            }, {
                frames: {
                    from: ``
                },
                easing: EASINGS,
                duration: '1s'
            }]
        };
    },
    glide: () => {
        const angle = (data['screen-in-glide-dir'] * Math.PI) / 180;
        const distance = data['screen-in-glide-dist'];

        return {
            animations: [{
                frames: {
                    from: `opacity: 0;
                        transform:
                            translateX(${Math.round(Math.sin(angle) * distance)}px)
                            translateY(${Math.round(Math.cos(angle) * distance * -1)}px)
                            rotate(var(--rotation));`,
                    '1%': `opacity: 1;`,
                },
                easing: EASINGS.sineInOut
            }]
        };
    },
    reveal: () => {
        const direction = data['screen-in-reveal-dir'];
        const clipDirection = getAdjustedDirection({
            top: { dx: 0, dy: -1, idx: 0 },
            right: { dx: 1, dy: 0, idx: 1 },
            bottom: { dx: 0, dy: 1, idx: 2 },
            left: { dx: -1, dy: 0, idx: 3 }
        }, direction, data.rotation);
        const clipPathPolygon = getClipPolygonParams({
            top: rectTop,
            bottom: rectBottom,
            left: rectLeft,
            right: rectRight
        }, clipDirection);

        return {
            animations: [{
                frames: {
                    from: `opacity: 0;`
                },
                easing: EASINGS.cubicInOut,
                duration: '0.25s'
            }, {
                frames: {
                    from: `clip-path: polygon(${clipPathPolygon});`
                },
                easing: EASINGS.cubicInOut,
                duration: '1s'
            }]
        };
    },
    slide: () => {
        const direction = data['screen-in-slide-dir'];
        const power = data['screen-in-slide-power'];

        return { from: `opacity: 0;
                        clip-path: polygon(...);
                        transform:
                            translateX(...);`,
                '25%': 'opacity: 1;'
        };
    },
    spin: () => {
        const power = +data['screen-in-spin-power'];
        const isClockwise = data['screen-in-spin-dir'] === 'cw';
        const spins = data['screen-in-spin-spins'];

        return {
            animations: [{
                frames: {
                    from: `opacity: 0.01;`
                },
                easing: EASINGS.sineIn
            }, {
                frames: {
                    from: `transform:
                            scale(${power})
                            rotate(
                                calc(var(--rotation) + ${isClockwise ? -1 : 1} * ${360 * spins}deg)
                            );`
                },
                easing: EASINGS.sineInOut
            }]
        };
    },
    turn: () => {
        const isRight = data['screen-in-turn-side'] === 'right';

        return {
            animations: [{
                frames: {
                    from: `opacity: 0;
                        transform:
                            translateY(
                                min(-1.5 * 100%, max(-300px, calc(-5.5 * 100%)))
                            )
                            rotate(
                                calc(90deg + ${isRight ? 1 : -1} * var(--rotation))
                            );`
                },
                easing: EASINGS.linear
            }, {
                frames: {
                    from: `transform:
                            translateX(
                                ${!isRight ? `100vw - var(--rectRight)` : `var(--rectLeft)`}
                            );`
                },
                easing: EASINGS.circOut,
                part: '#comp-wrapper'
            }]
        };
    }
};

let rectWidth;
let rectHeight;
let rectTop;
let rectBottom;
let rectRight;
let rectLeft;
let sizing = false;

const data = {
    'screen-in-arc-side': 'right',
    'screen-in-bounce-power': '1.2',
    'screen-in-bounce-dir': '-1.1|-1.1',
    'screen-in-drop-power': '1.2',
    'screen-in-expand-power': '0.85',
    'screen-in-flip-dir': '0|-1',
    'screen-in-float-dir': '-90|0',
    'screen-in-fly-dir': '0|-1',
    'screen-in-fold-dir': '0|90|0|50',
    'screen-in-glide-dir': 270,
    'screen-in-glide-dist': 150,
    'screen-in-reveal-dir': 'left',
    'screen-in-slide-dir': 'left',
    'screen-in-slide-power': 70,
    'screen-in-spin-spins': 2,
    'screen-in-spin-dir': 'cw',
    'screen-in-spin-power': 0.8,
    'screen-in-turn-side': 'right',
};

function updateRect () {
    // TODO: implement
    rectHeight = 225;
    rectWidth = 400;
    rectTop = 100;
    rectLeft = 100;
    rectBottom = rectTop + rectHeight;
    rectRight = rectLeft + rectWidth;
}

function updateSizes () {
    updateRect();
    sizing = false;
}

function tick () {
    if (!sizing) {
        sizing = true;
        requestAnimationFrame(updateSizes);
    }
}

window.addEventListener('resize', tick);

controls.addEventListener('input', e => {
    const formData = new FormData(e.target.form);
    Object.assign(data, Object.fromEntries(formData.entries()));

    const animationName = data['screen-in-name'];

    output.textContent = getCssCode(data.rotation, animationName, propertiesGenerators[animationName]());
});

tick();
