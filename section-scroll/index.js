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
        MIN: -(window.innerWidth / 2 + 250),
        MAX: window.innerWidth / 2 + 250,
        STEP: 5
    },
    TRANSLATE_Y: {
        LABEL: 'Translate Y',
        MIN: -(window.innerHeight / 2 + 200),
        MAX: window.innerHeight / 2 + 200,
        STEP: 5
    },
    ROTATE: {
        LABEL: 'Rotate',
        MIN: -360,
        MAX: 360,
        STEP: 5
    }
    
};


const config = {
    [SECTION_1]: {
        [PHOTO]: {
            [EFFECTS_CONFIG.TRANSLATE_X.LABEL]: 0,
            [EFFECTS_CONFIG.TRANSLATE_Y.LABEL]: 0,
            [EFFECTS_CONFIG.ROTATE.LABEL]: 0,
        }
    }
};

const sections = [...document.querySelectorAll('section')];



gui.remember(config);

createSection1Folder();

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
                target: sections[0].querySelector('.photo'),
                effect: function (scene, pos) {
                    scene.target.style.setProperty('--pos', pos);
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


    photo1.add(config[SECTION_1][PHOTO], ...Object.values(EFFECTS_CONFIG.TRANSLATE_X))
        .onChange(val => {
            const photo = sections[0].querySelector('.photo');
            const toFrame = sections[0].querySelector('.to-frame');
            photo.style.setProperty('--x-trans', `${val}px`);
            toFrame.style.setProperty('--x-trans', `${val}px`);
            init();
        })
    photo1.add(config[SECTION_1][PHOTO], ...Object.values(EFFECTS_CONFIG.TRANSLATE_Y))
        .onChange(val => {
            const photo = sections[0].querySelector('.photo');
            const toFrame = sections[0].querySelector('.to-frame');
            photo.style.setProperty('--y-trans', `${val}px`);
            toFrame.style.setProperty('--y-trans', `${val}px`);
            init();
        })
    photo1.add(config[SECTION_1][PHOTO], ...Object.values(EFFECTS_CONFIG.ROTATE))
        .onChange(val => {
            const photo = sections[0].querySelector('.photo');
            const toFrame = sections[0].querySelector('.to-frame');
            photo.style.setProperty('--rotate', `${val}deg`);
            toFrame.style.setProperty('--rotate', `${val}deg`);
            init();
        })
}
