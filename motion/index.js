import { getAdjustedDirection, getClipPolygonParams, getTranslations } from './utils.js';

/*
 * CSS text generator
 */
function getCssCode(rotation, name, data) {
    const { parent, animations } = data;

    return `
    /* Component variables */
    #comp-wrapper {
        --rectTop: ${rectTop}px;
        --rectBottom: ${rectBottom}px;
        --rectLeft: ${rectLeft}px;
        --rectRight: ${rectRight}px;
        --rectWidth: ${rectWidth}px;

        --rotation: ${rotation}deg;
    }

    ${animations.map(
        ({ frames }, index) => `@keyframes ${animations.length > 1 ? `${name}-${index}` : name} {
        ${Object.entries(frames).map(
            ([offset, props]) => `${offset} {
            ${props}
        }`,
        ).join(`
        `)}
    }`,
    ).join(`

    `)}

    #component {
        transform: rotate(var(--rotation));
        animation: ${animations
            .map(({ easing, duration, delay, part }, index) =>
                part
                    ? ''
                    : `${
                          animations.length > 1 ? `${name}-${index}` : name
                      } ${duration || '1s'}${delay ? ` ${delay}` : ''} ${easing}`,
            )
            .filter((a) => a).join(`,
                   `)};
    }
    ${animations
        .map(({ part, easing, duration, delay }, index) =>
            part
                ? `${part} {
        animation: ${name}-${index} ${duration || '1s'}${delay ? ` ${delay}` : ''} ${easing};
    }`
                : '',
        )
        .filter((a) => a).join(`

    `)}
    ${
        parent
            ? `
    #comp-wrapper {
        ${parent}
    }`
            : ''
    }`;
}

const main = document.querySelector('main');
const controls = document.querySelector('#controls');
const output = document.querySelector('#controls-output-content');
const stageRun = document.querySelector('#stageRun');
const stageResize = document.querySelector('#stageResize');
const stageDebug = document.querySelector('#stageDebug');

const EASINGS = {
    linear: 'linear',
    circOut: 'cubic-bezier(0, 0.55, 0.45, 1)',
    sineIn: 'cubic-bezier(0.12, 0, 0.39, 0)',
    sineInOut: 'cubic-bezier(0.37, 0, 0.63, 1)',
    sineOut: 'cubic-bezier(0.61, 1, 0.88, 1)',
    cubicIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
    cubicInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    quintIn: 'cubic-bezier(0.64, 0, 0.78, 0)',
    expoIn: 'cubic-bezier(0.7, 0, 0.84, 0)',
};

/*
 * ScreenIn animation generators
 */
