const video = document.querySelector('#video');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const clipContainer = document.querySelector('#clip-container');
const SVG = {
    tigerHead: 'svg/tiger-head.svg',
    tigerProfile: 'svg/tiger-profile.svg',
    waves: 'svg/waves.svg',
    circles: 'svg/circles.svg',
    text: 'svg/text.svg'
};

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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if ('maskImage' in canvas.style || 'webkitMaskImage' in canvas.style) {
        drawInlineSVG(ctx, clip.outerHTML, function () {
            const mask = `url(${canvas.toDataURL()})`;
            video.style.webkitMaskImage = mask;  // -> PNG data-uri
            video.style.maskImage = mask;  // -> PNG data-uri
        });
    }
}

function fetchSVG (url) {
    return fetch(new Request(url))
        .then(response => response.text());
}

function main () {
    const fetching = new Promise(resolve => {
        Promise.all(Object.keys(SVG).map(id => {
            return fetchSVG(SVG[id])
                .then(svg => {
                    const div = document.createElement('div');
                    div.classList.add('clip');
                    div.innerHTML = svg;
                    const clip = div.firstElementChild;
                    clip.id = id;
                    clipContainer.appendChild(div);
                });
        })).then(resolve);
    });

    fetching.then(() => {
        clipContainer.addEventListener('click', e => {
            const clip = e.target.closest('svg');
            const clone = clip.cloneNode(true);
            applyMask(clone);
        });
    });
}

main();
