// import TextToSVG from 'text-to-svg';

const video = document.querySelector('#video');
const clipDummy = document.querySelector('#clip-dummy');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const clipContainer = document.querySelector('#clip-container');
const videoSelector = document.querySelector('#video-selector');
const backgroundColor = document.querySelector('#background-color');
const SVG = {
    // tigerHead: 'svg/tiger-head.svg',
    // tigerProfile: 'svg/tiger-profile.svg',
    // waves: 'svg/waves.svg',
    // circles: 'svg/circles.svg',
    fest1: 'svg/fest1.svg',
    fest2: 'svg/fest2.svg',
    fest3: 'svg/fest3.svg',
    fest4: 'svg/fest4.svg',
    fest5: 'svg/fest5.svg',
    // fest6: 'svg/fest6.svg'
    fest7: 'svg/fest7.svg'
};

const TEXT_SVG = `<svg viewBox="0 0 200 200" height="200" width="200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <style>
        /*@import url('https://fonts.googleapis.com/css?family=Allerta+Stencil&display=swap');*/
        text {
            /*font-family: 'Allerta Stencil', sans-serif;*/
            font-family: 'Impact', sans-serif;
            font-size: 60px;
            font-weight: bold;
        }
    </style>
    <text x="5" y="120">TIGER</text>
</svg>`;

function drawInlineSVG (ctx, rawSVG, callback) {
    const svg = new Blob([rawSVG], {type:"image/svg+xml"}),
        url = URL.createObjectURL(svg),
        img = new Image;

    img.onload = function () {
        ctx.drawImage(this, 0, 0);
        URL.revokeObjectURL(url);
        callback(this);
    };

    img.src = url;
}

function applyMask (clip) {
    clip.setAttribute('width', video.offsetWidth);
    clip.setAttribute('height', video.offsetHeight);

    canvas.width = video.offsetWidth;
    canvas.height = video.offsetHeight;

    // if ('maskImage' in canvas.style || 'webkitMaskImage' in canvas.style) {
    drawInlineSVG(ctx, clip.outerHTML, function () {
        const mask = `url(${canvas.toDataURL()})`;
        video.style.webkitMaskImage = mask;  // -> PNG data-uri
        // video.style.maskImage = mask;  // -> PNG data-uri
    });
    // }
}

function fetchSVG (url) {
    return fetch(new Request(url))
        .then(response => response.text());
}

function main () {
    const handler = (svg, id) => {
        const div = document.createElement('div');
        div.classList.add('clip');
        div.innerHTML = svg;
        const clip = div.firstElementChild;
        clip.id = id;
        clipContainer.appendChild(div);
    };

    const fetching = new Promise(resolve => {
        Promise.all(Object.keys(SVG).map(id => {
            return fetchSVG(SVG[id])
                .then(svg => handler(svg, id));
        }))
            .then(() => {
                handler(TEXT_SVG, 'text');
            })
            .then(resolve);
    });

    fetching.then(() => {
        const clipClickHandler = e => {
            const clip = e.target.closest('svg');

            if (clip) {
                const clone = clip.cloneNode(true);
                clipDummy.appendChild(clone);

                const {width, height, x, y} = clone.getBBox();
                clone.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);

                clone.remove();

                applyMask(clone);
            }
        };

        clipContainer.addEventListener('click', clipClickHandler);

        videoSelector.addEventListener('change', e => {
            const index = e.target.selectedIndex;
            const src = e.target.children[index].value;

            video.src = src;
        });

        backgroundColor.addEventListener('input', e => {
            const value = e.target.value;

            document.body.style.backgroundColor = value;
        });

        const textButton = document.querySelector('text').closest('.clip');
        const editTextButton = document.createElement('button');
        const editTextInput = document.createElement('input');
        const textDummy = document.querySelector('#text-dummy');
        const MAX_WIDTH = window.getComputedStyle(textButton).width;
        editTextButton.innerText = 'Edit';
        editTextButton.id = 'edit-text';
        editTextInput.type = 'text';
        editTextInput.id = 'edit-text-input';
        textButton.appendChild(editTextButton);
        textButton.appendChild(editTextInput);
        editTextInput.style.width = MAX_WIDTH;

        editTextButton.addEventListener('click', e => {
            e.stopPropagation();

            const textElement = textButton.querySelector('text');
            const textButtonSVG = textButton.querySelector('svg');
            editTextInput.value = textElement.innerHTML;
            editTextInput.classList.add('show');
            textButton.classList.add('hide');
            editTextInput.select();
            editTextInput.focus();

            let fontSize = parseInt(window.getComputedStyle(editTextInput).fontSize);
            let fontSizeString = `${fontSize}px`;
            const INITIAL_FONT_SIZE = fontSizeString;

            textDummy.innerText = editTextInput.value;
            textDummy.style.fontSize = fontSizeString;

            const cancelHandler = clear => {
                editTextInput.classList.remove('show');
                editTextInput.removeEventListener('keydown', keydownHandler);
                editTextInput.blur();
                const bbox = textButtonSVG.getBBox();
                textButtonSVG.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
                textButton.classList.remove('hide');

                if (clear) {
                    editTextInput.style.fontSize = INITIAL_FONT_SIZE;
                    textDummy.style.fontSize = INITIAL_FONT_SIZE;
                    textElement.setAttribute('style', `font-size: ${INITIAL_FONT_SIZE}`);
                }
            };

            const applyHandler = () => {
                textElement.innerHTML = editTextInput.value;

                clipClickHandler({
                    target: textElement
                });

                cancelHandler();
            };

            const clickOutsideHandler = e => {
                e.stopPropagation();
                applyHandler();
                document.body.removeEventListener('click', clickOutsideHandler, true);
            };

            document.body.addEventListener('click', clickOutsideHandler, true);

            const keydownHandler = e => {
                if (e.code === 'Enter') {
                    applyHandler();
                } else if (e.code === 'Escape') {
                    cancelHandler(true);
                } else {
                    fontSize = parseInt(window.getComputedStyle(editTextInput).fontSize);
                    fontSizeString = `${fontSize}px`;
                    textDummy.innerText = editTextInput.value;
                    textDummy.style.fontSize = fontSizeString;

                    let {width} = textDummy.getBoundingClientRect();

                    if (width > parseInt(MAX_WIDTH)) {
                        while (width > parseInt(MAX_WIDTH)) {
                            fontSize -= 1;
                            fontSizeString = `${fontSize}px`;
                            editTextInput.style.fontSize = fontSizeString;
                            textDummy.style.fontSize = fontSizeString;
                            width = textDummy.getBoundingClientRect().width;
                        }
                    }
                    else {
                        while (width < parseInt(MAX_WIDTH) && fontSize < 60) {
                            fontSize += 1;
                            fontSizeString = `${fontSize}px`;
                            editTextInput.style.fontSize = fontSizeString;
                            textDummy.style.fontSize = fontSizeString;
                            width = textDummy.getBoundingClientRect().width;
                        }
                    }

                    textElement.setAttribute('style', `font-size: ${fontSize}px`);
                }
            };

            editTextInput.addEventListener('keydown', keydownHandler);
        });
    });
}

main();
