import { Scroll } from './two.5.js';

let lerp = 0.9;
let scroll;

const ANGLE_FIX = -90;
const GUI = new dat.GUI();

const EFFECTS_CONFIG = {
    POS_ANGLE: {
        LABEL: 'Angle',
        MIN: -180,
        MAX: 180,
        STEP: 1,
    },
    POS_DIST: {
        LABEL: 'Distance',
        MIN: -window.innerWidth,
        MAX: window.innerWidth,
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
    SCALE_X: {
        LABEL: 'Scale X',
        MIN: 0,
        MAX: 2,
        STEP: .1,
    },
    SCALE_Y: {
        LABEL: 'Scale Y',
        MIN: 0,
        MAX: 2,
        STEP: .1,
    },
    TRANS_ORIGIN: {
        LABEL: 'Trans Origin',
        VALUE: 'center',
    },
    OPACITY: {
        LABEL: 'Opacity',
        MIN: 0,
        MAX: 1,
        STEP: .1,
    },
    HUE: {
        LABEL: 'Hue Rotate',
        MIN: -360,
        MAX: 360,
        STEP: 1,
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
        VALUE: 'out',
    },
    SPEED: {
        LABEL: 'Distance',
        MIN: 0,
        MAX: 3,
        STEP: .1,
    },
    OFFSET: {
        LABEL: 'Offset',
        MIN: -1,
        MAX: 1,
        STEP: .05,
    },
    TRIGGER: {
        LABEL: 'Trigger',
        VALUE: 'self',
    },
    SECTION_HEIGHT: {
        LABEL: 'Section Height',
        MIN: 25,
        MAX: 300,
        STEP: 10,
    },
    LERP: {
        LABEL: 'Lerp',
        MIN: 0,
        MAX: .9,
        STEP: .1,
    },
};

const ANIMATION_TRIGGER_OPT = {
    self: 'modeSelf',
    section: 'modeSection'
}
const ANIMATION_DIRECTION_OPT = {
    in: 'inAnimation',
    out: 'outAnimation'
}

const TRANSFORM_ORIGIN_OPT = {
    center: 'center',
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left',
    'Top-left': 'topLeft',
    'Top-right': 'topRight',
    'Bottom-left': 'bottomLeft',
    'Bottom-right': 'bottomRight'
}

const TRANSFORM_ORIGIN_VALS = {
    center: ['50%', '50%'],
    top: ['50%', '0%'],
    right: ['100%', '50%'],
    bottom: ['50%', '100%'],
    left: ['0%', '50%'],
    topLeft: ['0%', '0%'],
    topRight: ['100%', '0%'],
    bottomLeft: ['0%', '100%'],
    bottomRight: ['100%', '100%'],
}

const guiSettings = {
    effects: {
        [EFFECTS_CONFIG.ROTATE.LABEL]: 0,
        [EFFECTS_CONFIG.ROTATE_Y.LABEL]: 0,
        [EFFECTS_CONFIG.ROTATE_X.LABEL]: 0,
        [EFFECTS_CONFIG.SKEW_X.LABEL]: 0,
        [EFFECTS_CONFIG.SKEW_Y.LABEL]: 0,
        [EFFECTS_CONFIG.SCALE_X.LABEL]: 1,
        [EFFECTS_CONFIG.SCALE_Y.LABEL]: 1,
        [EFFECTS_CONFIG.OPACITY.LABEL]: 1,
        [EFFECTS_CONFIG.HUE.LABEL]: 0,
        [EFFECTS_CONFIG.TRANS_ORIGIN.LABEL]: TRANSFORM_ORIGIN_OPT.center,
        [EFFECTS_CONFIG.GHOST.LABEL]: true,
        position: {
            [EFFECTS_CONFIG.POS_ANGLE.LABEL]: 0,
            [EFFECTS_CONFIG.POS_DIST.LABEL]: 0,
        }
    },
    travelSettings: {
        [EFFECTS_CONFIG.ANIMATION_DIR.LABEL]: ANIMATION_DIRECTION_OPT.out,
        [EFFECTS_CONFIG.HINT.LABEL]: false,
        [EFFECTS_CONFIG.TRIGGER.LABEL]: ANIMATION_TRIGGER_OPT.self,
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
const positions = {};
const effectDuration = {}
const effectStartOffset = {}
const animationDirections = {}
const animationTriggers = {}
const sectionsElements = {};
const sectionNames = [];
const controllers = {};

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
    '--hue': '0deg',
    '--scale': 0,
    '--pos': '0',
    '--trans-origin-x': '50%',
    '--trans-origin-y': '50%',
}

const importExport = {
    "Save to File": function () {
        download(getValues(), `saved-settings-${getTimeStamp()}.txt`, "text/plain");
    },
    "Load from File": function () {
        upload(); 
    }
  };

//======================== main ========================

window.addEventListener("load", () => {
    resetStyles(root)
    initGUI();
    restart();
    GUI.remember(CONFIG);
    init();
})

//====================== main-end ======================

// ========== flow ==========

function restart () {
    sections.forEach((section, index) => {
        const isFirstOrLastSection = (index === 0 || index === sections.length - 1)
        const sectionDuration = isFirstOrLastSection ? section.offsetHeight : section.offsetHeight + window.innerHeight
        const sectionOffset = index === 0 ? 0 : section.offsetTop - window.innerHeight

        const sectionName = sectionNames[index];
        sectionsElements[sectionName].forEach((element, idx) => {
            const elemStyle = getAndResetStyle(element);
            const elemName = `${element.tagName}-s${index + 1}_e${idx + 1}`;
            const elemDistFromTop = element.getBoundingClientRect().top + window.scrollY
            const elemDistFromBottom = document.body.scrollHeight - (elemDistFromTop + element.offsetHeight);
            const elementOffset = elemDistFromTop < window.innerHeight ? 0 : elemDistFromTop - window.innerHeight;
            const elementDuration = element.offsetHeight + (
                elemDistFromTop < window.innerHeight 
                ? elemDistFromTop 
                : elemDistFromBottom < window.innerHeight 
                ? elemDistFromBottom 
                : window.innerHeight
            );
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

function createScenes () {
    const scenes = [];
    sections.forEach((section, index) => {
        const sectionName = sectionNames[index];
        sectionsElements[sectionName].forEach((element, idx) => {
            const elemName = `${element.tagName}-s${index + 1}_e${idx + 1}`;
            const animationDirection = animationDirections[elemName];
            const animationTrigger = animationTriggers[elemName];
            scenes.push({
                start: effectStartOffset[elemName][animationTrigger].current,
                duration: effectDuration[elemName][animationTrigger].current,
                target: element,
                effect: (scene, pos) => scene.target.style.setProperty('--pos', animationDirection === ANIMATION_DIRECTION_OPT.in ? 1 - pos : pos)
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
        animationFriction: lerp || false,
    });
    scroll.on();
}

function updateHint (elemName, startOffset, duration) {
    const hint = document.querySelector(`.hint-${elemName}`)
    hint.style.setProperty('--offset-top', `${startOffset}px`);
    hint.style.setProperty('--duration', `${duration}px`);
}

function updatePosition (element, angle, distance, isOutAnimation) {
    const [transX, transY] = getTranslate_XY(angle, distance);
    element.style.setProperty('--x-trans', `${transX}px`);
    element.style.setProperty('--y-trans', `${transY}px`);
    if (isOutAnimation) {
        element.nextElementSibling.style.setProperty('--x-trans', `${transX}px`);
        element.nextElementSibling.style.setProperty('--y-trans', `${transY}px`);
    }
}

// ========== initiators ==========

function initGUI () {
    GUI.add(importExport, "Save to File");
    GUI.add(importExport, "Load from File");
    
    addLerp();

    sections.forEach((section, index) => {
        const sectionName = `Section-${index + 1}`;
        const sectionFolder = GUI.addFolder(sectionName);
        const sectionElements = [...section.querySelectorAll('.actual')]
        sectionNames.push(sectionName);
        sectionsElements[sectionName] = sectionElements;
        CONFIG[sectionName] = {height: structuredClone(guiSettings.sectionHeight)};
        makeDynamicHeight(section, sectionFolder, sectionName);

        sectionElements.forEach((element, idx) => {
            const elemName = `${element.tagName}-s${index + 1}_e${idx + 1}`;
            const elemFolder = sectionFolder.addFolder(elemName);
            const effectsFolder = elemFolder.addFolder('Transformations');
            const modificationsFolder = elemFolder.addFolder('Travel Settings');
            element.title = elemName;

            CONFIG[sectionName] = {
                ...CONFIG[sectionName], 
                [elemName]: {
                    effects: {
                        ...guiSettings.effects, 
                        position: structuredClone(guiSettings.effects.position)
                    }, 
                    travelSettings: structuredClone(guiSettings.travelSettings)
                }
            };
            addHint(elemName);
            addGhost(element);
            addScrollEffects(element, sectionName, effectsFolder, elemName);
            addScrollModifications(element, sectionName, modificationsFolder, elemName);
            animationDirections[elemName] = ANIMATION_DIRECTION_OPT.out;
            animationTriggers[elemName] = ANIMATION_TRIGGER_OPT.self;
            positions[elemName] = {
                angle: 0 + ANGLE_FIX,
                distance: 0,
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

function addHint (elementName) {
    const hint = document.createElement('div')
    hint.classList.add("hint", `hint-${elementName}`);
    hint.dataset["name"] = elementName;
    document.body.appendChild(hint);
}

function makeDynamicHeight (section, sectionFolder, sectionName) {
    const sectionHeightCtrllr = sectionFolder.add(CONFIG[sectionName].height, ...Object.values(EFFECTS_CONFIG.SECTION_HEIGHT))
    .onChange(val => {
        section.style.setProperty('--strip-height', `${val}vh`);
         restart();
         init()
    })
    controllers[sectionName] = {height: sectionHeightCtrllr };
}

function addScrollEffects (element, sectionName, folder, elemName) {
    const positionFolder = folder.addFolder('Position');

    const angleCtrllr = positionFolder.add(CONFIG[sectionName][elemName].effects.position, ...Object.values(EFFECTS_CONFIG.POS_ANGLE))
    .onChange(angle => {
        const angleFixed = angle + ANGLE_FIX;
        positions[elemName].angle = angleFixed;
        const distance = positions[elemName].distance;
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        updatePosition(element, angleFixed, distance, isOutAnimation)
        resetChildrenStyle(element)
        init();
    })

    const distCtrllr = positionFolder.add(CONFIG[sectionName][elemName].effects.position, ...Object.values(EFFECTS_CONFIG.POS_DIST))
    .onChange(newDist => {
        positions[elemName].distance = newDist;
        const angle = positions[elemName].angle;
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;        
        updatePosition(element, angle, newDist, isOutAnimation)
        resetChildrenStyle(element)
        init();
    })
    positionFolder.open();

    const rotateCtrllr = folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.ROTATE))
    .onChange(val => {
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        element.style.setProperty('--rotate', `${val}deg`);
        if (isOutAnimation) {
            element.nextElementSibling.style.setProperty('--rotate', `${val}deg`);
        }
        resetChildrenStyle(element)
        init();
    })

    const rotateYCtrllr = folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.ROTATE_Y))
    .onChange(val => {
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        element.style.setProperty('--rotate-y', `${val}deg`);
        if (isOutAnimation) {
            element.nextElementSibling.style.setProperty('--rotate-y', `${val}deg`);
        }
        resetChildrenStyle(element)
        init();
    })

    const rotateXCtrllr = folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.ROTATE_X))
    .onChange(val => {
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        element.style.setProperty('--rotate-x', `${val}deg`);
        if (isOutAnimation) {
            element.nextElementSibling.style.setProperty('--rotate-x', `${val}deg`);
        }
        resetChildrenStyle(element)
        init();
    })

    const skewXCtrllr = folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.SKEW_X))
    .onChange(val => {
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        element.style.setProperty('--skew-x', `${val}deg`);
        if (isOutAnimation) {
            element.nextElementSibling.style.setProperty('--skew-x', `${val}deg`);
        }
        resetChildrenStyle(element)
        init();
    })

    const skewYCtrllr = folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.SKEW_Y))
    .onChange(val => {
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        element.style.setProperty('--skew-y', `${val}deg`);
        if (isOutAnimation) {
            element.nextElementSibling.style.setProperty('--skew-y', `${val}deg`);
        }
        resetChildrenStyle(element)
        init();
    })

    const scaleXCtrllr = folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.SCALE_X))
    .onChange(val => {
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        element.style.setProperty('--scale-x', val - 1);
        if (isOutAnimation) {
            element.nextElementSibling.style.setProperty('--scale-x', val - 1);
        }
        resetChildrenStyle(element)
        init();
    })

    const scaleYCtrllr = folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.SCALE_Y))
    .onChange(val => {
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        element.style.setProperty('--scale-y', val - 1);
        if (isOutAnimation) {
            element.nextElementSibling.style.setProperty('--scale-y', val - 1);
        }
        resetChildrenStyle(element)
        init();
    })

    const opacityCtrllr = folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.OPACITY))
    .onChange(val => {
        element.style.setProperty('--opacity', val - 1);
        element.nextElementSibling.style.setProperty('--opacity', val - 1);
        resetChildrenStyle(element)
        init();
    })

    const hueCtrllr = folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.HUE))
    .onChange(val => {
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        element.style.setProperty('--hue', `${val}deg`);
        if (isOutAnimation) {
            element.nextElementSibling.style.setProperty('--hue', `${val}deg`);
        }
        resetChildrenStyle(element)
        init();
    })

    const transOriginCtrllr = folder.add(CONFIG[sectionName][elemName].effects, EFFECTS_CONFIG.TRANS_ORIGIN.LABEL, TRANSFORM_ORIGIN_OPT)
    .onChange(val => {
        const [originX, originY] = TRANSFORM_ORIGIN_VALS[val];
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        element.style.setProperty('--trans-origin-x', originX);
        element.style.setProperty('--trans-origin-y', originY);
        if (isOutAnimation) {
            element.nextElementSibling.style.setProperty('--trans-origin-x', originX);
            element.nextElementSibling.style.setProperty('--trans-origin-y', originY);
        }
        resetChildrenStyle(element)
        init();
    })
    const ghostCtrllr = folder.add(CONFIG[sectionName][elemName].effects, ...Object.values(EFFECTS_CONFIG.GHOST))
    .onChange(showGhost => {
        element.nextElementSibling.style.setProperty('--no-ghost', showGhost ? .1 : 0);
        init();
    })

    controllers[sectionName][elemName] = {
        effects: {
            [EFFECTS_CONFIG.ROTATE.LABEL]: rotateCtrllr,
            [EFFECTS_CONFIG.ROTATE_Y.LABEL]: rotateYCtrllr,
            [EFFECTS_CONFIG.ROTATE_X.LABEL]: rotateXCtrllr,
            [EFFECTS_CONFIG.SKEW_X.LABEL]: skewXCtrllr,
            [EFFECTS_CONFIG.SKEW_Y.LABEL]: skewYCtrllr,
            [EFFECTS_CONFIG.SCALE_X.LABEL]: scaleXCtrllr,
            [EFFECTS_CONFIG.SCALE_Y.LABEL]: scaleYCtrllr,
            [EFFECTS_CONFIG.OPACITY.LABEL]: opacityCtrllr,
            [EFFECTS_CONFIG.HUE.LABEL]: hueCtrllr,
            [EFFECTS_CONFIG.TRANS_ORIGIN.LABEL]: transOriginCtrllr,
            [EFFECTS_CONFIG.GHOST.LABEL]: ghostCtrllr,
            position: {
                [EFFECTS_CONFIG.POS_ANGLE.LABEL]: angleCtrllr,
                [EFFECTS_CONFIG.POS_DIST.LABEL]: distCtrllr,
            }

        }
    }
}

