const gui = new dat.gui.GUI();

const CONFIG = {
    zoom: 0,
    sections: []
};

gui.remember(CONFIG);

gui.add(CONFIG, 'zoom', 0, 1000, 10)
    .onChange(() => {
        mainEl.style.transform = `translateZ(-${CONFIG.zoom}px)`;
    });

const mainEl = document.querySelector('main');

const sectionsFolder = gui.addFolder('Sections');
sectionsFolder.open();

const SECTIONS = [];
const COLORS = ['#f68', '#37b', '#b37', '#7b3', '#73b', '#3b7'];
const SHAPE_NAMES = {
    TRIANGLE: 'triangle',
    SLOPE: 'slope',
    CURVE: 'curve',
    WAVE: 'wave'
};
const SHAPES = {
    [SHAPE_NAMES.TRIANGLE]: ({x, invert}) => {
        if (invert) {
            return `M 0,100 L 0,0 L ${x},100 L 100,0 L 100,100 z`;
        }
        return `M 0,100 L ${x},0 L 100,100 z`;
    },
    [SHAPE_NAMES.SLOPE]: ({x, invert}) => {
        if (invert) {
            return `M 0,100 L 0,0 C ${x},0 100,50 100,100 z`;
        }
        return `M 0,100 C ${x},100 100,50 100,0 L 100,100 z`;
    },
    [SHAPE_NAMES.CURVE]: ({x, invert}) => {
        if (invert) {
            return `M 0,100 L 0,0 Q ${x},200 100,0 L 100,100 z`;
        }
        return `M 0,100 Q ${x},-100 100,100 z`;
    },
    [SHAPE_NAMES.WAVE]: ({x, invert}) => {
        if (invert) {
            return `M 0,100 L 0,0 C ${x/2},0 ${x/2},100 ${x},100 C ${(100 + x)/2},100 ${(100 + x)/2},0 100,0 L 100,100 z`;
        }
        return `M 0,100 C ${x/2},100 ${x/2},0 ${x},0 C ${(100 + x)/2},0 ${(100 + x)/2},100 100,100 z`;
    }
};
const FILTER_OPTIONS = ['off', 'up', 'down'];
const PIN_OPTIONS = ['off', 'in', 'out'];
const DUPLICATE_TITLE = 'Duplicate';

function createSection ({ parent, el, index }) {
    const config = {
        bgColor: COLORS[index],
        useImage: false
    };

    const section = new Section(config, el);

    const folder = parent.addFolder(`Section ${index}`);

    folder.addColor(config, 'bgColor')
        .onChange(section.update);
    folder.add(config, 'useImage')
        .onChange(section.update);

    config.top = createDivider({
        parent: folder,
        side: 'Top',
        section: el,
        index
    });
    config.bottom = createDivider({
        parent: folder,
        side: 'Bottom',
        section: el,
        index
    });

    CONFIG.sections.push(config);

    return section;
}

function createDivider ({ parent, section, side, index }) {
    const isTop = side.toLowerCase() === 'top';
    const DUPLICATE = isTop ? index ? DUPLICATE_TITLE : false : index < sectionElements.length -1 ? DUPLICATE_TITLE : false;
    const config = {
        active: false,
        shape: SHAPE_NAMES.TRIANGLE,
        color: '#06f',
        padding: 0,
        x: 50,
        y: 33,
        flip: false,
        invert: false,
        pattern: {
            active: true,
            repeat: 0,
            x: 0
        },
        stagger: {
            active: true,
            clones: 0,
            x: 0,
            y: 10,
            pin: PIN_OPTIONS[0],
            opacity: true,
            hue: FILTER_OPTIONS[0],
            saturation: FILTER_OPTIONS[0],
            brightness: FILTER_OPTIONS[0]
        }
    };

    if (DUPLICATE) {
        config[DUPLICATE] = () => divider.clone(SECTIONS[index + (isTop ? -1 : 1)].config[isTop ? 'bottom' : 'top']);
    }

    const el = section.querySelector(`.divider.${side.toLowerCase()}`);
    const folder = parent.addFolder(side);

    const divider = new Divider(config, el, folder, side, index);

    folder.add(config, 'active').onChange(divider.update);
    if (DUPLICATE) {
        folder.add(config, DUPLICATE);
    }
    folder.add(config, 'shape', Object.keys(SHAPES)).onChange(divider.update);
    folder.addColor(config, 'color').onChange(divider.update);
    folder.add(config, 'padding', 0, 400, 1).onChange(divider.update);
    folder.add(config, 'x', 0, 100, 1).onChange(divider.update);
    folder.add(config, 'y', 5, 50, 1).onChange(divider.update);
    folder.add(config, 'flip').onChange(divider.update);
    folder.add(config, 'invert').onChange(divider.update);

    const pattern = folder.addFolder('Pattern');
    pattern.add(config.pattern, 'active').onChange(divider.update);
    pattern.add(config.pattern, 'repeat', 0, 40, 1).onChange(divider.update);
    pattern.add(config.pattern, 'x', 0, 50, 1).onChange(divider.update);

    const stagger = folder.addFolder('Stagger');
    stagger.add(config.stagger, 'active').onChange(divider.update);
    stagger.add(config.stagger, 'clones', 0, 5, 1).onChange(divider.update);
    stagger.add(config.stagger, 'x', -50, 50, 1).onChange(divider.update);
    stagger.add(config.stagger, 'y', 0, 100, 1).onChange(divider.update);
    stagger.add(config.stagger, 'pin', PIN_OPTIONS).onChange(divider.update);
    stagger.add(config.stagger, 'opacity').onChange(divider.update);
    stagger.add(config.stagger, 'hue', FILTER_OPTIONS).onChange(divider.update);
    stagger.add(config.stagger, 'saturation', FILTER_OPTIONS).onChange(divider.update);
    stagger.add(config.stagger, 'brightness', FILTER_OPTIONS).onChange(divider.update);
    return config;
}

