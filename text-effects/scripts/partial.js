window.partial = (file, removeScript = true) => {
    const scr = document.currentScript;
    const request = new XMLHttpRequest();

    request.open('GET', file, false); // `false` makes the request synchronous
    request.send(null);

    if (request.status === 200) {
        document.write(`<!-- Source: ${file} -->`);
        document.write(request.responseText);
        if (removeScript) {
            scr.parentNode.removeChild(scr)
        }
    }
};

