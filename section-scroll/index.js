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
    IN_ANIMATION: {
        LABEL: 'In Animation',
        VALUE: false,
    },
    SPEED: {
        LABEL: 'Speed',
        MIN: 0,
        MAX: 3,
        STEP: .25,
    },
    OFFSET: {
        LABEL: 'Offset',
        MIN: -1,
        MAX: 1,
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
        [EFFECTS_CONFIG.IN_ANIMATION.LABEL]: false,
        [EFFECTS_CONFIG.SPEED.LABEL]: 0,
        [EFFECTS_CONFIG.OFFSET.LABEL]: 0,
    }
}
const config = {};
const effectDuration = {}
const effectStartOffset = {}
const effectsIsInAnimation = {}
const sections = [...document.querySelectorAll('section')];
const sectionOffsets = sections.map(sec => sec.offsetTop);
const root = document.documentElement;
const initStyles = {
    '--opacity': 0,
    '--x-trans': '0px',
    '--y-trans': '0px',
    '--rotate': '0deg',
    '--rotate-y': '0deg',
    '--scale': 0,
    '--pos': '0',
}
//======================== main ========================
resetStyles(root)
start();
gui.remember(config);
init();

//====================== main-end ======================

function start () {
    sections.forEach((section, index) => {
        const sectionName = `Section-${index+1}`;
        const sectionFolder = gui.addFolder(sectionName);
        const sectionElements = [...section.querySelectorAll('.actual')]
        sectionElements.forEach((element, i) => {
            const elemName = `${element.tagName}-${i}`;
            const elemFolder = sectionFolder.addFolder(elemName);
            config[sectionName] = {...config[sectionName], ...{[elemName]: guiSettings.transformations}};
            effectStartOffset[sectionName] = {...effectStartOffset[sectionName], ...{[elemName]: {default: sectionOffsets[index], current: sectionOffsets[index]}}};
            effectDuration[sectionName] = {...effectDuration[sectionName], ...{[elemName]: Number.MAX_VALUE}};
            effectsIsInAnimation[sectionName] = {...effectsIsInAnimation[sectionName], ...{[elemName]: false}};
            addScrollEffects(element, sectionName, elemFolder, elemName);
            addGhost(element)
        })
    })
}
function addGhost (element) {
    let clone = element.cloneNode(true);
    clone.setAttribute("class", "ghost");
    element.insertAdjacentElement("afterend", clone);
}

function createScenes () {
    const scenes = [];
    sections.forEach((section, index) => {
        const sectionName = `Section-${index+1}`
        const sectionElements = [...section.querySelectorAll('.actual')]
        sectionElements.forEach((element, i) => { 
            const elemName = `${element.tagName}-${i}`;
            const isInAnimation = effectsIsInAnimation[sectionName][elemName];
            scenes.push({
                start: effectStartOffset[sectionName][elemName].current,
                duration: effectDuration[sectionName][elemName],
                target: element,
                effect: (scene, pos) => scene.target.style.setProperty('--pos', isInAnimation ? 1 - pos : pos)
            })
        })
    })
    return scenes;
}

function init () {
    const scroll = new Scroll({
        scenes: createScenes()
    });
    scroll.on();
}

function addScrollEffects (element, sectionName, elemFolder, elemName) {
    elemFolder.add(config[sectionName][elemName], ...Object.values(EFFECTS_CONFIG.TRANSLATE_X))
    .onChange(val => {
        const isInAnimation = effectsIsInAnimation[sectionName][elemName];
        element.style.setProperty('--x-trans', `${val}px`);
        if (!isInAnimation) element.nextElementSibling.style.setProperty('--x-trans', `${val}px`);
        init();
    })
    elemFolder.add(config[sectionName][elemName], ...Object.values(EFFECTS_CONFIG.TRANSLATE_Y))
    .onChange(val => {
        const isInAnimation = effectsIsInAnimation[sectionName][elemName];
        element.style.setProperty('--y-trans', `${val}px`);
        if (!isInAnimation) element.nextElementSibling.style.setProperty('--y-trans', `${val}px`);
        init();
    })
    elemFolder.add(config[sectionName][elemName], ...Object.values(EFFECTS_CONFIG.ROTATE))
    .onChange(val => {
        const isInAnimation = effectsIsInAnimation[sectionName][elemName];
        element.style.setProperty('--rotate', `${val}deg`);
        if (!isInAnimation) element.nextElementSibling.style.setProperty('--rotate', `${val}deg`);
        init();
    })
    elemFolder.add(config[sectionName][elemName], ...Object.values(EFFECTS_CONFIG.FOLD))
    .onChange(val => {
        const isInAnimation = effectsIsInAnimation[sectionName][elemName];
        element.style.setProperty('--rotate-y', `${val}deg`);
        if (!isInAnimation) element.nextElementSibling.style.setProperty('--rotate-y', `${val}deg`);
        init();
    })
    elemFolder.add(config[sectionName][elemName], ...Object.values(EFFECTS_CONFIG.SCALE))
    .onChange(val => {
        const isInAnimation = effectsIsInAnimation[sectionName][elemName];
        element.style.setProperty('--scale', val - 1);
        if (!isInAnimation) element.nextElementSibling.style.setProperty('--scale', val - 1);
        init();
    })
    elemFolder.add(config[sectionName][elemName], ...Object.values(EFFECTS_CONFIG.OPACITY))
    .onChange(val => {
        element.style.setProperty('--opacity', val - 1);
        element.nextElementSibling.style.setProperty('--opacity', val - 1);
        init();
    })
    elemFolder.add(config[sectionName][elemName], ...Object.values(EFFECTS_CONFIG.GHOST))
    .onChange(showGhost => {
        element.nextElementSibling.style.setProperty('--no-ghost', showGhost? .1 : 0);
        init();
    })
    elemFolder.add(config[sectionName][elemName], ...Object.values(EFFECTS_CONFIG.IN_ANIMATION))
    .onChange(isInAnimation => {
        effectsIsInAnimation[sectionName][elemName] = isInAnimation;
        if (isInAnimation) resetStyles(element.nextElementSibling)
        init();
    })
    elemFolder.add(config[sectionName][elemName], ...Object.values(EFFECTS_CONFIG.SPEED))
    .onChange(val => {
        effectDuration[sectionName][elemName] = window.innerHeight / val;
        init();
    })
    elemFolder.add(config[sectionName][elemName], ...Object.values(EFFECTS_CONFIG.OFFSET))
    .onChange(val => {
        effectStartOffset[sectionName][elemName].current = effectStartOffset[sectionName][elemName].default + window.innerHeight * val;
        init();
    })
}

function resetStyles (element) {
    Object.entries(initStyles).forEach(([property, value]) => {
        element.style.setProperty(property, value);
    });
}