class Section {
    constructor (config, el) {
        this.config = config;
        this.el = el;

        this.update = this.update.bind(this);

        this.update();
    }

    update () {
        this.el.classList.toggle('has-image', this.config.useImage);
        this.el.style.setProperty('--bg-color', this.config.bgColor);
    }
}

class Divider {
    constructor (config, el, folder, side, index) {
        this.config = config;
        this.el = el;
        this.folder = folder;
        this.side = side.toLowerCase();
        this.index = index;

        this.update = this.update.bind(this);

        this.update();
    }

    update () {
        this.el.classList.toggle('active', this.config.active);
        this.el.style.setProperty('--div-bg-color', this.config.color);
        this.el.style.setProperty('--div-y', `${this.config.y}%`);
        this.el.style.setProperty('--div-padding', `${this.config.padding}px`);

        this.generateShape();
    }

    generateShape () {
        const { x, pattern, invert } = this.config;
        const { active, repeat } = pattern;
        const patternId = `pattern-${this.side}-${this.index}`;
        this.el.innerHTML = `<svg
    viewBox="0 0 100 100"
    width="100%"
    height="100%"
    preserveAspectRatio="none">
    <defs>
        <pattern
            id="${patternId}"
            viewBox="0 0 100 100"
            width="${active ? 100 / (repeat + 1) : 100}%"
            height="100%"
            preserveAspectRatio="none"
            patternTransform="translate(${pattern.x})">
          <path d="${SHAPES[this.config.shape]({ x, invert })}" />
        </pattern>
    </defs>
    <g transform="${this.getTransform()}">
        ${this.getRects(patternId)}
    </g>
</svg>`;
    }

    getTransform () {
        const isTop = this.side === 'top';
        const isFlipped = this.config.flip;

        return `scale(${isFlipped ? -1 : 1} ${isTop ? -1 : 1}) translate(${isFlipped ? -100 : 0} ${isTop ? -100 : 0})`;
    }

    getFilter (index, length, hue, saturation, brightness) {
        const factor = index / length;
        const [OFF, UP] = FILTER_OPTIONS;
        return `${hue === OFF
            ? ''
            : `hue-rotate(${1 - factor * (hue === UP ? 180 : -180)}deg)`
        } ${saturation === OFF
            ? ''
            : `saturate(${(saturation === UP ? 1 + factor : 1 - factor) * 100}%)`
        } ${brightness === OFF
            ? ''
            : `brightness(${(brightness === UP ? 1 + factor : 1 - factor) * 100}%)`
        }`;
    }

    getRects (patternId) {
        const {
            active,
            clones,
            x,
            y,
            pin,
            opacity,
            hue,
            saturation,
            brightness
        } = this.config.stagger;
        const pinIn = pin === PIN_OPTIONS[1];
        const pinOut = pin === PIN_OPTIONS[2];
        const rectsNum = active ? clones + 1 : 1;
        let rects = '';

        for (let i = 0; i < rectsNum; i++) {
            const fillOpacity = opacity ? 1 - i / rectsNum : 1;
            const dx = x * i;
            const dy = y * i;
            const filter = this.getFilter(i, rectsNum, hue, saturation, brightness);
            rects = `<rect style="filter: ${filter};" fill="url(#${patternId})" fill-opacity="${fillOpacity}" x="${dx}" y="${pinIn ? 0 : -dy}" width="100" height="${100 + (pinOut ? dy : pinIn ? - dy : 0)}" />${
                i && !pinOut ? `<rect width="100" height="${dy}" x="${dx}" y="${100 - dy}" fill-opacity="${fillOpacity}" style="filter: ${filter}; fill: var(--div-bg-color)"/>` : ''
            }` + rects;
        }

        return rects;
    }

    clone (config) {
        Object.assign(
            this.config,
            {
                ...config,
                pattern: Object.assign(this.config.pattern, config.pattern),
                stagger: Object.assign(this.config.stagger, config.stagger),
                [DUPLICATE_TITLE]: this.config[DUPLICATE_TITLE] || null
            }
        );

        this.update();

        this.folder.updateDisplay();
    }
}

const sectionElements = [...document.querySelectorAll('section')];

sectionElements.forEach((el, index) => {
    SECTIONS.push(createSection({ parent: sectionsFolder, el, index }));
});
