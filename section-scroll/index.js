import { Scroll } from './two.5.js';

let lerp = 0.5;
let scroll;

const GUI = new dat.gui.GUI();

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
    SKEW_X: {
        LABEL: 'Skew X',
        MIN: -45,
        MAX: 45,
        STEP: 1,
    },
    SKEW_Y: {
        LABEL: 'Skew Y',
        MIN: -45,
        MAX: 45,
        STEP: 1,
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
    ANIMATION_DIR: {
        LABEL: 'Direction',
        VALUE: 'in',
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
    TRIGGER: {
        LABEL: 'Trigger',
        VALUE: 'self',
    },
    SECTION_HEIGHT: {
        LABEL: 'Section Height',
        MIN: 25,
        MAX: 500,
        STEP: 10,
    },
    LERP: {
        LABEL: 'Lerp',
        MIN: 0,
        MAX: .9,
        STEP: .1,
    },
};

const ANIMATION_TRIGGER = {
    self: 'modeSelf',
    section: 'modeSection'
}
const ANIMATION_DIRECTION = {
    in: 'inAnimation',
    out: 'outAnimation'
}

const guiSettings = {
    effects: {
        [EFFECTS_CONFIG.TRANSLATE_X.LABEL]: 0,
        [EFFECTS_CONFIG.TRANSLATE_Y.LABEL]: 0,
        [EFFECTS_CONFIG.ROTATE.LABEL]: 0,
        [EFFECTS_CONFIG.ROTATE_Y.LABEL]: 0,
        [EFFECTS_CONFIG.ROTATE_X.LABEL]: 0,
        [EFFECTS_CONFIG.SKEW_X.LABEL]: 0,
        [EFFECTS_CONFIG.SKEW_Y.LABEL]: 0,
        [EFFECTS_CONFIG.SCALE.LABEL]: 1,
        [EFFECTS_CONFIG.OPACITY.LABEL]: 1,
        [EFFECTS_CONFIG.GHOST.LABEL]: true,
    },
    travelSettings: {
        [EFFECTS_CONFIG.ANIMATION_DIR.LABEL]: ANIMATION_DIRECTION.out,
        [EFFECTS_CONFIG.HINT.LABEL]: false,
        [EFFECTS_CONFIG.TRIGGER.LABEL]: ANIMATION_TRIGGER.self,
        [EFFECTS_CONFIG.SPEED.LABEL]: 1,
        [EFFECTS_CONFIG.OFFSET.LABEL]: 0,
    },
    sectionHeight: {
        [EFFECTS_CONFIG.SECTION_HEIGHT.LABEL]: 100,
    },
    lerp: {
        [EFFECTS_CONFIG.LERP.LABEL]: lerp,
    }
}

const CONFIG = {};
const effectDuration = {}
const effectStartOffset = {}
const animationDirections = {}
const animationTriggers = {}
const sectionsElements = {};
const sectionNames = [];

const sections = [...document.querySelectorAll('section')];
const root = document.documentElement;
const initStyles = {
    '--opacity': 0,
    '--x-trans': '0px',
    '--y-trans': '0px',
    '--rotate': '0deg',
    '--rotate-y': '0deg',
    '--rotate-x': '0deg',
    '--skew-y': '0deg',
    '--skew-x': '0deg',
    '--scale': 0,
    '--pos': '0',
}

//======================== main ========================
console.log(CONFIG);
window.addEventListener("load", () => {
    resetStyles(root)
    initGUI();
    restart();
    GUI.remember(CONFIG);
    init();
})

//====================== main-end ======================

function initGUI () {
    // lerp folder and to config
    const lerpLabel_lerpInitVal = guiSettings.lerp;
    const lerpEditSettings = Object.values(EFFECTS_CONFIG.LERP);

    GUI.add(lerpLabel_lerpInitVal, ...lerpEditSettings)
    .onChange(newLerpVal => {
        lerp = newLerpVal;
        init();
    })
    CONFIG.lerp = lerpLabel_lerpInitVal;

    sections.forEach((section, index) => {
        const sectionName = `Section-${index+1}`;
        const sectionFolder = GUI.addFolder(sectionName);
        const sectionElements = [...section.querySelectorAll('.actual')]
        sectionNames.push(sectionName);
        sectionsElements[sectionName] = sectionElements;
        CONFIG[sectionName] = {height: guiSettings.sectionHeight};
        makeDynamicHeight(section, sectionFolder, sectionName);

        sectionElements.forEach((element, idx) => {
            const elemName = `${element.tagName}-${idx}`;
            const elemFolder = sectionFolder.addFolder(elemName);
            const effectsFolder = elemFolder.addFolder('Effects');
            const modificationsFolder = elemFolder.addFolder('Travel Settings');

            CONFIG[sectionName] = {...CONFIG[sectionName], [elemName]: {effects: guiSettings.effects, travelSettings: guiSettings.travelSettings}};
            addHint(elemName);
            addGhost(element);
            addScrollEffects(element, sectionName, effectsFolder, elemName);
            addScrollModifications(element, sectionName, modificationsFolder, elemName);
            animationDirections[elemName] = ANIMATION_DIRECTION.out;
            animationTriggers[elemName] = ANIMATION_TRIGGER.self;
        })
    })
}


function restart () {
    sections.forEach((section, index) => {
        const isFirstOrLastSection = (index === 0 || index === sections.length - 1)
        const sectionDuration = isFirstOrLastSection ? section.offsetHeight : section.offsetHeight + window.innerHeight
        const sectionOffset = index === 0 ? 0 : section.offsetTop - window.innerHeight

        const sectionName = sectionNames[index];
        sectionsElements[sectionName].forEach((element, idx) => {
            const elemStyle = getAndResetStyle(element);
            const elemName = `${element.tagName}-${idx}`;
            const elemDistFromTop = element.getBoundingClientRect().top + window.scrollY
            const elementDuration = element.offsetHeight + (elemDistFromTop < window.innerHeight ? elemDistFromTop : window.innerHeight);
            const elementOffset = elemDistFromTop < window.innerHeight ? 0 : elemDistFromTop - window.innerHeight;
            effectStartOffset[elemName] = {
                modeSection: {
                    default: sectionOffset, 
                    current: sectionOffset
                }, 
                modeSelf: {
                    default: elementOffset, 
                    current: elementOffset
                }
            }
            
            effectDuration[elemName] = {
                modeSection: {
                    default: sectionDuration, 
                    current: sectionDuration
                }, 
                modeSelf: {
                    default: elementDuration, 
                    current: elementDuration
                }
            }

            const trigger = animationTriggers[elemName];
            const offset = effectStartOffset[elemName][trigger].current;
            const duration = effectDuration[elemName][trigger].current;
            updateHint(elemName, offset, duration);
            applyStyle(element, elemStyle);
        })
    })
}

// ========== flow ==========

function createScenes () {
    const scenes = [];
    sections.forEach((section, index) => {
        const sectionName = sectionNames[index];
        sectionsElements[sectionName].forEach((element, idx) => {
            const elemName = `${element.tagName}-${idx}`;
            const animationDirection = animationDirections[elemName];
            const animationTrigger = animationTriggers[elemName];
            scenes.push({
                start: effectStartOffset[elemName][animationTrigger].current,
                duration: effectDuration[elemName][animationTrigger].current,
                target: element,
                effect: (scene, pos) => scene.target.style.setProperty('--pos', animationDirection === ANIMATION_DIRECTION.in ? 1 - pos : pos)
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
        animationFriction: lerp,
    });
    scroll.on();
}

function updateHint (elemName, startOffset, duration) {
    const hint = document.querySelector(`.hint-${elemName}`)
    hint.style.setProperty('--offset-top', `${startOffset}px`);
    hint.style.setProperty('--duration', `${duration}px`);
}

// ========== initiators ==========

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

function addHint (elementName) {
    const hint = document.createElement('div')
    hint.classList.add("hint", `hint-${elementName}`);
    hint.dataset["name"] = elementName;
    document.body.appendChild(hint);
}


function makeDynamicHeight (section, sectionFolder, sectionName) {
    sectionFolder.add(CONFIG[sectionName].height, ...Object.values(EFFECTS_CONFIG.SECTION_HEIGHT))
    .onChange(val => {
        section.style.setProperty('--strip-height', `${val}vh`);
         restart();
         init()
    })
}

function addScrollEffects (element, sectionName, folder, elemName) {
    folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.TRANSLATE_X))
    .onChange(val => {
        const animationDirection = animationDirections[elemName];
        element.style.setProperty('--x-trans', `${val}px`);
        if (animationDirection === ANIMATION_DIRECTION.out) element.nextElementSibling.style.setProperty('--x-trans', `${val}px`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.TRANSLATE_Y))
    .onChange(val => {
        const animationDirection = animationDirections[elemName];
        element.style.setProperty('--y-trans', `${val}px`);
        if (animationDirection === ANIMATION_DIRECTION.out) element.nextElementSibling.style.setProperty('--y-trans', `${val}px`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.ROTATE))
    .onChange(val => {
        const animationDirection = animationDirections[elemName];
        element.style.setProperty('--rotate', `${val}deg`);
        if (animationDirection === ANIMATION_DIRECTION.out) element.nextElementSibling.style.setProperty('--rotate', `${val}deg`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.ROTATE_Y))
    .onChange(val => {
        const animationDirection = animationDirections[elemName];
        element.style.setProperty('--rotate-y', `${val}deg`);
        if (animationDirection === ANIMATION_DIRECTION.out) element.nextElementSibling.style.setProperty('--rotate-y', `${val}deg`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.ROTATE_X))
    .onChange(val => {
        const animationDirection = animationDirections[elemName];
        element.style.setProperty('--rotate-x', `${val}deg`);
        if (animationDirection === ANIMATION_DIRECTION.out) element.nextElementSibling.style.setProperty('--rotate-x', `${val}deg`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.SKEW_X))
    .onChange(val => {
        const animationDirection = animationDirections[elemName];
        element.style.setProperty('--skew-x', `${val}deg`);
        if (animationDirection === ANIMATION_DIRECTION.out) element.nextElementSibling.style.setProperty('--skew-x', `${val}deg`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.SKEW_Y))
    .onChange(val => {
        const animationDirection = animationDirections[elemName];
        element.style.setProperty('--skew-y', `${val}deg`);
        if (animationDirection === ANIMATION_DIRECTION.out) element.nextElementSibling.style.setProperty('--skew-y', `${val}deg`);
        resetChildrenStyle(element)
        init();
    })
    folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.SCALE))
    .onChange(val => {
        const animationDirection = animationDirections[elemName];
        element.style.setProperty('--scale', val - 1);
        if (animationDirection === ANIMATION_DIRECTION.out) element.nextElementSibling.style.setProperty('--scale', val - 1);
        resetChildrenStyle(element)
        init();
    })
    folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.OPACITY))
    .onChange(val => {
        element.style.setProperty('--opacity', val - 1);
        element.nextElementSibling.style.setProperty('--opacity', val - 1);
        resetChildrenStyle(element)
        init();
    })
    folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.GHOST))
    .onChange(showGhost => {
        element.nextElementSibling.style.setProperty('--no-ghost', showGhost ? .1 : 0);
        init();
    })
}

function addScrollModifications (element, sectionName, folder, elemName) {
    const hint = document.querySelector(`.hint-${elemName}`);
    folder.add(CONFIG[sectionName][elemName].travelSettings, ...Object.values(EFFECTS_CONFIG.HINT))
    .onChange(showGuide => {
        [...document.querySelectorAll('.actual')].forEach(e => {
            e.style.setProperty('--z-index', 0);
        });
        [...document.querySelectorAll('.hint')].forEach(e => {
            e.style.setProperty('--visible', 'hidden')
            e.style.setProperty('--z-index', -1);
        });
        if (showGuide) {
            hint.style.setProperty('--visible', 'visible');
            element.style.setProperty('--z-index', 4)
        }
        init();
    })
    folder.add(CONFIG[sectionName][elemName].travelSettings, EFFECTS_CONFIG.TRIGGER.LABEL, ANIMATION_TRIGGER)
    .onChange(animationTrigger => {
        animationTriggers[elemName] = animationTrigger;
        hint.style.setProperty('--offset-top',  `${effectStartOffset[elemName][animationTrigger].current}px`);
        hint.style.setProperty('--duration', `${effectDuration[elemName][animationTrigger].current}px`);
        init();
    })
    folder.add(CONFIG[sectionName][elemName].travelSettings, EFFECTS_CONFIG.ANIMATION_DIR.LABEL, ANIMATION_DIRECTION)
    .onChange(animationDir => {
        animationDirections[elemName] = animationDir;
        if (animationDir === ANIMATION_DIRECTION.in) resetStyles(element.nextElementSibling)
        else (copyCSSProperties(element, element.nextElementSibling)) 
        init();
    })
    folder.add(CONFIG[sectionName][elemName].travelSettings, ...Object.values(EFFECTS_CONFIG.SPEED))
    .onChange(val => {
        const animationTrigger = animationTriggers[elemName]
        effectDuration[elemName][animationTrigger].current = effectDuration[elemName][animationTrigger].default/val;
        hint.style.setProperty('--duration', `${effectDuration[elemName][animationTrigger].current}px`);
        init();
    })
    folder.add(CONFIG[sectionName][elemName].travelSettings, ...Object.values(EFFECTS_CONFIG.OFFSET))
    .onChange(val => {
        const animationTrigger = animationTriggers[elemName]
        effectStartOffset[elemName][animationTrigger].current = effectStartOffset[elemName][animationTrigger].default + window.innerHeight * val;
        hint.style.setProperty('--offset-top',  `${effectStartOffset[elemName][animationTrigger].current}px`);
        init();
    })
}

// ========== helpers ==========

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
    const elemToCopyFromCSS = getStyle(elemToCopyFrom);
    applyStyle(elemToPasteTo, elemToCopyFromCSS)
}

function getAndResetStyle (element) {
    const elementCSS = getStyle(element)
    resetStyles(element);
    return elementCSS
}

function applyStyle (element, elementCSS) {
    element.style.setProperty('--x-trans', elementCSS.xTrans);
    element.style.setProperty('--y-trans', elementCSS.yTrans);
    element.style.setProperty('--rotate', elementCSS.rotate);
    element.style.setProperty('--rotate-x', elementCSS.rotateX);
    element.style.setProperty('--rotate-y', elementCSS.rotateY);
    element.style.setProperty('--skew-x', elementCSS.skewX);
    element.style.setProperty('--skew-y', elementCSS.skewY);
    element.style.setProperty('--scale', elementCSS.scale);
}

function getStyle (element) {
    return {
        'xTrans': window.getComputedStyle(element).getPropertyValue('--x-trans'),
        'yTrans': window.getComputedStyle(element).getPropertyValue('--y-trans'),
        'rotate': window.getComputedStyle(element).getPropertyValue('--rotate'),
        'rotateY': window.getComputedStyle(element).getPropertyValue('--rotate-y'),
        'rotateX': window.getComputedStyle(element).getPropertyValue('--rotate-x'),
        'skewX': window.getComputedStyle(element).getPropertyValue('--skew-x'),
        'skewY': window.getComputedStyle(element).getPropertyValue('--skew-y'),
        'scale': window.getComputedStyle(element).getPropertyValue('--scale')
    }
}

