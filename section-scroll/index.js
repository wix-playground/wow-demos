import { Scroll } from './two.5.js';

const gui = new dat.gui.GUI();

const SECTION_1 = 'section 1';
const SECTION_2 = 'section 2';
const SECTION_3 = 'section 3';
const SECTION_4 = 'section 4';
const SECTION_5 = 'section 5';

const PHOTO = 'photo';
const TEXT = 'text';
const SVG = 'svg';
const SPEED = 'speed';
const OFFSET = 'offset';

const EFFECTS_CONFIG = {
    TRANSLATE_X: {
        LABEL: 'Translate X',
        MIN: -window.innerWidth,
        MAX: window.innerWidth,
        STEP: 5,
    },
    TRANSLATE_Y: {
        LABEL: 'Translate Y',
        MIN: -window.innerHeight,
        MAX: window.innerHeight,
        STEP: 5,
    },
    ROTATE: {
        LABEL: 'Rotate',
        MIN: -360,
        MAX: 360,
        STEP: 5,
    },
    FOLD: {
        LABEL: 'Fold',
        MIN: -360,
        MAX: 360,
        STEP: 5,
    },
    SCALE: {
        LABEL: 'Scale',
        MIN: 0,
        MAX: 2,
        STEP: .1,
    },
    OPACITY: {
        LABEL: 'Opacity',
        MIN: 0,
        MAX: 1,
        STEP: .1,
    },
    GHOST: {
        LABEL: 'Ghost',
        VALUE: true,
    },
    SPEED: {
        LABEL: 'Speed',
        MIN: 0,
        MAX: 3,
        STEP: .25,
    },
    OFFSET: {
        LABEL: 'Offset',
        MIN: -0.8,
        MAX: 0.8,
        STEP: .1,
    }
};
const guiSettings = {
    transformations: {
        [EFFECTS_CONFIG.TRANSLATE_X.LABEL]: 0,
        [EFFECTS_CONFIG.TRANSLATE_Y.LABEL]: 0,
        [EFFECTS_CONFIG.ROTATE.LABEL]: 0,
        [EFFECTS_CONFIG.FOLD.LABEL]: 0,
        [EFFECTS_CONFIG.SCALE.LABEL]: 1,
        [EFFECTS_CONFIG.OPACITY.LABEL]: 1,
        [EFFECTS_CONFIG.GHOST.LABEL]: true,
    },
    speed: {
        [EFFECTS_CONFIG.SPEED.LABEL]: 0
    },
    offset: {
        [EFFECTS_CONFIG.OFFSET.LABEL]: 0
    }
}
const config = {
    [SECTION_1]: {
        [SPEED]: guiSettings.speed,
        [OFFSET]: guiSettings.offset,
        [PHOTO]: guiSettings.transformations,
        [TEXT]: guiSettings.transformations,
    },
    [SECTION_2]: {
        [SPEED]: guiSettings.speed,
        [OFFSET]: guiSettings.offset,
        [PHOTO]: guiSettings.transformations,
        [TEXT]: guiSettings.transformations,
        [SVG]: guiSettings.transformations,
    }
};
const sections = [, ...document.querySelectorAll('section')];
const sectionOffsets = [...sections.map(sec => sec.offsetTop)];
const effectDuration = {
    [SECTION_1]: Number.MAX_VALUE,
    [SECTION_2]: Number.MAX_VALUE,
    [SECTION_3]: Number.MAX_VALUE,
}
const effectStartOffset = {
    [SECTION_1]: {
        default: sectionOffsets[1],
        current: sectionOffsets[1],
    },
    [SECTION_2]: {
        default: sectionOffsets[2],
        current: sectionOffsets[2],
    },
    [SECTION_3]: {
        default: sectionOffsets[3],
        current: sectionOffsets[3],
    },
}

const initStyles = {
    '--opacity': 0,
    '--x-trans': '0px',
    '--y-trans': '0px',
    '--rotate': '0deg',
    '--rotate-y': '0deg',
    '--scale': 0,
    '--pos': '0',
}

const root = document.documentElement;
Object.entries(initStyles).forEach(([property, value]) => {
    root.style.setProperty(property, value);
});

