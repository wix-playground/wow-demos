const gui = new dat.gui.GUI();

const CONFIG_KEYS = {
    SAVE: 'Save to File',
    LOAD: 'Load from Files',
    STRIP_HEIGHT: 'Strip height',
    KEEP_AR: 'Keep aspect-ratio'
};

const CONFIG = {
    [CONFIG_KEYS.SAVE]: function() {
        download(getValues(), `shape-dividers-${getTimeStamp()}.txt`);
    },
    [CONFIG_KEYS.LOAD]: function() {
        upload(); // stub
    },
    zoom: 0,
    sections: {}
};

gui.remember(CONFIG);

gui.add(CONFIG, CONFIG_KEYS.SAVE);
gui.add(CONFIG, CONFIG_KEYS.LOAD);

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
    ELLIPSE: 'ellipse',
    CURVE: 'curve',
    WAVE: 'wave'
};
const SHAPES = {
    [SHAPE_NAMES.TRIANGLE]: ({x, invert}) => {
        if (invert) {
            return `<svg viewBox="0 0 300 200"><g><path d="M 0,200 L 0,0 L ${300 * x / 100},200 L 300,0 L 300,200 z" /></g></svg>`;
        }
        return `<svg viewBox="0 0 300 200"><g><path d="M 0,200 L ${300 * x / 100},0 L 300,200 z" /></g></svg>`;
    },
    [SHAPE_NAMES.SLOPE]: ({x, invert}) => {
        if (invert) {
            return `<svg viewBox="0 0 300 200"><g><path d="M 0,200 L 0,0 C ${300 * x / 100},0 300,0 300,200 z" /></g></svg>`;
        }
        return `<svg viewBox="0 0 300 200"><g><path d="M 0,200 C ${300 * x / 100},200 300,200 300,0 L 300,200 z" /></g></svg>`;
    },
    [SHAPE_NAMES.ELLIPSE]: ({x, invert}) => {
        if (invert) {
            return `<svg viewBox="0 0 300 200"><g><path d="M 0,200 L 0,0 Q ${300 * x / 100},400 300,0 L 300,200 z" /></g></svg>`;
        }
        return `<svg viewBox="0 0 300 200"><g><path d="M 0,200 Q ${300 * x / 100},-200 300,200 z" /></g></svg>`;
    },
    [SHAPE_NAMES.CURVE]: ({x, y, invert}) => {
        if (invert) {
            return `<svg viewBox="0 0 300 200"><g><path d="M 0,200 L 0,0 C ${300 * x / 2 / 100},${200 * y / 100} ${300 * x / 2 / 100},${200 * (1 - y / 100)} 300,200 z" /></g></svg>`;
        }
        return `<svg viewBox="0 0 300 200"><g><path d="M 0,200 C ${300 * x / 2 / 100},${200 * (1 - y / 100)} ${300 * x / 2 / 100},${200 * y / 100} 300,0 L 300,200 z" /></g></svg>`;
    },
    [SHAPE_NAMES.WAVE]: ({x, invert}) => {
        if (invert) {
            return `<svg viewBox="0 0 300 200"><g><path d="M 0,200 L 0,0 C ${300 * x / 2 / 100},0 ${300 * x / 2 / 100},200 ${300 * x / 100},200 C ${(300 * (1 + x / 100)) / 2},200 ${(300 * (1 + x / 100)) / 2},0 300,0 L 300,200 z" /></g></svg>`;
        }
        return `<svg viewBox="0 0 300 200"><g><path d="M 0,200 C ${300 * x / 2 / 100},200 ${300 * x / 2 / 100},0 ${300 * x / 100},0 C ${(300 * (1 + x / 100)) / 2},0 ${(300 * (1 + x / 100)) / 2},200 300,200 z" /></g></svg>`;
    }
};
const FILTER_OPTIONS = ['off', 'up', 'down'];
const PIN_OPTIONS = ['off', 'in', 'out'];
const DUPLICATE_TITLE = 'Duplicate';

