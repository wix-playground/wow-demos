import { Scroll } from './two.5.js';

const gui = new dat.gui.GUI();

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
        MIN: -1080,
        MAX: 1080,
        STEP: 5,
    },
    ROTATE_Y: {
        LABEL: 'Rotate Y',
        MIN: -1080,
        MAX: 1080,
        STEP: 5,
    },
    ROTATE_X: {
        LABEL: 'Rotate X',
        MIN: -1080,
        MAX: 1080,
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
    HINT: {
        LABEL: 'Hint',
        VALUE: false,
    },
    IN_ANIMATION: {
        LABEL: 'In Animation',
        VALUE: false,
    },
    SPEED: {
        LABEL: 'Speed',
        MIN: 0.1,
        MAX: 3,
        STEP: .1,
    },
    OFFSET: {
        LABEL: 'Offset',
        MIN: -1,
        MAX: 1,
        STEP: .1,
    },
    MODE: {
        LABEL: 'Self Relative?',
        VALUE: true,
    },
    SECTION_HEIGHT: {
        LABEL: 'Section Height',
        MIN: 25,
        MAX: 500,
        STEP: 10,
    },
    ANIMATION_FRICTION: {
        LABEL: 'Lerp',
        MIN: 0,
        MAX: .9,
        STEP: .1,
    },
};
const guiSettings = {
    effects: {
        [EFFECTS_CONFIG.TRANSLATE_X.LABEL]: 0,
        [EFFECTS_CONFIG.TRANSLATE_Y.LABEL]: 0,
        [EFFECTS_CONFIG.ROTATE.LABEL]: 0,
        [EFFECTS_CONFIG.ROTATE_Y.LABEL]: 0,
        [EFFECTS_CONFIG.ROTATE_X.LABEL]: 0,
        [EFFECTS_CONFIG.SCALE.LABEL]: 1,
        [EFFECTS_CONFIG.OPACITY.LABEL]: 1,
        [EFFECTS_CONFIG.GHOST.LABEL]: true,
    },
    modifications: {
        [EFFECTS_CONFIG.IN_ANIMATION.LABEL]: false,
        [EFFECTS_CONFIG.HINT.LABEL]: false,
        [EFFECTS_CONFIG.MODE.LABEL]: true,
        [EFFECTS_CONFIG.SPEED.LABEL]: 1,
        [EFFECTS_CONFIG.OFFSET.LABEL]: 0,
    },
    sectionHeight: {
        [EFFECTS_CONFIG.SECTION_HEIGHT.LABEL]: 100,
    },
    animationFriction: {
        [EFFECTS_CONFIG.ANIMATION_FRICTION.LABEL]: .5,
    }
}
const config = {};
const effectDuration = {}
const effectStartOffset = {}
const effectsIsInAnimation = {}
const sections = [...document.querySelectorAll('section')];
const root = document.documentElement;
const initStyles = {
    '--opacity': 0,
    '--x-trans': '0px',
    '--y-trans': '0px',
    '--rotate': '0deg',
    '--rotate-y': '0deg',
    '--rotate-x': '0deg',
    '--scale': 0,
    '--pos': '0',
}
let animationTrigger = 'modeSelf';
let animationFriction = .9;
let scroll;
//======================== main ========================

window.addEventListener("load", () => {
    resetStyles(root)
    start();
    gui.remember(config);
    init();
})

//====================== main-end ======================

