const video = document.querySelector('#video');
let clip;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const clipContainer = document.querySelector('#clip-container');
const SVG = [
    'svg/tiger-head.svg'
];

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

function initVideo () {
    clip.setAttribute('width', video.videoWidth);
    clip.setAttribute('height', video.videoHeight);
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
        .then(response => response.text())
}

function main () {
    fetchSVG(SVG[0])
        .then(svg => {
            const div = document.createElement('div');
            div.innerHTML = svg;
            clip = div.firstElementChild;
            clipContainer.appendChild(clip);
        })
        .then(() => {
            video.addEventListener('playing', initVideo);
        });
}

main();
