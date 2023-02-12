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
    in: 'in',
    out: 'out'
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
        const sectionDuration = (isFirstOrLastSection ? section.offsetHeight : section.offsetHeight + window.innerHeight) / 2;
        const sectionOffset = index === 0 ? 0 : section.offsetTop - window.innerHeight

        const sectionName = sectionNames[index];
        sectionsElements[sectionName].forEach((element, idx) => {
            const elemStyle = getAndResetStyle(element);
            const elemName = `${element.tagName}-s${index + 1}_e${idx + 1}`;
            const elemDistFromTop = element.getBoundingClientRect().top + window.scrollY
            const elemDistFromBottom = document.body.scrollHeight - (elemDistFromTop + element.offsetHeight);
            const elementOffset = elemDistFromTop < window.innerHeight ? 0 : elemDistFromTop - window.innerHeight;
            const elementDuration = (
                element.offsetHeight + 
                (
                    elemDistFromTop < window.innerHeight 
                    ? elemDistFromTop 
                    : elemDistFromBottom < window.innerHeight 
                    ? elemDistFromBottom 
                    : window.innerHeight
                )
            ) / 2;

            effectStartOffset[elemName] = {
                in: {
                    modeSection: {
                        default: sectionOffset, 
                        current: sectionOffset
                    }, 
                    modeSelf: {
                        default: elementOffset, 
                        current: elementOffset
                    }
                },
                out: {
                    modeSection: {
                        default: sectionOffset + sectionDuration, 
                        current: sectionOffset + sectionDuration
                    }, 
                    modeSelf: {
                        default: elementOffset + elementDuration, 
                        current: elementOffset + elementDuration
                    }
                }
            }
            
            effectDuration[elemName] = {
                in: {
                    modeSection: {
                        default: sectionDuration, 
                        current: sectionDuration
                    }, 
                    modeSelf: {
                        default: elementDuration, 
                        current: elementDuration
                    }
                },
                out: {
                    modeSection: {
                        default: sectionDuration, 
                        current: sectionDuration
                    }, 
                    modeSelf: {
                        default: elementDuration, 
                        current: elementDuration
                    }
                }
            }
            // CONFIG[sectionName][elemName].in.travelSettings.Offset = elementOffset
            // CONFIG[sectionName][elemName].out.travelSettings.Offset = elementOffset
            // CONFIG[sectionName][elemName].in.travelSettings.Duration = elementDuration
            // CONFIG[sectionName][elemName].out.travelSettings.Duration = elementDuration

            const trigger = animationTriggers[elemName];

            const offsetIn = effectStartOffset[elemName].in[trigger].current;
            const offsetOut = effectStartOffset[elemName].out[trigger].current;

            const durationIn = effectDuration[elemName].in[trigger].current;
            const durationOut = effectDuration[elemName].out[trigger].current;

            updateHint(elemName, offsetIn, durationIn, ANIMATION_DIRECTION_OPT.in);
            updateHint(elemName, offsetOut, durationOut, ANIMATION_DIRECTION_OPT.out);
            applyStyle(element, elemStyle, ANIMATION_DIRECTION_OPT.in);
            applyStyle(element, elemStyle, ANIMATION_DIRECTION_OPT.out);
        })
    })
}

