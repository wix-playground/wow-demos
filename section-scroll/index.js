import { Scroll } from './two.5.js';

const gui = new dat.gui.GUI();

const SECTION_1 = 'section 1';
const SECTION_2 = 'section 2';
const SECTION_3 = 'section 3';
const SECTION_4 = 'section 4';
const SECTION_5 = 'section 5';

const PHOTO = 'photo';
const TEXT = 'text';

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
    }
};

const defaultSettings = {
    [EFFECTS_CONFIG.TRANSLATE_X.LABEL]: 0,
    [EFFECTS_CONFIG.TRANSLATE_Y.LABEL]: 0,
    [EFFECTS_CONFIG.ROTATE.LABEL]: 0,
    [EFFECTS_CONFIG.SCALE.LABEL]: 1,
    [EFFECTS_CONFIG.OPACITY.LABEL]: 1,
    [EFFECTS_CONFIG.GHOST.LABEL]: true,
}


const config = {
    [SECTION_1]: {
        [PHOTO]: defaultSettings,
        [TEXT]: defaultSettings,
    }
};


gui.remember(config);

createSection1Folder();

const sections = [...document.querySelectorAll('section')];
function getSectionsRecs () {
    return sections.map(section => {
       return section.getBoundingClientRect();
    });
}

function init () {
    const rects = getSectionsRecs();
    const viewHeight = window.innerHeight;
    const scroll = new Scroll({
        scenes: [
            {
                start: rects[0].top,
                duration: viewHeight,
                target: [...sections[0].querySelectorAll('.element')],
                effect: function (scene, pos) {
                    scene.target.forEach(e => e.style.setProperty('--pos', pos));
                }
            },
            {
                start: rects[1].top,
                duration: viewHeight,
                target: [...sections[1].querySelectorAll('.element')],
                effect: function (scene, pos) {
                    scene.target.forEach(e => e.style.setProperty('--pos', pos));
                }
            },
        ]
    });

    scroll.on();
}

init();


function createSection1Folder() {
    const folder1 = gui.addFolder(SECTION_1)
    folder1.open();

    const photo1 = folder1.addFolder(PHOTO);
    addScrollEffects(photo1, PHOTO, 'img', 0)
    const text1 = folder1.addFolder(TEXT);
    addScrollEffects(text1, TEXT, 'h1', 0)


    // photo1.add(config[SECTION_1][PHOTO], ...Object.values(EFFECTS_CONFIG.TRANSLATE_X))
    //     .onChange(val => {
    //         const elements = [...sections[0].querySelectorAll('img')];
    //         elements.forEach(e => e.style.setProperty('--x-trans', `${val}px`));
    //         init();
    //     })
    // photo1.add(config[SECTION_1][PHOTO], ...Object.values(EFFECTS_CONFIG.TRANSLATE_Y))
    //     .onChange(val => {
    //         const elements = [...sections[0].querySelectorAll('img')];
    //         elements.forEach(e => e.style.setProperty('--y-trans', `${val}px`));
    //         init();
    //     })
    // photo1.add(config[SECTION_1][PHOTO], ...Object.values(EFFECTS_CONFIG.ROTATE))
    //     .onChange(val => {
    //         const elements = [...sections[0].querySelectorAll('img')];
    //         elements.forEach(e => e.style.setProperty('--rotate', `${val}deg`));
    //         init();
    //     })
    // photo1.add(config[SECTION_1][PHOTO], ...Object.values(EFFECTS_CONFIG.SCALE))
    //     .onChange(val => {
    //         const elements = [...sections[0].querySelectorAll('img')];
    //         elements.forEach(e => e.style.setProperty('--scale', val - 1));
    //         init();
    //     })
    // photo1.add(config[SECTION_1][PHOTO], ...Object.values(EFFECTS_CONFIG.OPACITY))
    //     .onChange(val => {
    //         const elements = [...sections[0].querySelectorAll('img')];
    //         elements.forEach(e => e.style.setProperty('--opacity', val - 1));
    //         init();
    //     })
    // photo1.add(config[SECTION_1][PHOTO], ...Object.values(EFFECTS_CONFIG.GHOST))
    //     .onChange(showGhost => {
    //         const elements = [...sections[0].querySelectorAll('img')];
    //         elements.forEach(e => e.style.setProperty('--no-ghost', showGhost ? .1 : 0));
    //         init();
    //     })
    
}

function addScrollEffects (element, name, type, index) {
    element.add(config[SECTION_1][name], ...Object.values(EFFECTS_CONFIG.TRANSLATE_X))
    .onChange(val => {
        const elements = [...sections[index].querySelectorAll(type)];
        elements.forEach(e => e.style.setProperty('--x-trans', `${val}px`));
        init();
    })
    element.add(config[SECTION_1][name], ...Object.values(EFFECTS_CONFIG.TRANSLATE_Y))
        .onChange(val => {
            const elements = [...sections[index].querySelectorAll(type)];
            elements.forEach(e => e.style.setProperty('--y-trans', `${val}px`));
            init();
        })
    element.add(config[SECTION_1][name], ...Object.values(EFFECTS_CONFIG.ROTATE))
        .onChange(val => {
            const elements = [...sections[index].querySelectorAll(type)];
            elements.forEach(e => e.style.setProperty('--rotate', `${val}deg`));
            init();
        })
    element.add(config[SECTION_1][name], ...Object.values(EFFECTS_CONFIG.SCALE))
        .onChange(val => {
            const elements = [...sections[index].querySelectorAll(type)];
            elements.forEach(e => e.style.setProperty('--scale', val - 1));
            init();
        })
    element.add(config[SECTION_1][name], ...Object.values(EFFECTS_CONFIG.OPACITY))
        .onChange(val => {
            const elements = [...sections[index].querySelectorAll(type)];
            elements.forEach(e => e.style.setProperty('--opacity', val - 1));
            init();
        })
    element.add(config[SECTION_1][name], ...Object.values(EFFECTS_CONFIG.GHOST))
        .onChange(showGhost => {
            const elements = [...sections[index].querySelectorAll(type)];
            elements.forEach(e => e.style.setProperty('--no-ghost', showGhost ? .1 : 0));
            init();
        })
}
