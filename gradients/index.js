const gui = new dat.gui.GUI();

const DEFAULT_COLOR = [60, 160, 34];
const DEFAULT_RADIUS = 50;
const MIN_RADIUS = 10;
const MAX_RADIUS = 2000;
const RADIUS_STEP = 1;
const DEFAULT_LINEAR_ANGLE = 90;
const DEFAULT_CONIC_ANGLE = 0;
const DEFAULT_CONIC_POSITION = 0;
const GENERAL_FIELDS = {
    ACTION: 'Action',
    SHOW_CIRCLES: 'Show circles',
    BG_COLOR: 'BG color',
    BLEND_MODE: 'Blend mode',
    ADD_LINEAR: 'Add linear gradient',
    ADD_CONIC: 'Add conic gradient'
};
const BLEND_MODES = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity'
];
const DEFAULT_LINEAR_COLORS = [
    [245, 61, 61],
    [61, 61, 245],
    [61, 245, 61],
    [61, 245, 245],
    [245, 61, 245],
    [245, 245, 61]
];

const config = {
    [GENERAL_FIELDS.ACTION]: 'add',
    [GENERAL_FIELDS.SHOW_CIRCLES]: 'last',
    [GENERAL_FIELDS.BG_COLOR]: '#fff',
    [GENERAL_FIELDS.BLEND_MODE]: 'normal',
    [GENERAL_FIELDS.ADD_LINEAR]: addLinearGradient,
    [GENERAL_FIELDS.ADD_CONIC]: addConicGradient
};

gui.remember(config);

gui.add(config, GENERAL_FIELDS.ACTION, ['add', 'move'])
    .onChange(value => {
        mainEl.dataset.action = value;
        setAction(value);
    })
gui.addColor(config, GENERAL_FIELDS.BG_COLOR)
    .onChange(value => {
        mainEl.style.backgroundColor = value;
    })
gui.add(config, GENERAL_FIELDS.BLEND_MODE, BLEND_MODES)
    .onChange(value => {
        mainEl.style.setProperty('--blendMode', value);
    })
gui.add(config, GENERAL_FIELDS.SHOW_CIRCLES, ['last', 'all', 'none'])
    .onChange(value => {
        mainEl.dataset.showCircles = value.toLowerCase();
    });

gui.add(config, GENERAL_FIELDS.ADD_LINEAR);
gui.add(config, GENERAL_FIELDS.ADD_CONIC);

const linearFolder = gui.addFolder('Linear Gradients');
linearFolder.open();

const conicFolder = gui.addFolder('Conic Gradients');
conicFolder.open();

let circlesIndex = 0;
let linearsIndex = 0;
let conicsIndex = 0;

function addCircleFolder ({onColor, onSize, onRemove, onMiddle/*, onBlend*/}) {
    const folderConfig = {
        color: DEFAULT_COLOR,
        size: DEFAULT_RADIUS,
        middle: 50,
        // 'blend mode': 'normal',
        remove: onRemove
    };
    const folder = gui.addFolder(`Circle ${++circlesIndex}`);
    folder.open();
    folder.addColor(folderConfig, 'color')
        .onChange(onColor);
    folder.add(folderConfig, 'size', MIN_RADIUS, MAX_RADIUS, RADIUS_STEP)
        .onChange(onSize);
    folder.add(folderConfig, 'middle', 0, 100, 1)
        .onChange(onMiddle);
    // folder.add(folderConfig, 'blend mode', BLEND_MODES)
    //     .onChange(onBlend)
    folder.add(folderConfig, 'remove');

    return {
        folder,
        config: folderConfig
    };
}

function addLinearFolder ({onStopAdd, onFrom, onRemove/*, onBlend*/}) {
    const folderConfig = {
        from: DEFAULT_LINEAR_ANGLE,
        // 'blend mode': 'normal',
        'add stop': onStopAdd,
        remove: onRemove
    };
    const folder = linearFolder.addFolder(`Linear ${++linearsIndex}`);
    folder.open();
    folder.add(folderConfig, 'from', 0, 360, 1)
        .onChange(onFrom);
    // folder.add(folderConfig, 'blend mode', BLEND_MODES)
    //     .onChange(onBlend);
    folder.add(folderConfig, 'add stop');
    folder.add(folderConfig, 'remove');

    const stopsFolder = folder.addFolder('Color stops');
    stopsFolder.open();

    return {
        folder,
        config: folderConfig,
        stopsFolder
    };
}