gui.remember(config);
createSectionFolders();
init();

function createScenes () {
    return [SECTION_1, SECTION_2, SECTION_3].map((section, index) => ({
        start: effectStartOffset[section].current,
        duration: effectDuration[section],
        target: [...sections[index + 1].querySelectorAll('.actual')],
        effect: function (scene, pos) {
            scene.target.forEach(e => e.style.setProperty('--pos', pos));
        }
    }))
}

function init () {
    const scroll = new Scroll({
        scenes: createScenes()
    });

    scroll.on();
}

function createSectionFolders() {
    const section1Folder = gui.addFolder(SECTION_1)
    const section2Folder = gui.addFolder(SECTION_2)
    section1Folder.open();

    addSpeedAndOffset(section1Folder, SECTION_1);
    addSpeedAndOffset(section2Folder, SECTION_2);


    const photo1 = section1Folder.addFolder(PHOTO);
    addScrollEffects(photo1, PHOTO, 'img', 1, SECTION_1)
    const text1 = section1Folder.addFolder(TEXT);
    addScrollEffects(text1, TEXT, 'h1', 1, SECTION_1)

    const photo2 = section2Folder.addFolder(PHOTO);
    addScrollEffects(photo2, PHOTO, 'img', 2, SECTION_2)
    const text2 = section2Folder.addFolder(TEXT);
    addScrollEffects(text2, TEXT, 'h6', 2, SECTION_2)
    const svg2 = section2Folder.addFolder(SVG);
    addScrollEffects(svg2, SVG, 'svg', 2, SECTION_2)
}

function addScrollEffects (element, name, type, index, section) {
    element.add(config[section][name], ...Object.values(EFFECTS_CONFIG.TRANSLATE_X))
    .onChange(val => {
        const elements = [...sections[index].querySelectorAll(type)];
        elements.forEach(e => e.style.setProperty('--x-trans', `${val}px`));
        init();
    })
    element.add(config[section][name], ...Object.values(EFFECTS_CONFIG.TRANSLATE_Y))
        .onChange(val => {
            const elements = [...sections[index].querySelectorAll(type)];
            elements.forEach(e => e.style.setProperty('--y-trans', `${val}px`));
            init();
        })
    element.add(config[section][name], ...Object.values(EFFECTS_CONFIG.ROTATE))
        .onChange(val => {
            const elements = [...sections[index].querySelectorAll(type)];
            elements.forEach(e => e.style.setProperty('--rotate', `${val}deg`));
            init();
        })
    element.add(config[section][name], ...Object.values(EFFECTS_CONFIG.FOLD))
        .onChange(val => {
            const elements = [...sections[index].querySelectorAll(type)];
            elements.forEach(e => e.style.setProperty('--rotate-y', `${val}deg`));
            init();
        })
    element.add(config[section][name], ...Object.values(EFFECTS_CONFIG.SCALE))
        .onChange(val => {
            const elements = [...sections[index].querySelectorAll(type)];
            elements.forEach(e => e.style.setProperty('--scale', val - 1));
            init();
        })
    element.add(config[section][name], ...Object.values(EFFECTS_CONFIG.OPACITY))
        .onChange(val => {
            const elements = [...sections[index].querySelectorAll(type)];
            elements.forEach(e => e.style.setProperty('--opacity', val - 1));
            init();
        })
    element.add(config[section][name], ...Object.values(EFFECTS_CONFIG.GHOST))
        .onChange(showGhost => {
            const elements = [...sections[index].querySelectorAll(type)];
            elements.forEach(e => e.style.setProperty('--no-ghost', showGhost ? .1 : 0));
            init();
        })
}

function addSpeedAndOffset (sectionFolder, sectionName) {
    sectionFolder.add(config[sectionName][SPEED], ...Object.values(EFFECTS_CONFIG.SPEED))
    .onChange(val => {
        effectDuration[sectionName] = window.innerHeight / val
        init();
    })
    sectionFolder.add(config[sectionName][OFFSET], ...Object.values(EFFECTS_CONFIG.OFFSET))
    .onChange(val => {
        effectStartOffset[sectionName].current = effectStartOffset[sectionName].default + window.innerHeight * val
        init();
    })
}