function start (firstTime = true) {
    config.animationFriction = guiSettings.animationFriction;
    firstTime && gui.add(config.animationFriction, ...Object.values(EFFECTS_CONFIG.ANIMATION_FRICTION))
    .onChange(val => {
        animationFriction = val;
        init();
    })
    sections.forEach((section, index) => {
        const sectionName = `Section-${index+1}`;
        const sectionFolder = firstTime && gui.addFolder(sectionName);
        const sectionElements = [...section.querySelectorAll('.actual')]
        const isFirstOrLastSection = (index === 0 || index === sections.length - 1)
        const sectionDuration = isFirstOrLastSection ? section.offsetHeight : section.offsetHeight + window.innerHeight
        const sectionOffset = index === 0 ? 0 : section.offsetTop - window.innerHeight
        config[sectionName] = {...config[sectionName], ...{height: guiSettings.sectionHeight}}
        firstTime && makeDynamic(section, sectionFolder, sectionName)

        sectionElements.forEach((element, i) => {
            const elemName = `${element.tagName}-${i}`;
            const elemFolder = firstTime && sectionFolder.addFolder(elemName);
            const effectsFolder = firstTime && elemFolder.addFolder('Effects');
            const modificationsFolder = firstTime && elemFolder.addFolder('Modifications');
            const elemDistFromTop = element.getBoundingClientRect().top + window.scrollY;
            const elementDuration = element.offsetHeight + (elemDistFromTop < window.innerHeight ? elemDistFromTop : window.innerHeight);
            const elementOffset = elemDistFromTop < window.innerHeight ? 0 : elemDistFromTop - window.innerHeight;
            config[sectionName] = {...config[sectionName], ...{[elemName]: {effects: guiSettings.effects, modifications: guiSettings.modifications}}};
            effectStartOffset[sectionName] = {
                ...effectStartOffset[sectionName], ...{
                    [elemName]: {modeSection: {default: sectionOffset, current: sectionOffset}, modeSelf: {default: elementOffset, current: elementOffset}}
                }
            };
            effectDuration[sectionName] = {
                ...effectDuration[sectionName], ...{
                    [elemName]: {modeSection: {default: sectionDuration, current: sectionDuration}, modeSelf: {default: elementDuration, current: elementDuration}}
                }
            };
            effectsIsInAnimation[sectionName] = {...effectsIsInAnimation[sectionName], ...{[elemName]: false}};
            if (firstTime){
                addHint(elemName, elementOffset, elementDuration);
                addScrollEffects(element, sectionName, effectsFolder, elemName);
                addScrollModifications(element, sectionName, modificationsFolder, elemName);
                addGhost(element)
            }
            else {
                const hintParams = 
                    animationTrigger === 'modeSelf' 
                    ? [elementOffset, elementDuration] 
                    : [sectionOffset, sectionDuration];

                updateHint(elemName, ...hintParams);
            }
        })
    })
}
function addGhost (element) {
    let clone = element.cloneNode(true);
    clone.classList.add("ghost");
    clone.classList.remove("actual");
    [...clone.querySelectorAll('.actual', '.ghost')].forEach(child => {
        child.classList.remove("actual")
        child.classList.remove("ghost")
    })
    element.insertAdjacentElement("afterend", clone);
}

function addHint (elemName, startOffset, duration) {
    const hint = document.createElement('div')
    hint.classList.add("hint", `hint-${elemName}`);
    hint.style.setProperty('--offset-top', `${startOffset}px`);
    hint.style.setProperty('--duration', `${duration}px`);
    hint.dataset["name"] = elemName;
    document.body.appendChild(hint);
}

function updateHint (elemName, startOffset, duration) {
    const hint = document.querySelector(`.hint-${elemName}`)
    hint.style.setProperty('--offset-top', `${startOffset}px`);
    hint.style.setProperty('--duration', `${duration}px`);
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
                start: effectStartOffset[sectionName][elemName][animationTrigger].current,
                duration: effectDuration[sectionName][elemName][animationTrigger].current,
                target: element,
                effect: (scene, pos) => scene.target.style.setProperty('--pos', isInAnimation ? 1 - pos : pos)
            })
        })
    })
    return scenes;
}

function init () {
    scroll?.destroy();
    scroll = new Scroll({
        scenes: createScenes(),
        animationActive: true,
        animationFriction: animationFriction,
    });
    scroll.on();
}

function makeDynamic (section, sectionFolder, sectionName) {
    sectionFolder.add(config[sectionName].height, ...Object.values(EFFECTS_CONFIG.SECTION_HEIGHT))
    .onChange(val => {
        section.style.setProperty('--strip-height', `${val}vh`);
         start(false);
         init()
    })
}