function addConicFolder ({onStopAdd, onPosition, onAngle, onRemove}) {
    const folderConfig = {
        angle: DEFAULT_CONIC_ANGLE,
        position: DEFAULT_CONIC_POSITION,
        // 'blend mode': 'normal',
        'add stop': onStopAdd,
        remove: onRemove
    };
    const folder = conicFolder.addFolder(`Conic ${++conicsIndex}`);
    folder.open();
    folder.add(folderConfig, 'angle', 0, 360, 1)
        .onChange(onAngle);
    // folder.add(folderConfig, 'blend mode', BLEND_MODES)
    //     .onChange(onBlend);
    folder.add(folderConfig, 'position', 0, 360, 1)
        .onChange(onPosition);
    folder.add(folderConfig, 'add stop');
    folder.add(folderConfig, 'remove');

    const stopsFolder = folder.addFolder('Color stops');
    stopsFolder.open();

    return {
        folder,
        config: folderConfig,
        stopsFolder
    };
}

function addColorStopFolder ({parentFolder, index, color, stop, onColor, onOpacity, onStop, onRemove}) {
    const folderConfig = {
        color,
        opacity: 100,
        stop,
        remove: onRemove
    };
    const folder = parentFolder.addFolder(`Stop ${index}`);
    folder.open();
    folder.addColor(folderConfig, 'color')
        .onChange(onColor);
    folder.add(folderConfig, 'opacity', 0, 100, 1)
        .onChange(onOpacity);
    folder.add(folderConfig, 'stop', 0, 100, 1)
        .onChange(onStop);
    folder.add(folderConfig, 'remove');

    return {
        folder,
        config: folderConfig
    };
}

const WINDOW_WIDTH = document.documentElement.clientWidth;
const WINDOW_HEIGHT = document.documentElement.clientHeight;

const mainEl = document.querySelector('main');
const circles = [];
const linears = [];
const conics = [];

function setAction (type) {
    if (type === 'add') {
        cancelCheckCircleToMove();
        if (hoveredCircle) {
            delete hoveredCircle.el.dataset.hover;
        }
        mainEl.removeEventListener('pointerdown', moveStart);
        mainEl.removeEventListener('pointerup', moveEnd);
        mainEl.addEventListener('click', addCircle);
    }
    else if (type === 'move') {
        mainEl.removeEventListener('click', addCircle);
        mainEl.addEventListener('pointerdown', moveStart);
        mainEl.addEventListener('pointerup', moveEnd);
        mainEl.addEventListener('pointermove', checkCircleToMove);
    }
}

function addLinearGradient () {
    const linear = new Linear();
    linears.push(linear);

    generateGradients();
}

function addConicGradient () {
    const conic = new Conic();
    conics.push(conic);

    generateGradients();
}

function addCircle (e) {
    const circle = new Circle({
        x: e.clientX,
        y: e.clientY
    });
    circles.push(circle);
    mainEl.appendChild(circle.el);

    generateGradients();
}

let hoveredCircle = null;
let current = {x: 0, y: 0};
let shouldCheckCircleToMove = true;

function checkCirclesDist () {
    shouldCheckCircleToMove = true;

    const closest = circles.map(
        circle => ({
            dist: Math.hypot(current.x - circle.x, current.y - circle.y),
            circle
        })
    ).sort((a, b) => {
        return a.dist > b.dist ? 1 : -1;
    })[0];

    if (hoveredCircle !== closest.circle) {
        if (hoveredCircle) {
            delete hoveredCircle.el.dataset.hover;
        }
        closest.circle.el.dataset.hover = 'true';
        hoveredCircle = closest.circle;
    }
}

function checkCircleToMove (e) {
    current.x = e.x;
    current.y = e.y;
    if (shouldCheckCircleToMove) {
        shouldCheckCircleToMove = false;
        requestAnimationFrame(checkCirclesDist);
    }
}