function createScenes () {
    const scenes = [];
    sections.forEach((section, index) => {
        const sectionName = sectionNames[index];
        sectionsElements[sectionName].forEach((element, idx) => {
            const elemName = `${element.tagName}-s${index + 1}_e${idx + 1}`;
            const animationTrigger = animationTriggers[elemName];
            scenes.push(
                ...[
                    {
                        start: effectStartOffset[elemName].in[animationTrigger].current,
                        duration: effectDuration[elemName].in[animationTrigger].current,
                        target: element,
                        effect: (scene, pos) => scene.target.style.setProperty('--pos-in', 1 - pos)
                    },
                    {
                        start: effectStartOffset[elemName].out[animationTrigger].current,
                        duration: effectDuration[elemName].out[animationTrigger].current,
                        target: element,
                        effect: (scene, pos) => scene.target.style.setProperty('--pos-out', pos)
                    },
                ]
            )
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

function updateHint (elemName, startOffset, duration, direction) {
    const hint = document.querySelector(`.hint-${direction}-${elemName}`)
    hint.style.setProperty(`--offset-top-${direction}`, `${startOffset}px`);
    hint.style.setProperty(`--duration-${direction}`, `${duration}px`);
}

function updatePosition (element, angle, distance, direction = null) {
    const [transX, transY] = getTranslate_XY(angle, distance);
    element.style.setProperty(`--x-trans-${direction}`, `${transX}px`);
    element.style.setProperty(`--y-trans-${direction}`, `${transY}px`);
    if (direction === ANIMATION_DIRECTION_OPT.out) {
        element.nextElementSibling.style.setProperty(`--x-trans-${direction}`, `${transX}px`);
        element.nextElementSibling.style.setProperty(`--y-trans-${direction}`, `${transY}px`);
    }
}

// ========== initiators ==========

function showHideHintMarker () {
    let isAnyHintVisible = false; 
    [...document.querySelectorAll('.hint-in'), ...document.querySelectorAll('.hint-out')].forEach(hintElement => {
        const isHintVisible = window.getComputedStyle(hintElement).getPropertyValue(`visibility`) === 'visible';
        if (isHintVisible) {
            isAnyHintVisible = true;
            return;
        }
    })
    const marker = document.querySelector('.hint-marker')
    if (isAnyHintVisible) {
        marker.style.setProperty('--marker-visible', 'visible')
    } else {
        marker.style.setProperty('--marker-visible', 'hidden')
    }
}

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
            addElementToGUI(element, elemName, sectionFolder, sectionName)
        })
    })
}

function addElementToGUI(element, elemName, sectionFolder, sectionName) {
    const elemFolder = sectionFolder.addFolder(elemName);
    const effectsFolderIn = elemFolder.addFolder('In Animation');
    const effectsFolderOut = elemFolder.addFolder('Out Animation');
    const TransformationsFolderIn = effectsFolderIn.addFolder('Transformations');
    const TransformationsFolderOut = effectsFolderOut.addFolder('Transformations');
    const modificationsFolderIn = effectsFolderIn.addFolder('Travel Settings');
    const modificationsFolderOut = effectsFolderOut.addFolder('Travel Settings');
    element.title = elemName; // for presenting elemName on mouse over

    const animationGuiSettings = {
        effects: {
            ...guiSettings.effects, 
            position: structuredClone(guiSettings.effects.position)
        }, 
        travelSettings: structuredClone(guiSettings.travelSettings)
    }

    CONFIG[sectionName] = {
        ...CONFIG[sectionName], 
        [elemName]: {
            in: animationGuiSettings,
            out: animationGuiSettings,
        }
    };
    addHints(elemName);
    addGhost(element);
    addScrollEffects(element, sectionName, TransformationsFolderIn, elemName, ANIMATION_DIRECTION_OPT.in);
    addScrollEffects(element, sectionName, TransformationsFolderOut, elemName, ANIMATION_DIRECTION_OPT.out);
    addScrollModifications(element, sectionName, modificationsFolderIn, elemName, ANIMATION_DIRECTION_OPT.in);
    addScrollModifications(element, sectionName, modificationsFolderOut, elemName, ANIMATION_DIRECTION_OPT.out);
    animationTriggers[elemName] = ANIMATION_TRIGGER_OPT.self;
    positions[elemName] = {
        in: {
            angle: 0 + ANGLE_FIX,
            distance: 0,
        },
        out: {
            angle: 0 + ANGLE_FIX,
            distance: 0,
        }
    }
}

function addGhost (element) {
    
    let clone = element.cloneNode(true);
    clone.classList.add("ghost-in");
    clone.classList.remove("actual");
    [...clone.querySelectorAll('.actual', '.ghost-in')].forEach(child => {
        child.classList.remove("actual")
        child.classList.remove("ghost-in")
    })
    element.insertAdjacentElement("afterend", clone);
    
    let cloneOut = element.cloneNode(true);
    cloneOut.classList.add("ghost-out");
    cloneOut.classList.remove("actual");
    [...cloneOut.querySelectorAll('.actual', '.ghost-out')].forEach(child => {
        child.classList.remove("actual")
        child.classList.remove("ghost-out")
    })
    element.insertAdjacentElement("afterend", cloneOut);

}