const PRESETS_NAMES = {
    BRUSH: {
        PAINT: 'paint',
        SKETCH: 'sketch',
        WAVES: 'waves',
        TAPE: 'tape',
        STRIPES: 'stripes',
        LAVA: 'lava'
    },
    PATTERN: {
        ZIPPER: 'zipper',
        TETRIS: 'tetris',
        DROPS: 'drops',
        PEARLS: 'pearls'
    }
};
const PRESETS = {
    [PRESETS_NAMES.BRUSH.PAINT]: './svg/Dividers_FIN-18.svg',
    [PRESETS_NAMES.BRUSH.SKETCH]: './svg/Dividers_FIN-19.svg',
    [PRESETS_NAMES.BRUSH.WAVES]: './svg/Dividers_FIN-20.svg',
    [PRESETS_NAMES.BRUSH.TAPE]: './svg/Dividers_FIN-21.svg',
    [PRESETS_NAMES.BRUSH.STRIPES]: './svg/Dividers_FIN-22.svg',
    [PRESETS_NAMES.BRUSH.LAVA]: './svg/Dividers_FIN-23.svg',
    [PRESETS_NAMES.PATTERN.ZIPPER]: './svg/Dividers_FIN-24.svg',
    [PRESETS_NAMES.PATTERN.TETRIS]: './svg/Dividers_FIN-25.svg',
    [PRESETS_NAMES.PATTERN.DROPS]: './svg/Dividers_FIN-26.svg',
    [PRESETS_NAMES.PATTERN.PEARLS]: './svg/Dividers_FIN-27.svg'
};

function fetchSVG(url) {
    return fetch(url).then(result => result.text());
}

Object.entries(PRESETS)
    .map(([key, url]) => [key, fetchSVG(url)])
    .forEach(([key, result]) => {
        result.then(svg => {
            PRESETS[key] = svg;
        });
    });