function cancelCheckCircleToMove () {
    mainEl.removeEventListener('pointermove', checkCircleToMove);
    cancelAnimationFrame(checkCirclesDist);
    shouldCheckCircleToMove = true;
}

function moveStart (e) {
    cancelCheckCircleToMove();
    mainEl.addEventListener('pointermove', moveMove);
}

function moveMove (e) {
    hoveredCircle.setPosition(e);
    hoveredCircle.updateGradient();
}

function moveEnd (e) {
    mainEl.removeEventListener('pointermove', moveMove);
    mainEl.addEventListener('pointermove', checkCircleToMove);
}

setAction(config[GENERAL_FIELDS.ACTION]);

class Circle {
    constructor ({x, y}) {
        const {config, folder} = addCircleFolder({
            onColor: () => this.onColor(),
            onSize: () => this.onSize(),
            onRemove: () => this.onRemove(),
            onMiddle: () => this.onMiddle()
            // onBlend: value => this.onBlend(value)
        });
        this.x = x;
        this.y = y;
        this.r = config.size;
        this.config = config;
        this.folder = folder;
        // this.blendMode = 'normal';

        this.createElement();
        this.createGradient();
    }

    createElement () {
        const el = document.createElement('div');
        this.el = el;
        el.classList.add('circle');

        this.setPosition();
    }

    setSize () {
        this.el.style.setProperty('--radius', `${this.config.size}px`);
    }

    setPosition (position) {
        if (position) {
            this.x = position.x;
            this.y = position.y;
        }
        this.el.style.setProperty('--x', `${this.x - this.config.size / 2}px`);
        this.el.style.setProperty('--y', `${this.y - this.config.size / 2}px`);
    }

    createGradient () {
        this.setSize();
        this.gradient = [`${this.config.size}px`, `${this.x}px ${this.y}px`, `rgb(${this.config.color})`, `${this.config.middle}%`];
    }

    updateGradient () {
        this.createGradient();
        generateGradients();
    }

    onColor () {
        this.updateGradient();
    }

    onSize () {
        this.setSize();
        this.setPosition();
        this.updateGradient();
    }

    onMiddle () {
        this.updateGradient();
    }

    // onBlend (value) {
    //     this.blendMode = value;
    //     updateBlendModes();
    // }

    onRemove () {
        gui.removeFolder(this.folder);
        this.el.remove();
        circles.splice(circles.indexOf(this), 1);
        generateGradients();
    }
}

class Conic {
    constructor () {
        const {config, folder, stopsFolder} = addConicFolder({
            onStopAdd: () => this.addColorStop(),
            onPosition: () => this.onPosition(),
            onAngle: () => this.onAngle(),
            onRemove: () => this.onRemove(),
            // onBlend: value => this.onBlend(value)
        });
        this.index = 0;
        this.stops = [];
        this.config = config;
        this.folder = folder;
        // this.blendMode = 'normal';
        this.stopsFolder = stopsFolder;

        this.addColorStop({stop: 50});
        this.addColorStop();

        this.createGradient();
    }

    createGradient () {
        this.gradient = [`from ${this.config.angle}deg at ${this._getPosition()}`, this.createStops().join(', ')];
    }

    updateGradient () {
        this.createGradient();
        generateGradients();
    }

    createStops () {
        return this.stops.map((stop, i) => i + 1 < this.stops.length ? stop.stop.join(', ') : stop.stop[0]);
    }

    addColorStop ({stop = 100} = {}) {
        const color = DEFAULT_LINEAR_COLORS[this.index % DEFAULT_LINEAR_COLORS.length];
        const colorStop = new ColorStop({parentFolder: this.stopsFolder, index: ++this.index, color, stop, parent: this});
        this.stops.push(colorStop);

        this.updateGradient();
    }

    onAngle () {
        this.updateGradient();
    }

    onPosition () {
        this.updateGradient();
    }