function addScrollModifications (element, sectionName, folder, elemName) {
    const hint = document.querySelector(`.hint-${elemName}`);

    folder.add(CONFIG[sectionName][elemName].travelSettings, EFFECTS_CONFIG.TRIGGER.LABEL, ANIMATION_TRIGGER_OPT)
    .onChange(animationTrigger => {
        animationTriggers[elemName] = animationTrigger;
        hint.style.setProperty('--offset-top',  `${effectStartOffset[elemName][animationTrigger].current}px`);
        hint.style.setProperty('--duration', `${effectDuration[elemName][animationTrigger].current}px`);
        init();
    })
    folder.add(CONFIG[sectionName][elemName].travelSettings, EFFECTS_CONFIG.ANIMATION_DIR.LABEL, ANIMATION_DIRECTION_OPT)
    .onChange(animationDir => {
        animationDirections[elemName] = animationDir;
        if (animationDir === ANIMATION_DIRECTION_OPT.in) resetStyles(element.nextElementSibling)
        else (copyCSSProperties(element, element.nextElementSibling)) 
        init();
    })
    folder.add(CONFIG[sectionName][elemName].travelSettings, ...Object.values(EFFECTS_CONFIG.SPEED))
    .onChange(val => {
        const animationTrigger = animationTriggers[elemName]
        effectDuration[elemName][animationTrigger].current = effectDuration[elemName][animationTrigger].default * val;
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
}

function addLerp() {
    const lerpLabel_lerpInitVal = guiSettings.lerp;
    const lerpEditSettings = Object.values(EFFECTS_CONFIG.LERP);
    const lerpController = GUI.add(lerpLabel_lerpInitVal, ...lerpEditSettings)
    .onChange(newLerpVal => {
        lerp = newLerpVal;
        init();
    })

    CONFIG.lerp = lerpLabel_lerpInitVal;
    controllers.lerp = lerpController;
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
    element.style.setProperty('--hue', elementCSS.hue);
    element.style.setProperty('--scale-x', elementCSS.scaleX);
    element.style.setProperty('--scale-y', elementCSS.scaleY);
    element.style.setProperty('--trans-origin-x', elementCSS.transOriginX);
    element.style.setProperty('--trans-origin-y', elementCSS.transOriginY);
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
        'hue': window.getComputedStyle(element).getPropertyValue('--hue'),
        'scaleX': window.getComputedStyle(element).getPropertyValue('--scale-x'),
        'scaleY': window.getComputedStyle(element).getPropertyValue('--scale-y'),
        'transOriginX': window.getComputedStyle(element).getPropertyValue('--trans-origin-x'),
        'transOriginY': window.getComputedStyle(element).getPropertyValue('--trans-origin-y'),
    }
}

function getTranslate_XY(angle, distance) {
    const radians = (angle * Math.PI) / 180;
    const x = Math.cos(radians) * distance;
    const y = Math.sin(radians) * distance;
    return [ x, y ];
}

function getValues() {
    return JSON.stringify(GUI.__rememberedObjects, null, 2);
}

function setValues(rememberedValues) {
    const db = rememberedValues[0]
    const lerpVal = db.lerp.Lerp
    controllers.lerp.setValue(lerpVal);
    Object.values(db).slice(1).forEach((sectionData, index) => {
        const sectionName = sectionNames[index];
        controllers[sectionName].height.setValue(Object.values(sectionData.height)[0]) 
        Object.values(sectionData).slice(1).forEach((elem, idx) => {
            const elemName = `${sectionsElements[sectionName][idx].tagName}-s${index + 1}_e${idx + 1}`;
            for (const [key, value] of Object.entries(elem.effects)) {
                if (typeof(value) === "object") {
                    for (const [k, v] of Object.entries(value)) {
                        controllers[sectionName][elemName].effects.position[k].setValue(v);
                    }
                } else {
                    controllers[sectionName][elemName].effects[key].setValue(value);
                }
              } 
        })
    })
}


function upload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "text/plain";
    input.onchange = function () {
        if (this.files && this.files[0]) {
        var myFile = this.files[0];
        var reader = new FileReader();

        reader.addEventListener("load", function (e) {
            setValues(JSON.parse(e.target.result));
        });

        reader.readAsBinaryString(myFile);
        }
    };
    document.body.appendChild(input);

    input.click();
    setTimeout(function () {
        document.body.removeChild(input);
    }, 0);
}

function download(data, filename, type) {
    const file = new Blob([data], { type: type });
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);

    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function getTimeStamp() {
    const date = new Date();
    return `${date.toISOString().split("T")[0]}-${date.toLocaleTimeString(
        "en-US",
        { hour12: false }
    )}`;
}


