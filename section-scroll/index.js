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

const defaultSettings = {
    [EFFECTS_CONFIG.TRANSLATE_X.LABEL]: 0,
    [EFFECTS_CONFIG.TRANSLATE_Y.LABEL]: 0,
    [EFFECTS_CONFIG.ROTATE.LABEL]: 0,
    [EFFECTS_CONFIG.FOLD.LABEL]: 0,
    [EFFECTS_CONFIG.SCALE.LABEL]: 1,
    [EFFECTS_CONFIG.OPACITY.LABEL]: 1,
    [EFFECTS_CONFIG.GHOST.LABEL]: true,
}

const speedSettings = {
    [EFFECTS_CONFIG.SPEED.LABEL]: 0
}
const offsetSettings = {
    [EFFECTS_CONFIG.OFFSET.LABEL]: 0
}
const config = {
    [SECTION_1]: {
        [SPEED]: speedSettings,
        [OFFSET]: offsetSettings,
        [PHOTO]: defaultSettings,
        [TEXT]: defaultSettings,
    },
    [SECTION_2]: {
        [SPEED]: speedSettings,
        [OFFSET]: offsetSettings,
        [PHOTO]: defaultSettings,
        [TEXT]: defaultSettings,
        [SVG]: defaultSettings,
    }
};


const sections = [, ...document.querySelectorAll('section')];
const rects = getSectionsRecs();
console.log(rects);
const effectDuration = {
    [SECTION_1]: window.innerHeight,
    [SECTION_2]: window.innerHeight,
    [SECTION_3]: window.innerHeight,
}
const effectDefaultOffset = {
    [SECTION_1]: rects[1],
    [SECTION_2]: rects[2],
    [SECTION_3]: rects[3],
}
const effectStartOffset = {
    [SECTION_1]: rects[1],
    [SECTION_2]: rects[2],
    [SECTION_3]: rects[3],
}

const root = document.documentElement;

root.style.setProperty('--opacity', 0);
root.style.setProperty('--x-trans', '0px');
root.style.setProperty('--y-trans', '0px');
root.style.setProperty('--rotate', '0deg');
root.style.setProperty('--rotate-y', '0deg');
root.style.setProperty('--scale', 0);
root.style.setProperty('--pos', '0');

gui.remember(config);
createSectionFolders();
init();

function getSectionsRecs () {
    return [...sections.map(section => {
       return section.offsetTop
    })];
}

// function createScenes () {
//     [SECTION_1, SECTION_2, SECTION_3].map((section, index) => ({
//         start: effectStartOffset[section],
//         duration: effectDuration[section],
//         target: [...sections[index+1].querySelectorAll('.actual')],
//         effect: function (scene, pos) {
//             scene.target.forEach(e => e.style.setProperty('--pos', pos));
//         }
//     }))
// }

function init () {
    const scroll = new Scroll({
        scenes: 
        [
            {
                start: effectStartOffset[SECTION_1],
                duration: effectDuration[SECTION_1],
                target: [...sections[1].querySelectorAll('.actual')],
                effect: function (scene, pos) {
                    scene.target.forEach(e => e.style.setProperty('--pos', pos));
                }
            },
            {
                start: effectStartOffset[SECTION_2],
                duration: effectDuration[SECTION_2],
                target: [...sections[2].querySelectorAll('.actual')],
                effect: function (scene, pos) {
                    scene.target.forEach(e => e.style.setProperty('--pos', pos));
                }
            },
            {
                start: effectStartOffset[SECTION_3],
                duration: effectDuration[SECTION_3],
                target: [...sections[3].querySelectorAll('.actual')],
                effect: function (scene, pos) {
                    scene.target.forEach(e => e.style.setProperty('--pos', pos));
                }
            },
        ]
    });

    scroll.on();
}

function createSectionFolders() {
    const section1Folder = gui.addFolder(SECTION_1)
    const section2Folder = gui.addFolder(SECTION_2)

    addScrollSpeed(section1Folder, SECTION_1);
    addScrollSpeed(section2Folder, SECTION_2);


    const photo1 = section1Folder.addFolder(PHOTO);
    addScrollEffects(photo1, PHOTO, 'img', 1, SECTION_1)
    const text1 = section1Folder.addFolder(TEXT);
    addScrollEffects(text1, TEXT, 'h1', 1, SECTION_1)
    section1Folder.open();

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

function addScrollSpeed (sectionFolder, sectionName) {
    sectionFolder.add(config[sectionName][SPEED], ...Object.values(EFFECTS_CONFIG.SPEED))
    .onChange(val => {
        effectDuration[sectionName] = window.innerHeight / val
        init();
    })
    sectionFolder.add(config[sectionName][OFFSET], ...Object.values(EFFECTS_CONFIG.OFFSET))
    .onChange(val => {
        effectStartOffset[sectionName] = effectDefaultOffset[sectionName] + window.innerHeight * val
        init();
    })
}