    _getPosition () {
        const r = Math.hypot(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2) * 1.05; // enlarge radius by 5% to push the cone's tip off screen
        const angle = Math.PI * this.config.position / 180;
        const x = (WINDOW_WIDTH / 2 + r * Math.sin(angle)) / WINDOW_WIDTH * 100;
        const y = (WINDOW_HEIGHT / 2 -  r * Math.cos(angle)) / WINDOW_HEIGHT * 100;

        return `${clamp(-5, 105, x)}% ${clamp(-5, 105, y)}%`;
    }

    onRemove () {
        conicFolder.removeFolder(this.folder);
        conics.splice(conics.indexOf(this), 1);
        generateGradients();
    }
}

class Linear {
    constructor () {
        const {config, folder, stopsFolder} = addLinearFolder({
            onStopAdd: () => this.addColorStop(),
            onFrom: () => this.onFrom(),
            onRemove: () => this.onRemove(),
            // onBlend: value => this.onBlend(value)
        });
        this.index = 0;
        this.stops = [];
        this.config = config;
        this.folder = folder;
        // this.blendMode = 'normal';
        this.stopsFolder = stopsFolder;

        this.addColorStop({stop: 50});
        this.addColorStop();

        this.createGradient();
    }

    createGradient () {
        this.gradient = [`${this.config.from}deg`, this.createStops().join(', ')];
    }

    updateGradient () {
        this.createGradient();
        generateGradients();
    }

    createStops () {
        return this.stops.map((stop, i) => i + 1 < this.stops.length ? stop.stop.join(', ') : stop.stop[0]);
    }

    addColorStop ({stop = 100} = {}) {
        const color = DEFAULT_LINEAR_COLORS[this.index % DEFAULT_LINEAR_COLORS.length];
        const colorStop = new ColorStop({parentFolder: this.stopsFolder, index: ++this.index, color, stop, parent: this});
        this.stops.push(colorStop);

        this.updateGradient();
    }

    onFrom () {
        this.updateGradient();
    }

    // onBlend (value) {
    //     this.blendMode = value;
    //     updateBlendModes();
    // }

    onRemove () {
        linearFolder.removeFolder(this.folder);
        linears.splice(linears.indexOf(this), 1);
        generateGradients();
    }
}

class ColorStop {
    constructor ({parentFolder, color, stop, index, parent}) {
        this.parentFolder = parentFolder;

        const {config, folder} = addColorStopFolder({
            parentFolder,
            index,
            color,
            stop,
            onColor: () => this.onColor(),
            onOpacity: () => this.onOpacity(),
            onStop: () => this.onStop(),
            onRemove: () => this.onRemove()
        });
        this.config = config;
        this.folder = folder;
        this.parent = parent;

        this.updateStop();
    }

    updateStop () {
        this.stop = [
            `rgba(${this.config.color}, ${this.config.opacity})`,
            `${this.config.stop}%`
        ];
    }

    onColor () {
        this.updateStop();
        this.parent.updateGradient();
    }

    onOpacity () {
        this.updateStop();
        this.parent.updateGradient();
    }

    onStop() {
        this.updateStop();
        this.parent.updateGradient();
    }

    onRemove () {
        this.parentFolder.removeFolder(this.folder);
        this.parent.stops.splice(this.parent.stops.indexOf(this), 1);
        this.parent.updateGradient();
    }
}

function generateGradients () {
    const gradients = circles.map(circle => {
        const [size, position, color, middle] = circle.gradient;
        return `radial-gradient(${size} at ${position}, ${color}, ${middle}, transparent)`;
    }).reverse()
    gradients.push(...conics.map(conic => {
        const [start, stops] = conic.gradient;
        return `conic-gradient(${start}, ${stops})`
    }).reverse());
    gradients.push(...linears.map(linear => {
        const [start, stops] = linear.gradient;
        return `linear-gradient(${start}, ${stops})`
    }).reverse());
    mainEl.style.setProperty('--gradient', gradients.join(', '));

    // updateBlendModes();
}

function clamp (min, max, val) {
    return Math.max(min, Math.min(max, val));
}

// function updateBlendModes () {
//     const blends = circles.map(circle => circle.blendMode).reverse();
//     blends.push(...linears.map(linear => linear.blendMode).reverse());
//     mainEl.style.setProperty('--blendMode', blends.join(', '));
// }