function addHints (elementName) {
    const hintIn = document.createElement('div')
    const hintOut = document.createElement('div')
    hintIn.classList.add("hint-in", `hint-in-${elementName}`);
    hintOut.classList.add("hint-out", `hint-out-${elementName}`);
    hintIn.dataset["name"] = elementName;
    hintOut.dataset["name"] = elementName;
    document.body.appendChild(hintIn);
    document.body.appendChild(hintOut);
}

function makeDynamicHeight (section, sectionFolder, sectionName) {
    sectionFolder.add(CONFIG[sectionName].height, ...Object.values(EFFECTS_CONFIG.SECTION_HEIGHT))
    .onChange(val => {
        section.style.setProperty('--strip-height', `${val}vh`);
         restart();
         init()
    })
    controllers[sectionName] = {};
}

function addScrollEffects (element, sectionName, folder, elemName, direction) {
    const positionFolder = folder.addFolder('Position');

    const angleCtrllr = positionFolder.add(CONFIG[sectionName][elemName][direction].effects.position, ...Object.values(EFFECTS_CONFIG.POS_ANGLE))
    .onChange(angle => {
        const angleFixed = angle + ANGLE_FIX;
        positions[elemName][direction].angle = angleFixed;
        const distance = positions[elemName][direction].distance;
        // const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        updatePosition(element, angleFixed, distance, direction)
        resetChildrenStyle(element)
        init();
    })

    const distCtrllr = positionFolder.add(CONFIG[sectionName][elemName][direction].effects.position, ...Object.values(EFFECTS_CONFIG.POS_DIST))
    .onChange(newDist => {
        positions[elemName][direction].distance = newDist;
        const angle = positions[elemName][direction].angle;
        updatePosition(element, angle, newDist, direction)
        resetChildrenStyle(element)
        init();
    })
    positionFolder.open();

    const rotateCtrllr = folder.add(CONFIG[sectionName][elemName][direction].effects, ...Object.values(EFFECTS_CONFIG.ROTATE))
    .onChange(val => {
        element.style.setProperty(`--rotate-${direction}`, `${val}deg`);
            element.nextElementSibling.style.setProperty(`--rotate-${direction}`, `${val}deg`);
        
        resetChildrenStyle(element)
        init();
    })

    const rotateYCtrllr = folder.add(CONFIG[sectionName][elemName][direction].effects, ...Object.values(EFFECTS_CONFIG.ROTATE_Y))
    .onChange(val => {
        element.style.setProperty(`--rotate-y-${direction}`, `${val}deg`);
            element.nextElementSibling.style.setProperty(`--rotate-y-${direction}`, `${val}deg`);
        
        resetChildrenStyle(element)
        init();
    })

    const rotateXCtrllr = folder.add(CONFIG[sectionName][elemName][direction].effects, ...Object.values(EFFECTS_CONFIG.ROTATE_X))
    .onChange(val => {
        element.style.setProperty(`--rotate-x-${direction}`, `${val}deg`);
            element.nextElementSibling.style.setProperty(`--rotate-x-${direction}`, `${val}deg`);
        
        resetChildrenStyle(element)
        init();
    })

    const skewXCtrllr = folder.add(CONFIG[sectionName][elemName][direction].effects, ...Object.values(EFFECTS_CONFIG.SKEW_X))
    .onChange(val => {
        element.style.setProperty(`--skew-x-${direction}`, `${val}deg`);
            element.nextElementSibling.style.setProperty(`--skew-x-${direction}`, `${val}deg`);
        
        resetChildrenStyle(element)
        init();
    })

    const skewYCtrllr = folder.add(CONFIG[sectionName][elemName][direction].effects, ...Object.values(EFFECTS_CONFIG.SKEW_Y))
    .onChange(val => {
        element.style.setProperty(`--skew-y-${direction}`, `${val}deg`);
            element.nextElementSibling.style.setProperty(`--skew-y-${direction}`, `${val}deg`);
        
        resetChildrenStyle(element)
        init();
    })

    const scaleXCtrllr = folder.add(CONFIG[sectionName][elemName][direction].effects, ...Object.values(EFFECTS_CONFIG.SCALE_X))
    .onChange(val => {
        element.style.setProperty(`--scale-x-${direction}`, val - 1);
            element.nextElementSibling.style.setProperty(`--scale-x-${direction}`, val - 1);
        
        resetChildrenStyle(element)
        init();
    })

    const scaleYCtrllr = folder.add(CONFIG[sectionName][elemName][direction].effects, ...Object.values(EFFECTS_CONFIG.SCALE_Y))
    .onChange(val => {
        element.style.setProperty(`--scale-y-${direction}`, val - 1);
        element.nextElementSibling.style.setProperty(`--scale-y-${direction}`, val - 1);
        resetChildrenStyle(element)
        init();
    })

    const opacityCtrllr = folder.add(CONFIG[sectionName][elemName][direction].effects, ...Object.values(EFFECTS_CONFIG.OPACITY))
    .onChange(val => {
        element.style.setProperty(`--opacity-${direction}`, val - 1);
        element.nextElementSibling.style.setProperty(`--opacity-${direction}`, val - 1);
        resetChildrenStyle(element)
        init();
    })

    const hueCtrllr = folder.add(CONFIG[sectionName][elemName][direction].effects, ...Object.values(EFFECTS_CONFIG.HUE))
    .onChange(val => {
        element.style.setProperty(`--hue-${direction}`, `${val}deg`);
            element.nextElementSibling.style.setProperty(`--hue-${direction}`, `${val}deg`);
        
        resetChildrenStyle(element)
        init();
    })

    const transOriginCtrllr = folder.add(CONFIG[sectionName][elemName][direction].effects, EFFECTS_CONFIG.TRANS_ORIGIN.LABEL, TRANSFORM_ORIGIN_OPT)
    .onChange(val => {
        const [originX, originY] = TRANSFORM_ORIGIN_VALS[val];
        const isOutAnimation = animationDirections[elemName] === ANIMATION_DIRECTION_OPT.out;
        element.style.setProperty(`--trans-origin-x`, originX);
        element.style.setProperty(`--trans-origin-y`, originY);
        if (isOutAnimation) {
            element.nextElementSibling.style.setProperty(`--trans-origin-x`, originX);
            element.nextElementSibling.style.setProperty(`--trans-origin-y`, originY);
        }
        resetChildrenStyle(element)
        init();
    })
    const ghostCtrllr = folder.add(CONFIG[sectionName][elemName][direction].effects, ...Object.values(EFFECTS_CONFIG.GHOST))
    .onChange(showGhost => {
        if (direction === ANIMATION_DIRECTION_OPT.out) {
            element.nextElementSibling.style.setProperty(`--no-ghost-out`, showGhost ? .1 : 0);
        } else {
            element.nextElementSibling.nextElementSibling.style.setProperty(`--no-ghost-in`, showGhost ? .1 : 0);
        }
        init();
    })

    controllers[sectionName][elemName] = {
        [direction]: {
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
            },
        }
    }
}