function addScrollEffects (element, sectionName, folder, elemName) {
    folder.add(config[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.TRANSLATE_X))
    .onChange(val => {
        const isInAnimation = effectsIsInAnimation[sectionName][elemName];
        element.style.setProperty('--x-trans', `${val}px`);
        if (!isInAnimation) element.nextElementSibling.style.setProperty('--x-trans', `${val}px`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(config[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.TRANSLATE_Y))
    .onChange(val => {
        const isInAnimation = effectsIsInAnimation[sectionName][elemName];
        element.style.setProperty('--y-trans', `${val}px`);
        if (!isInAnimation) element.nextElementSibling.style.setProperty('--y-trans', `${val}px`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(config[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.ROTATE))
    .onChange(val => {
        const isInAnimation = effectsIsInAnimation[sectionName][elemName];
        element.style.setProperty('--rotate', `${val}deg`);
        if (!isInAnimation) element.nextElementSibling.style.setProperty('--rotate', `${val}deg`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(config[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.ROTATE_Y))
    .onChange(val => {
        const isInAnimation = effectsIsInAnimation[sectionName][elemName];
        element.style.setProperty('--rotate-y', `${val}deg`);
        if (!isInAnimation) element.nextElementSibling.style.setProperty('--rotate-y', `${val}deg`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(config[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.ROTATE_X))
    .onChange(val => {
        const isInAnimation = effectsIsInAnimation[sectionName][elemName];
        element.style.setProperty('--rotate-x', `${val}deg`);
        if (!isInAnimation) element.nextElementSibling.style.setProperty('--rotate-x', `${val}deg`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(config[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.SCALE))
    .onChange(val => {
        const isInAnimation = effectsIsInAnimation[sectionName][elemName];
        element.style.setProperty('--scale', val - 1);
        if (!isInAnimation) element.nextElementSibling.style.setProperty('--scale', val - 1);
        resetChildrenStyle(element)
        init();
    })
    folder.add(config[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.OPACITY))
    .onChange(val => {
        element.style.setProperty('--opacity', val - 1);
        element.nextElementSibling.style.setProperty('--opacity', val - 1);
        resetChildrenStyle(element)
        init();
    })
    folder.add(config[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.GHOST))
    .onChange(showGhost => {
        element.nextElementSibling.style.setProperty('--no-ghost', showGhost ? .1 : 0);
        init();
    })
}

function addScrollModifications (element, sectionName, folder, elemName) {
    const hint = document.querySelector(`.hint-${elemName}`);
    folder.add(config[sectionName][elemName].modifications, ...Object.values(EFFECTS_CONFIG.HINT))
    .onChange(showGuide => {
        [...document.querySelectorAll('.hint')].forEach(e => {
            e.style.setProperty('--visible', 'hidden')
            e.style.setProperty('--z-index', 0);
        });
        if (showGuide) {
            hint.style.setProperty('--visible', 'visible');
            element.style.setProperty('--z-index', 4)
        }
        init();
    })
    folder.add(config[sectionName][elemName].modifications, ...Object.values(EFFECTS_CONFIG.MODE))
    .onChange(isRelativeToSelf => {
        animationTrigger = isRelativeToSelf ? 'modeSelf' : 'modeSection';
        hint.style.setProperty('--offset-top',  `${effectStartOffset[sectionName][elemName][animationTrigger].current}px`);
        hint.style.setProperty('--duration', `${effectDuration[sectionName][elemName][animationTrigger].current}px`);
        init();
    })
    folder.add(config[sectionName][elemName].modifications, ...Object.values(EFFECTS_CONFIG.IN_ANIMATION))
    .onChange(isInAnimation => {
        effectsIsInAnimation[sectionName][elemName] = isInAnimation;
        if (isInAnimation) resetStyles(element.nextElementSibling)
        else (copyCSSProperties(element, element.nextElementSibling)) 
        init();
    })
    folder.add(config[sectionName][elemName].modifications, ...Object.values(EFFECTS_CONFIG.SPEED))
    .onChange(val => {
        effectDuration[sectionName][elemName][animationTrigger].current = effectDuration[sectionName][elemName][animationTrigger].default/val;
        hint.style.setProperty('--duration', `${effectDuration[sectionName][elemName][animationTrigger].current}px`);
        init();
    })
    folder.add(config[sectionName][elemName].modifications, ...Object.values(EFFECTS_CONFIG.OFFSET))
    .onChange(val => {
        effectStartOffset[sectionName][elemName][animationTrigger].current = effectStartOffset[sectionName][elemName][animationTrigger].default + window.innerHeight * val;
        hint.style.setProperty('--offset-top',  `${effectStartOffset[sectionName][elemName][animationTrigger].current}px`);
        init();
    })
}

function resetStyles (element) {
    Object.entries(initStyles).forEach(([property, value]) => {
        element.style.setProperty(property, value);
    });   
}

function resetChildrenStyle (element) {
    [...element.querySelectorAll('.actual'), 
     ...element.querySelectorAll('.ghost')]
     .forEach(e => {
        resetStyles(e);
    });
}

function copyCSSProperties(elemToCopyFrom, elemToPasteTo) {
    const element1CSS = {
        'xTrans': window.getComputedStyle(elemToCopyFrom).getPropertyValue('--x-trans'),
        'yTrans': window.getComputedStyle(elemToCopyFrom).getPropertyValue('--y-trans'),
        'rotate': window.getComputedStyle(elemToCopyFrom).getPropertyValue('--rotate'),
        'rotateY': window.getComputedStyle(elemToCopyFrom).getPropertyValue('--rotate-y'),
        'rotateX': window.getComputedStyle(elemToCopyFrom).getPropertyValue('--rotate-x'),
        'scale': window.getComputedStyle(elemToCopyFrom).getPropertyValue('--scale')
    };

    elemToPasteTo.style.setProperty('--x-trans', element1CSS.xTrans);
    elemToPasteTo.style.setProperty('--y-trans', element1CSS.yTrans);
    elemToPasteTo.style.setProperty('--rotate', element1CSS.rotate);
    elemToPasteTo.style.setProperty('--rotate-y', element1CSS.rotateY);
    elemToPasteTo.style.setProperty('--rotate-x', element1CSS.rotateX);
    elemToPasteTo.style.setProperty('--scale', element1CSS.scale);
}