const propertiesGenerators = {
    arc: () => {
        const isRight = data['screen-in-arc-side'] === 'right';

        return {
            parent: `perspective: 200px;`,
            animations: [
                {
                    frames: {
                        from: `opacity: 0;
            transform-origin: 50% 50% calc(-1.5 * var(--rectWidth));
            transform:
                rotateY(${isRight ? '' : '-'}180deg)
                rotate(var(--rotation));`,
                        to: `transform-origin: 50% 50% calc(-1.5 * var(--rectWidth));
            transform:
                rotateY(0deg)
                rotate(var(--rotation));`,
                    },
                    easing: EASINGS.sineInOut,
                },
            ],
        };
    },
    bounce: () => {
        const POWERS = {
            soft: 1.2,
            medium: 3.6,
            hard: 6,
        };
        const DIRECTIONS = {
            topLeft: [-1.1, -1.1],
            topRight: [-1.1, 1.1],
            center: [0, 0],
            bottomLeft: [1.1, -1.1],
            bottomRight: [1.1, 1.1],
        };
        const power = POWERS[data['screen-in-bounce-power']];
        const [y, x] = DIRECTIONS[data['screen-in-bounce-dir']];

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0.01;`,
                    },
                    easing: EASINGS.cubicIn,
                    duration: '0.3s',
                },
                {
                    frames: {
                        from: `transform:
                translateX(${x ? `calc(50% * ${x})` : x})
                translateY(${y ? `calc(50% * ${y})` : y})
                scale(0)
                rotate(var(--rotation));`,
                        to: `transform:
                translateX(${x ? `calc(33% * ${x})` : x})
                translateY(${y ? `calc(33% * ${y})` : y})
                scale(0.3)
                rotate(var(--rotation));`,
                    },
                    easing: EASINGS.expoIn,
                    duration: '0.3s',
                },
                {
                    frames: {
                        from: `transform:
                translateX(${x ? `calc(33% * ${x})` : x})
                translateY(${y ? `calc(33% * ${y})` : y})
                scale(0.3)
                rotate(var(--rotation));`,
                        '16%': `transform:
                translateX(${x ? `calc(33% * ${x})` : x})
                translateY(${y ? `calc(33% * ${y})` : y})
                scale(0.3)
                rotate(var(--rotation));`,
                        '28%': `transform:
                translateX(${x ? `calc(33% * ${x} * -0.32)` : x})
                translateY(${y ? `calc(33% * ${y} * -0.32)` : y})
                scale(1.32)
                rotate(var(--rotation));`,
                        '44%': `transform:
                translateX(${x ? `calc(33% * ${x} * 0.13)` : x})
                translateY(${y ? `calc(33% * ${y} * 0.13)` : y})
                scale(0.87)
                rotate(var(--rotation));`,
                        '59%': `transform:
                translateX(${x ? `calc(33% * ${x} * -0.05)` : x})
                translateY(${y ? `calc(33% * ${y} * -0.05)` : y})
                scale(1.05)
                rotate(var(--rotation));`,
                        '73%': `transform:
                translateX(${x ? `calc(33% * ${x} * 0.02)` : x})
                translateY(${y ? `calc(33% * ${y} * 0.02)` : y})
                scale(0.98)
                rotate(var(--rotation));`,
                        '88%': `transform:
                translateX(${x ? `calc(33% * ${x} * -0.01)` : x})
                translateY(${y ? `calc(33% * ${y} * -0.01)` : y})
                scale(1.01)
                rotate(var(--rotation));`,
                    },
                    easing: EASINGS.linear,
                    duration: '0.7s',
                    delay: '0.3s',
                },
            ],
        };
    },
    drop: () => {
        const POWERS = {
            soft: 1.2,
            medium: 3.6,
            hard: 6,
        };
        const power = POWERS[data['screen-in-drop-power']];

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0;`,
                    },
                    easing: EASINGS.sineIn,
                    duration: '0.25s',
                },
                {
                    frames: {
                        from: `transform:
                scale(${power})
                rotate(var(--rotation));`,
                        to: `transform:
                scale(1)
                rotate(var(--rotation));`,
                    },
                    easing: EASINGS.sineIn,
                },
            ],
        };
    },
    expand: () => {
        const POWERS = {
            soft: 0.85,
            medium: 0.4,
            hard: 0,
        };
        const scale = POWERS[data['screen-in-expand-power']];

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0.01;`,
                    },
                    easing: EASINGS.cubicIn,
                },
                {
                    frames: {
                        from: `transform:
                scale(${scale})
                rotate(var(--rotation));`,
                        to: `transform:
                scale(1)
                rotate(var(--rotation));`,
                    },
                    easing: EASINGS.sineIn,
                },
            ],
        };
    },
    fade: () => ({ animations: [{ frames: { from: `opacity: 0;` }, easing: EASINGS.cubicIn }] }),
    flip: () => {
        const DIRECTIONS = {
            top: [1, 0],
            left: [0, -1],
            bottom: [-1, 0],
            right: [0, 1],
        };
        const [angleX, angleY] = DIRECTIONS[data['screen-in-flip-dir']];

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0.01;`,
                        to: `opacity: 1;`,
                    },
                    easing: EASINGS.quintIn,
                    duration: '0.25s',
                },
                {
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
                rotate(var(--rotation));`,
                    },
                    easing: EASINGS.quintIn,
                    duration: '0.75s',
                },
            ],
        };
    },
    float: () => {
        const DIRECTIONS = {
            top: [0, -1],
            left: [-1, 0],
            bottom: [0, 1],
            right: [1, 0],
        };
        const [dx, dy] = DIRECTIONS[data['screen-in-float-dir']];

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0;`,
                    },
                    easing: EASINGS.cubicIn,
                },
                {
                    frames: {
                        from: `transform:
                translateX(
                    ${
                        dx > 0
                            ? `max(0px, min(calc(100vw - var(--rectRight)), 120px))`
                            : `${dx ? `calc(-1 * max(0px, min(var(--rectLeft), 120px)))` : '0'}`
                    }
                )
                translateY(
                    ${dy ? `${dy === -1 ? '-' : ''}60px` : '0'}
                )
                rotate(var(--rotation));`,
                        to: `transform:
                translateX(0)
                translateY(0)
                rotate(var(--rotation));`,
                    },
                    easing: EASINGS.sineOut,
                },
            ],
        };
    },
    fly: () => {
        const DIRECTIONS = {
            top: [-1, 0],
            topLeft: [-1, -1],
            topRight: [-1, 1],
            left: [0, -1],
            bottom: [1, 0],
            bottomLeft: [1, -1],
            bottomRight: [1, 1],
            right: [0, 1],
        };
        const [dy, dx] = DIRECTIONS[data['screen-in-fly-dir']];

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0;`,
                    },
                    easing: EASINGS.linear,
                },
                {
                    frames: {
                        from: `transform:
                translateX(
                    ${dx > 0 ? `calc(100vw - var(--rectRight))` : `${dx ? `calc(-1 * var(--rectLeft))` : '0'}`}
                )
                translateY(
                    ${dy > 0 ? `calc(100vh - var(--rectTop))` : `${dy ? `calc(-1 * var(--rectBottom))` : '0'}`}
                )
                rotate(var(--rotation));`,
                    },
                    easing: EASINGS.sineOut,
                },
            ],
        };
    },
    fold: () => {
        const DIRECTIONS = {
            // rotateX, rotateY, originX, originY
            top: [-90, 0, 50, 0],
            right: [0, -90, 100, 50],
            bottom: [90, 0, 50, 100],
            left: [0, 90, 0, 50],
        };
        const [rotateX, rotateY, originX, originY] = DIRECTIONS[data['screen-in-fold-dir']];

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0.01;`,
                    },
                    easing: EASINGS.cubicInOut,
                    duration: '0.25s',
                },
                {
                    frames: {
                        from: `transform-origin: ${originX}% ${originY}%;
            transform:
                perspective(800px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg);`,
                        to: `transform-origin: ${originX}% ${originY}%;
            transform:
                perspective(800px)
                rotateX(0)
                rotateY(0);`,
                    },
                    easing: EASINGS.cubicInOut,
                    duration: '1s',
                    part: '#comp-wrapper',
                },
            ],
        };
    },
    glide: () => {
        const angle = (data['screen-in-glide-dir'] * Math.PI) / 180;
        const distance = data['screen-in-glide-dist'];

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0;
            transform:
                translateX(${Math.round(Math.sin(angle) * distance)}px)
                translateY(${Math.round(Math.cos(angle) * distance * -1)}px)
                rotate(var(--rotation));`,
                        '1%': `opacity: 1;`,
                    },
                    easing: EASINGS.sineInOut,
                },
            ],
        };
    },
    reveal: () => {
        const direction = data['screen-in-reveal-dir'];
        const clipDirection = getAdjustedDirection(
            {
                top: { dx: 0, dy: -1, idx: 0 },
                right: { dx: 1, dy: 0, idx: 1 },
                bottom: { dx: 0, dy: 1, idx: 2 },
                left: { dx: -1, dy: 0, idx: 3 },
            },
            direction,
            data.rotation,
        );
        const clipPathPolygon = getClipPolygonParams(clipDirection);

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0;`,
                    },
                    easing: EASINGS.cubicInOut,
                    duration: '0.25s',
                },
                {
                    frames: {
                        from: `clip-path: polygon(${clipPathPolygon});`,
                        to: `clip-path: polygon(${getClipPolygonParams()});`,
                    },
                    easing: EASINGS.cubicInOut,
                    duration: '1s',
                },
            ],
        };
    },
    slide: () => {
        const DIRECTIONS = {
            top: { dx: 0, dy: -1, idx: 0 },
            right: { dx: 1, dy: 0, idx: 1 },
            bottom: { dx: 0, dy: 1, idx: 2 },
            left: { dx: -1, dy: 0, idx: 3 },
        };
        const POWERS = {
            soft: 70,
            medium: 35,
            hard: 0,
        };
        const direction = data['screen-in-slide-dir'];
        const power = POWERS[data['screen-in-slide-power']];

        const translateDirection = getAdjustedDirection(DIRECTIONS, direction, data.rotation);
        const clipDirection = getAdjustedDirection(DIRECTIONS, direction, data.rotation + 180);
        const { x, y } = getTranslations(
            { width: rectWidth, height: rectHeight },
            DIRECTIONS[translateDirection],
            data.rotation,
            (100 - power) / 100,
        );
        const clipPathPolygon = getClipPolygonParams(clipDirection, power);

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0;`,
                    },
                    easing: EASINGS.cubicInOut,
                    duration: '0.25s',
                },
                {
                    frames: {
                        from: `clip-path: polygon(${clipPathPolygon});
            transform:
                translateX(${x}px)
                translateY(${y}px)
                rotate(var(--rotation));`,
                        to: `clip-path: polygon(${getClipPolygonParams()});
            transform:
                translateX(0)
                translateY(0)
                rotate(var(--rotation));`,
                    },
                    easing: EASINGS.linear,
                },
            ],
        };
    },
    spin: () => {
        const POWERS = {
            soft: 0.8,
            medium: 0.5,
            hard: 0,
        };
        const power = POWERS[data['screen-in-spin-power']];
        const isClockwise = data['screen-in-spin-dir'] === 'cw';
        const spins = data['screen-in-spin-spins'];

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0.01;`,
                    },
                    easing: EASINGS.sineIn,
                },
                {
                    frames: {
                        from: `transform:
                scale(${power})
                rotate(
                    calc(var(--rotation) ${isClockwise ? '-' : '+'} ${360 * spins}deg)
                );`,

                        to: `transform:
                scale(1)
                rotate(
                    var(--rotation)
                );`,
                    },
                    easing: EASINGS.sineInOut,
                },
            ],
        };
    },
    turn: () => {
        const isRight = data['screen-in-turn-side'] === 'right';

        return {
            animations: [
                {
                    frames: {
                        from: `opacity: 0;
            transform:
                translateY(
                    min(-1.5 * 100%, max(-300px, calc(-5.5 * 100%)))
                )
                rotate(
                    calc(${isRight ? '' : '-'}90deg + var(--rotation))
                );`,
                        to: `transform:
                translateY(0)
                rotate(var(--rotation));`,
                    },
                    easing: EASINGS.linear,
                },
                {
                    frames: {
                        from: `transform:
                translateX(
                    ${isRight ? `calc(100vw - var(--rectRight))` : `calc(-1 * var(--rectLeft))`}
                );`,
                        to: `transform: translateX(0);`,
                    },
                    easing: EASINGS.circOut,
                    part: '#comp-wrapper',
                },
            ],
        };
    },
};

