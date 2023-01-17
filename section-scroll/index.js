import { Scroll } from './two.5.js';

const gui = new dat.gui.GUI();

const  SECTION_1 = 'section 1';
const PHOTO_COMP = 'photo';

const EFFECTS_CONFIG = {
    TRANSLATION: {
        LABEL: 'position',
        MIN: 50,
        MAX: 500,
        STEP: 5
    }
};


const config = {
    [SECTION_1]: {
        [PHOTO_COMP]: {
            [EFFECTS_CONFIG.TRANSLATION.LABEL]: 200
        }
    }
};

const sections = [...document.querySelectorAll('section')];

gui.remember(config);

const folder1 = gui.addFolder(SECTION_1)
folder1.open();

const photo1 = folder1.addFolder(PHOTO_COMP);

photo1.add(config[SECTION_1][PHOTO_COMP], EFFECTS_CONFIG.TRANSLATION.LABEL, EFFECTS_CONFIG.TRANSLATION.MIN, EFFECTS_CONFIG.TRANSLATION.MAX, EFFECTS_CONFIG.TRANSLATION.STEP)
    .onChange(v => {
        const photo = sections[0].querySelector('.photo');
        photo.style.setProperty('--yMin',  `${-v}px`);
        photo.style.setProperty('--yMax',  `${v}px`);
        init();
    })

function getSectionOffsets () {
    return sections.map(section => {
       return section.getBoundingClientRect();
    });
}

function init () {
    const rects = getSectionOffsets();
    const viewHeight = window.innerHeight;



    const scroll = new Scroll({
        scenes: [
            {
                start: rects[0].top,
                duration: rects[0].height + viewHeight,
                target: sections[0].querySelector('.photo'),
                effect: function (scene, p) {
                    scene.target.style.setProperty('--p', p);
                }
            }
        ]
    });

    scroll.on();
}

init();
