const gui = new dat.gui.GUI();

const DEFAULT_COLOR = [60, 160, 34];
const DEFAULT_RADIUS = 50;
const MIN_RADIUS = 10;
const MAX_RADIUS = 2000;
const RADIUS_STEP = 1;
const GENERAL_FIELDS = {
    ACTION: 'Action',
    SHOW_CIRCLES: 'Show circles',
    BG_COLOR: 'BG color',
}

const config = {
    [GENERAL_FIELDS.ACTION]: 'add',
    [GENERAL_FIELDS.SHOW_CIRCLES]: 'last',
    [GENERAL_FIELDS.BG_COLOR]: '#fff'
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
gui.add(config, GENERAL_FIELDS.SHOW_CIRCLES, ['last', 'all', 'none'])
    .onChange(value => {
        mainEl.dataset.showCircles = value.toLowerCase();
    });

let circlesIndex = 0;

function addFolder ({onColor, onSize, onRemove, onMiddle}) {
    const folderConfig = {
        color: DEFAULT_COLOR,
        size: DEFAULT_RADIUS,
        middle: 50,
        remove: false
    };
    const folder = gui.addFolder(`Circle ${++circlesIndex}`);
    folder.open();
    folder.addColor(folderConfig, 'color')
        .onChange(onColor);
    folder.add(folderConfig, 'size', MIN_RADIUS, MAX_RADIUS, RADIUS_STEP)
        .onChange(onSize);
    folder.add(folderConfig, 'middle', 0, 100, 1)
        .onChange(onMiddle);
    folder.add(folderConfig, 'remove', false)
        .onChange(onRemove)

    return {
        folder,
        config: folderConfig
    };
}

const mainEl = document.querySelector('main');
const circles = [];

function setAction (type) {
    if (type === 'add') {
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
    cancelAnimationFrame(checkCirclesDist);
    shouldCheckCircleToMove = true;
}

function moveStart (e) {
    cancelCheckCircleToMove();
    mainEl.removeEventListener('pointermove', checkCircleToMove);
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
        const {config, folder} = addFolder({
            onColor: () => this.onColor(),
            onSize: () => this.onSize(),
            onRemove: () => this.onRemove(),
            onMiddle: () => this.onMiddle()
        });
        this.x = x;
        this.y = y;
        this.r = config.size;
        this.config = config;
        this.folder = folder;

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

    onRemove () {
        gui.removeFolder(this.folder);
        this.el.remove();
        circles.splice(circles.indexOf(this), 1);
        generateGradients();
    }
}

function generateGradients () {
    const gradients = circles.map(circle => {
        const [size, position, color, middle] = circle.gradient;
        return `radial-gradient(${size} at ${position}, ${color}, ${middle}, transparent)`;
    }).reverse().join(',');
    mainEl.style.setProperty('--gradient', gradients);
}
