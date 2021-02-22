const gui = new dat.gui.GUI();

const DEFAULT_COLOR = [159, 60, 34];
const DEFAULT_RADIUS = 50;
const MIN_RADIUS = 10;
const MAX_RADIUS = 2000;
const RADIUS_STEP = 1;
const GENERAL_FIELDS = {
    SHOW_CIRCLES: 'Show circles',
    BG_COLOR: 'BG color',
}

const config = {
    [GENERAL_FIELDS.SHOW_CIRCLES]: 'last',
    [GENERAL_FIELDS.BG_COLOR]: '#fff'
};

gui.remember(config);

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

mainEl.addEventListener('click', addCircle);

function addCircle (e) {
    const circle = new Circle({
        x: e.clientX,
        y: e.clientY
    });
    circles.push(circle);
    mainEl.appendChild(circle.el);

    generateGradients();
}

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

    setPosition () {
        this.el.style.setProperty('--x', `${this.x - this.config.size / 2}px`);
        this.el.style.setProperty('--y', `${this.y - this.config.size / 2}px`);
    }

    createGradient () {
        this.setSize();
        this.gradient = [`${this.config.size}px`, `${this.x}px ${this.y}px`, `rgb(${this.config.color})`, `${this.config.middle}%`];
    }

    onColor () {
        this.createGradient();

        generateGradients();
    }

    onSize () {
        this.setSize();
        this.setPosition();
        this.createGradient();

        generateGradients();
    }

    onMiddle () {
        this.createGradient();

        generateGradients();
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