/*
 * App state
 */
const data = {
    'screen-in-arc-side': 'right',
    'screen-in-bounce-power': 'soft',
    'screen-in-bounce-dir': 'left',
    'screen-in-drop-power': 'soft',
    'screen-in-expand-power': 'soft',
    'screen-in-flip-dir': 'left',
    'screen-in-float-dir': 'left',
    'screen-in-fly-dir': 'left',
    'screen-in-fold-dir': 'left',
    'screen-in-glide-dir': 270,
    'screen-in-glide-dist': 150,
    'screen-in-reveal-dir': 'left',
    'screen-in-slide-dir': 'left',
    'screen-in-slide-power': 'soft',
    'screen-in-spin-spins': 2,
    'screen-in-spin-dir': 'cw',
    'screen-in-spin-power': 'soft',
    'screen-in-turn-side': 'right',
};

/*
 * Stage initialization and update
 */
let rectWidth;
let rectHeight;
let rectTop;
let rectBottom;
let rectRight;
let rectLeft;
let sizing = false;

function updateRect() {
    rectHeight = component.offsetHeight;
    rectWidth = component.offsetWidth;
    rectTop = 0;
    rectLeft = 0;

    let el = component;

    while (el && el !== el.ownerDocument.body) {
        rectTop += el.offsetTop;
        rectLeft += el.offsetLeft;
        el = el.offsetParent;
    }

    rectBottom = rectTop + rectHeight;
    rectRight = rectLeft + rectWidth;
}