function addScrollModifications (element, sectionName, folder, elemName, direction) {
    const hint = document.querySelector(`.hint-${direction}-${elemName}`);

    const triggerCtrllr = folder.add(CONFIG[sectionName][elemName][direction].travelSettings, EFFECTS_CONFIG.TRIGGER.LABEL, ANIMATION_TRIGGER_OPT)
    .onChange(animationTrigger => {
        animationTriggers[elemName] = animationTrigger;
        hint.style.setProperty(`--offset-top-${direction}`,  `${effectStartOffset[elemName][direction][animationTrigger].current}px`);
        hint.style.setProperty(`--duration-${direction}`, `${effectDuration[elemName][direction][animationTrigger].current}px`);
        init();
    })


    const speedCtrllr = folder.add(CONFIG[sectionName][elemName][direction].travelSettings, ...Object.values(EFFECTS_CONFIG.SPEED))
    .onChange(val => {
        const animationTrigger = animationTriggers[elemName]
        const durationRef = effectDuration[elemName][direction][animationTrigger]
        durationRef.current = durationRef.default * val;
        if (direction === ANIMATION_DIRECTION_OPT.in) {
            const inAnimationStart = effectStartOffset[elemName].in[animationTrigger].current;
            const inAnimationEnd = inAnimationStart + durationRef.current;
            const outAnimationStart = effectStartOffset[elemName].out[animationTrigger].current;
            const isOverlapping = outAnimationStart < inAnimationEnd;
            if (isOverlapping) {
                durationRef.current = outAnimationStart - inAnimationStart
            }
        }
        hint.style.setProperty(`--duration-${direction}`, `${durationRef.current}px`);
        init();
    })

    const offsetCtrllr = folder.add(CONFIG[sectionName][elemName][direction].travelSettings, ...Object.values(EFFECTS_CONFIG.OFFSET))
    .onChange(val => {
        const animationTrigger = animationTriggers[elemName]
        const offsetRef = effectStartOffset[elemName][direction][animationTrigger]
        offsetRef.current = offsetRef.default + window.innerHeight * val;
        preventOverlap(direction, offsetRef, elemName, animationTrigger)
 
        hint.style.setProperty(`--offset-top-${direction}`, `${offsetRef.current}px`);
        init();
    })
    folder.add(CONFIG[sectionName][elemName][direction].travelSettings, ...Object.values(EFFECTS_CONFIG.HINT))
    .onChange(showHint => {
        [...document.querySelectorAll('.actual')].forEach(e => {
            e.style.setProperty('--z-index', 0);
        });
        [...document.querySelectorAll(`.hint-${direction}`)].forEach(e => {
            e.style.setProperty(`--visible-${direction}`, 'hidden')
            e.style.setProperty('--z-index', -1);
        });
        if (showHint) {
            hint.style.setProperty(`--visible-${direction}`, 'visible');
            element.style.setProperty('--z-index', 4)
        }
        showHideHintMarker()
        init();
    })

    controllers[sectionName][elemName][direction] = {
        travelSettings: {
            [EFFECTS_CONFIG.TRIGGER.LABEL]: triggerCtrllr,
            [EFFECTS_CONFIG.SPEED.LABEL]: speedCtrllr,
            [EFFECTS_CONFIG.OFFSET.LABEL]: offsetCtrllr,
        }
    }

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

function preventOverlap (direction, offsetRef, elemName, animationTrigger) {
    if (direction === ANIMATION_DIRECTION_OPT.out) {
        const inAnimationEndOffset = effectStartOffset[elemName].in[animationTrigger].current + effectDuration[elemName].in[animationTrigger].current
        const isOverlapping = offsetRef.current < inAnimationEndOffset;
        if (isOverlapping) {
            offsetRef.current = inAnimationEndOffset;
        }
    } 
    if (direction === ANIMATION_DIRECTION_OPT.in) {
        const outAnimationStartOffset = effectStartOffset[elemName].out[animationTrigger].current
        const inAnimationDuration = effectDuration[elemName].in[animationTrigger].current;
        const isOverlapping = outAnimationStartOffset < offsetRef.current + inAnimationDuration;
        if (isOverlapping) {
            offsetRef.current = outAnimationStartOffset - inAnimationDuration;
        }
    }
}

function getInitStyles(direction) {
    return {
        [`--opacity-${direction}`]: 0,
        [`--x-trans-${direction}`]: '0px',
        [`--y-trans-${direction}`]: '0px',
        [`--rotate-${direction}`]: '0deg',
        [`--rotate-y-${direction}`]: '0deg',
        [`--rotate-x-${direction}`]: '0deg',
        [`--skew-y-${direction}`]: '0deg',
        [`--skew-x-${direction}`]: '0deg',
        [`--hue-${direction}`]: '0deg',
        [`--scale-${direction}`]: 0,
        [`--pos-${direction}`]: '0',
        [`--trans-origin-x`]: '50%',
        [`--trans-origin-y`]: '50%',
    }
}

function resetStyles (element) {
    Object.entries({...getInitStyles(ANIMATION_DIRECTION_OPT.in), ...getInitStyles(ANIMATION_DIRECTION_OPT.out)})
        .forEach(([property, value]) => {
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
    element.style.setProperty(`--x-trans-in`, elementCSS.xTransIn);
    element.style.setProperty(`--y-trans-in`, elementCSS.yTransIn);
    element.style.setProperty(`--rotate-in`, elementCSS.rotateIn);
    element.style.setProperty(`--rotate-x-in`, elementCSS.rotateXIn);
    element.style.setProperty(`--rotate-y-in`, elementCSS.rotateYIn);
    element.style.setProperty(`--skew-x-in`, elementCSS.skewXIn);
    element.style.setProperty(`--skew-y-in`, elementCSS.skewYIn);
    element.style.setProperty(`--hue-in`, elementCSS.hueIn);
    element.style.setProperty(`--scale-x-in`, elementCSS.scaleXIn);
    element.style.setProperty(`--scale-y-in`, elementCSS.scaleYIn);

    element.style.setProperty(`--x-trans-out`, elementCSS.xTransOut);
    element.style.setProperty(`--y-trans-out`, elementCSS.yTransOut);
    element.style.setProperty(`--rotate-out`, elementCSS.rotateOut);
    element.style.setProperty(`--rotate-x-out`, elementCSS.rotateXOut);
    element.style.setProperty(`--rotate-y-out`, elementCSS.rotateYOut);
    element.style.setProperty(`--skew-x-out`, elementCSS.skewXOut);
    element.style.setProperty(`--skew-y-out`, elementCSS.skewYOut);
    element.style.setProperty(`--hue-out`, elementCSS.hueOut);
    element.style.setProperty(`--scale-x-out`, elementCSS.scaleXOut);
    element.style.setProperty(`--scale-y-out`, elementCSS.scaleYOut);

    element.style.setProperty(`--trans-origin-x`, elementCSS.transOriginX);
    element.style.setProperty(`--trans-origin-y`, elementCSS.transOriginY);
}

function getStyle (element) {
    return {
        'xTransIn': window.getComputedStyle(element).getPropertyValue(`--x-trans-in`),
        'yTransIn': window.getComputedStyle(element).getPropertyValue(`--y-trans-in`),
        'rotateIn': window.getComputedStyle(element).getPropertyValue(`--rotate-in`),
        'rotateYIn': window.getComputedStyle(element).getPropertyValue(`--rotate-y-in`),
        'rotateXIn': window.getComputedStyle(element).getPropertyValue(`--rotate-x-in`),
        'skewXIn': window.getComputedStyle(element).getPropertyValue(`--skew-x-in`),
        'skewYIn': window.getComputedStyle(element).getPropertyValue(`--skew-y-in`),
        'hueIn': window.getComputedStyle(element).getPropertyValue(`--hue-in`),
        'scaleXIn': window.getComputedStyle(element).getPropertyValue(`--scale-x-in`),
        'scaleYIn': window.getComputedStyle(element).getPropertyValue(`--scale-y-in`),

        'xTransOut': window.getComputedStyle(element).getPropertyValue(`--x-trans-out`),
        'yTransOut': window.getComputedStyle(element).getPropertyValue(`--y-trans-out`),
        'rotateOut': window.getComputedStyle(element).getPropertyValue(`--rotate-out`),
        'rotateYOut': window.getComputedStyle(element).getPropertyValue(`--rotate-y-out`),
        'rotateXOut': window.getComputedStyle(element).getPropertyValue(`--rotate-x-out`),
        'skewXOut': window.getComputedStyle(element).getPropertyValue(`--skew-x-out`),
        'skewYOut': window.getComputedStyle(element).getPropertyValue(`--skew-y-out`),
        'hueOut': window.getComputedStyle(element).getPropertyValue(`--hue-out`),
        'scaleXOut': window.getComputedStyle(element).getPropertyValue(`--scale-x-out`),
        'scaleYOut': window.getComputedStyle(element).getPropertyValue(`--scale-y-out`),

        'transOriginXIn': window.getComputedStyle(element).getPropertyValue(`--trans-origin-x`),
        'transOriginYIn': window.getComputedStyle(element).getPropertyValue(`--trans-origin-y`),
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
            for (const [key, value] of Object.entries(elem.travelSettings)) {
                controllers[sectionName][elemName].travelSettings[key]?.setValue(value);
                if (key === 'Distance') {
                    const durationRef = effectDuration[elemName][animationTriggers[elemName]]
                    durationRef.current = durationRef.default * value;
                }
                if (key === 'Offset') {
                    const offsetRef = effectStartOffset[elemName][animationTriggers[elemName]]
                    offsetRef.current = offsetRef.default + window.innerHeight * value;
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