function createSection ({ parent, el, index }) {
    const config = {
        bgColor: COLORS[index],
        useImage: false,
        [CONFIG_KEYS.STRIP_HEIGHT]: 100
    };

    gui.remember(config);

    const section = new Section(config, el);

    const folder = parent.addFolder(`Section ${index}`);

    folder.addColor(config, 'bgColor')
        .onChange(section.update);
    folder.add(config, 'useImage')
        .onChange(section.update);
    folder.add(config, CONFIG_KEYS.STRIP_HEIGHT, 50, 300, 10)
        .onChange(() => {
            el.style.setProperty('--strip-height', `${config[CONFIG_KEYS.STRIP_HEIGHT]}vh`);
        });

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

    gui.remember(config.top);
    gui.remember(config.bottom);

    CONFIG.sections[`Section ${index}`] = config;

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
        y: 0,
        height: 33,
        flip: false,
        invert: false,
        [CONFIG_KEYS.KEEP_AR]: false,
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
            'hue limit': 180,
            saturation: FILTER_OPTIONS[0],
            brightness: FILTER_OPTIONS[0]
        },
        presets: {
            active: false,
            preset: PRESETS_NAMES.BRUSH.PAINT
        }
    };

    gui.remember(config);
    gui.remember(config.pattern);
    gui.remember(config.stagger);
    gui.remember(config.presets);

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
    folder.add(config, 'y', 0, 100, 1).onChange(divider.update);
    folder.add(config, 'height', 5, 50, 1).onChange(divider.update);
    folder.add(config, 'flip').onChange(divider.update);
    folder.add(config, 'invert').onChange(divider.update);
    folder.add(config, CONFIG_KEYS.KEEP_AR).onChange(divider.update);

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
    stagger.add(config.stagger, 'hue limit', 90, 360, 10).onChange(divider.update);
    stagger.add(config.stagger, 'hue', FILTER_OPTIONS).onChange(divider.update);
    stagger.add(config.stagger, 'saturation', FILTER_OPTIONS).onChange(divider.update);
    stagger.add(config.stagger, 'brightness', FILTER_OPTIONS).onChange(divider.update);

    const presets = folder.addFolder('Presets');
    presets.add(config.presets, 'active').onChange(divider.update);
    presets.add(config.presets, 'preset', [...Object.values(PRESETS_NAMES.BRUSH), ...Object.values(PRESETS_NAMES.PATTERN)]).onChange(divider.update);

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
        this.el.style.setProperty('--div-height', `${this.config.height}%`);
        this.el.style.setProperty('--div-padding', `${this.config.padding}px`);

        this.generateShape();
    }

    generateShape () {
        const { pattern, presets } = this.config;
        const keepAspectRatio = this.config[CONFIG_KEYS.KEEP_AR];
        const { active, repeat } = pattern;
        const patternId = `pattern-${this.side}-${this.index}`;
        const isBrush = this.isBrush();
        const isPattern = presets.active && !isBrush;
        let brushViewBox = isBrush && PRESETS[presets.preset].match(/viewBox="([\d\s.]+)"/)[1];
        let patternViewBox = isPattern && PRESETS[presets.preset].match(/viewBox="([\d\s.]+)"/)[1];
        let patternContent = isPattern ? PRESETS[presets.preset].match(/^<svg[^>]+>(.*)<\/svg>$/m)[1] : '';

        const shapeContent = this.getShapeContent();
        const isRepeatInAspectRatio = active && keepAspectRatio;
        let boundingBox;

        if (isRepeatInAspectRatio) {
            boundingBox = this.el.getBoundingClientRect();
        }
        else if (keepAspectRatio) {
            const bBox = this.el.getBoundingClientRect();
            this.el.style.setProperty('--div-height', `${bBox.width * this.viewBox[3] / this.viewBox[2]}px`);
        }

        this.viewBox = isBrush
            ? brushViewBox.split(' ').map(x => +x)
            : isPattern
                ? patternViewBox.split(' ').map(x => +x)
                : this.viewBox || [0, 0, 100, 100];

        this.el.innerHTML = `<svg
    viewBox="${isRepeatInAspectRatio ? `0 0 ${boundingBox.width} ${boundingBox.height}` : this.viewBox.join(' ')}"
    width="100%"
    height="100%"
    preserveAspectRatio="${brushViewBox ? 'xMidYMid slice' : isPattern ? 'xMinYMin' : keepAspectRatio ? 'xMinYMin' : 'none'}">
    <defs>
        ${isBrush
            ? PRESETS[presets.preset].replace('Layer_1', patternId)
            : `<pattern
                id="${patternId}"
                viewBox="${this.viewBox.join(' ')}"
                width="${keepAspectRatio ? (active ? (this.viewBox[2] / this.viewBox[3]) / (boundingBox.width / boundingBox.height) * 100 : 100) : (active ? 100 / (repeat + 1) : 100)}%"
                height="100%"
                ${isPattern || keepAspectRatio ? '' : 'preserveAspectRatio="none"'}
                ${isPattern || keepAspectRatio ? 'patternUnits="userSpaceOnUse"' : ''}
                patternTransform="translate(${(isRepeatInAspectRatio ? boundingBox.width : this.viewBox[2]) * pattern.x / 100})">
                ${isPattern ? `<g>${patternContent}</g>` : shapeContent}
            </pattern>`
        }
    </defs>
    <g transform="${this.getTransform()}">
        ${this.getRects(patternId, boundingBox)}
    </g>
</svg>`;
    }

    getShapeContent () {
        const { x, y, invert } = this.config;
        const content = SHAPES[this.config.shape]({ x, y, invert });

        this.viewBox = content.match(/viewBox="([\d\s.]+)"/)[1].split(' ').map(x => +x);

        return content.match(/^<svg[^>]+>(.*)<\/svg>$/m)[1];
    }

    getTransform () {
        const isTop = this.side === 'top';
        const isFlipped = this.config.flip;
        const [,, width, height] = this.viewBox;

        return `scale(${isFlipped ? -1 : 1} ${isTop ? -1 : 1}) translate(${isFlipped ? -width : 0} ${isTop ? -height : 0})`;
    }

    getFilter (index, length, hue, saturation, brightness, hueLimit) {
        const factor = index / length;
        const [OFF, UP] = FILTER_OPTIONS;
        return `${hue === OFF
            ? ''
            : `hue-rotate(${1 - factor * (hue === UP ? 1 : -1) * hueLimit}deg)`
        } ${saturation === OFF
            ? ''
            : `saturate(${(saturation === UP ? 1 + factor : 1 - factor) * 100}%)`
        } ${brightness === OFF
            ? ''
            : `brightness(${(brightness === UP ? 1 + factor : 1 - factor) * 100}%)`
        }`;
    }

    getRects (patternId, boundingBox) {
        const {
            active,
            clones,
            x,
            y,
            pin,
            opacity,
            'hue limit': hueLimit,
            hue,
            saturation,
            brightness
        } = this.config.stagger;
        const pinIn = pin === PIN_OPTIONS[1];
        const pinOut = pin === PIN_OPTIONS[2];
        const rectsNum = active ? clones + 1 : 1;
        const isBrush = this.isBrush();
        let rects = '';

        for (let i = 0; i < rectsNum; i++) {
            // values here are not a simple linear interpolation since we take into account overlapping layers that composite with each other
            const fillOpacity = opacity ? 1 - i / (i + 1) : 1;
            const dx = x * i;
            const dy = y * i;
            const filter = this.getFilter(i, rectsNum, hue, saturation, brightness, hueLimit);
            rects = this.getRect(i, isBrush, filter, patternId, fillOpacity, dx, dy, pinIn, pinOut, boundingBox) + rects;
        }

        return rects;
    }

    isBrush () {
        return this.config.presets.active && Object.values(PRESETS_NAMES.BRUSH).includes(this.config.presets.preset);
    }

    getRect (i, isBrush, filter, patternId, fillOpacity, dx, dy, pinIn, pinOut, boundingBox) {
        let width, height;

        if (boundingBox) {
            width = boundingBox.width;
            height = boundingBox.height;
        }
        else {
            [, , width, height] = this.viewBox;
        }

        if (isBrush) {
            const x = this.viewBox[2] * (this.config.x / 100 - 0.5);
            return `<use x="${x + dx}" y="${-dy}" href="#${patternId}" style="filter: ${filter}; fill: var(--div-bg-color); fill-opacity: ${fillOpacity}"></use>${
                i ? `<rect width="${width}" height="${dy}" x="${dx}" y="${height - dy}" fill-opacity="${fillOpacity}" style="filter: ${filter}; fill: var(--div-bg-color)"/>` : ''
            }`;
        }

        const isPattern = this.config.presets.active;
        if (isPattern) {
            return `<rect style="filter: ${filter};" fill="url(#${patternId})" fill-opacity="${fillOpacity}" x="${dx}" y="${pinIn ? 0 : -dy}" width="1500" height="${height}" />${
                i ? `<rect width="${width}" height="${dy}" x="${dx}" y="${height - dy}" fill-opacity="${fillOpacity}" style="filter: ${filter}; fill: var(--div-bg-color)"/>` : ''
            }`;
        }

        return `<rect style="filter: ${filter};" fill="url(#${patternId})" fill-opacity="${fillOpacity}" x="${dx}" y="${pinIn ? 0 : -dy}" width="${width}" height="${height + (pinOut ? dy : pinIn ? - dy : 0)}" />${
            i && !pinOut ? `<rect width="${width}" height="${dy}" x="${dx}" y="${height - dy}" fill-opacity="${fillOpacity}" style="filter: ${filter}; fill: var(--div-bg-color)"/>` : ''
        }`;
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

/**
 * Get a date string
 * @returns {string} YYYY-MM-DD-HH:MM:SS
 */
function getTimeStamp () {
    const date = new Date();
    return `${date.toISOString().split('T')[0]}-${date.toLocaleTimeString('en-US', { hour12: false })}`
}

/**
 * Download data to a file
 * https://stackoverflow.com/a/30832210
 * @param {string} data the file contents
 * @param {string} filename the file to save
 * @param {string} [type='text/plain'] file mime type ('text/plain' etc.)
 */
function download (data, filename, type='text/plain') {
    const file = new Blob([data], {type});
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);

    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function parseFile (file) {
    const reader = new FileReader();

    reader.addEventListener('load', function (e) {
        console.log('loading', file.name);
        setValues(JSON.parse(e.target.result));
        gui.saveAs(file.name);
    });

    reader.readAsBinaryString(file);
}

/**
 * Read data from a text file
 * https://stackoverflow.com/a/45815534
 */
function upload () {
    //alert('Not implemented yet')
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'text/plain';
    input.multiple = 'multiple';
    input.onchange = function () {
        for (const file of this.files || []) {
            if (file) {
                parseFile(file);
            }
        }
    };
    document.body.appendChild(input);

    input.click();
    setTimeout(function() {
        document.body.removeChild(input);
    }, 0);
}



/**
 * @param {Array<Object>} rememberedValues in the format of the output of getValues()
 * [
 *   {
 *     "someKey": "value",
 *     "otherKey": "otherValue"
 *   },
 *   {
 *     "thirdKey": "thirdValue"
 *   },
 *   ...
 * ]
 */
function setValues (rememberedValues) {
    rememberedValues.forEach((values, index) => {
        Object.keys(values).forEach((key) => {
            const controller = gui.__rememberedObjectIndecesToControllers[index][key];
            controller && controller.setValue(values[key]);
        });
    });
}

function getValues () {
    return JSON.stringify(gui.__rememberedObjects, null, 2);
}

function dragEnter (e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragOver (e) {
    e.stopPropagation();
    e.preventDefault();
}

function drop (e) {
    e.stopPropagation && e.stopPropagation();
    e.preventDefault && e.preventDefault();

    const files = e.dataTransfer.files;
    const file = files && files[0];

    parseFile(file);
}

// drag n` drop handlers
mainEl.addEventListener('dragenter', dragEnter, false);
mainEl.addEventListener('dragover', dragOver, false);
mainEl.addEventListener('drop', drop, false);