function updateSizes() {
    updateRect();
    sizing = false;
}

function tick() {
    if (!sizing) {
        sizing = true;
        requestAnimationFrame(updateSizes);
    }
}

window.addEventListener('resize', tick);

let stageFrame = window.frames[0];
let stageDocument = stageFrame.document;
let effectStyle = stageDocument?.querySelector('#effectStyle');
let component = stageDocument?.querySelector('#component');

stageFrame.addEventListener('resize', tick);

if (stageDocument) {
    tick();
} else {
    stageFrame.addEventListener('load', (e) => {
        stageDocument = e.target.document;
        effectStyle = stageDocument?.querySelector('#effectStyle');
        component = stageDocument?.querySelector('#component');

        tick();
    });
}

function run() {
    const name = data['screen-in-name'];

    if (!name) return;

    const animationName = generateAnimationName();

    const cssText = getCssCode(data.rotation, animationName, propertiesGenerators[name]());

    output.textContent = cssText;

    effectStyle.textContent = cssText;
}

/*
 * Preset library controls
 */
controls.addEventListener('input', (e) => {
    const formData = new FormData(e.target.form);
    Object.assign(data, Object.fromEntries(formData.entries()));

    /* fix rotation */
    const rotation = data.rotation % 360;
    data.rotation = (rotation < 0 ? 360 : 0) + rotation;

    run();
});

function generateAnimationName() {
    const name = data['screen-in-name'];
    const prefix = `screen-in-${name}-`;

    return `${name}-${Object.entries(data)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => value.toString().replace('.', '_'))
        .join('-')}`;
}

/*
 * Stage control buttons
 */
stageRun.addEventListener('click', (e) => {
    effectStyle.textContent = '';
    requestAnimationFrame(run);
});

stageResize.addEventListener('click', (e) => {
    main.classList.toggle('maximize-stage');
    effectStyle.textContent = '';
    tick();
    requestAnimationFrame(run);
});

stageDebug.addEventListener('click', (e) => {
    stageDocument.body.firstElementChild.classList.toggle('debug-stage');
});
