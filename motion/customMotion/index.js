const animationsContainer = document.querySelector('.animationsContainer');

// const component = document.querySelector('.component');
const liveWrapper = document.querySelector('.liveWrapper');
const generatedKeyframes = document.querySelector('#generatedKeyframes');

const perspectiveInput = document.querySelector('.perspectiveInput');

let data = JSON.parse(localStorage.getItem('animationsData')) || {
    animations: [],
    perspective: ''
};

perspectiveInput.value = data.perspective;
let usePerspective = false;

const getSelectProperyElement = (animationIx, keyframeIx, propertyIx, selectedProperty) => {

    const availableProperties = [
        "opacity",
        "transform",
        "clip-path",
        "filter"
    ];

    return `
        <select onchange="setPropertyName(${animationIx}, ${keyframeIx}, ${propertyIx}, this);">
            <option selected="${selectedProperty ? 'false' : 'true'}" disabled="disabled">Select property</option>
            ${availableProperties.map(property => {
                return `<option value="${property}" ${property == selectedProperty ? 'selected' : ''}>${property}</option>`
            })}
        </select>`;
};

const getPropertyFunctionElement = (animationIx, keyframeIx, propertyIx, selectedProperty, selectedFunction) => {

    const availableFunctions = {
        "transform": [
            "translateX",
            "translateY",
            "translateZ",
            "rotateX",
            "rotateY",
            "rotateZ",
            "scaleX",
            "scaleY",
            "scaleZ",
            "skewX",
            "skewY"
        ],
        "clip-path": [
            "inset",
            "circle",
            "ellipse",
            // "polygon",
            // "path"
        ],
        "filter": [
            // "blur",
            "brightness",
            "contrast",
            // "drop-shadow",
            "grayscale",
            "hue-rotate",
            "invert",
            // "opacity",
            "saturate",
            "sepia"
        ]
    }

    if (selectedProperty in availableFunctions) {
        return `
            <select onchange="setPropertyFunction(${animationIx}, ${keyframeIx}, ${propertyIx}, this);">
                <option selected="${selectedFunction ? 'false' : 'true'}" disabled="disabled">Select function</option>
                ${availableFunctions[selectedProperty]?.map(f => {
                    return `<option value="${f}" ${f == selectedFunction ? 'selected' : ''}>${f}</option>`
                })}
            </select>`;
    } else {
        return '';
    }
};

const trashIcon = (animationIx, keyframeIx, propertyIx) =>`
    <button class="icon" type="button" onclick="deleteProperty(${animationIx}, ${keyframeIx}, ${propertyIx})">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 64 64" xml:space="preserve">
            <path d="M54,8H43V5c0-2.8-2.2-5-5-5H26c-2.8,0-5,2.2-5,5v3H10c-2.2,0-4,1.8-4,4v8h4.1l2.6,38.4c0.2,3.1,2.8,5.6,6,5.6h26.5    c3.1,0,5.8-2.5,6-5.6L53.9,20H58v-8C58,9.8,56.2,8,54,8z M21,52.1l-2-26l4-0.2l2,26L21,52.1z M34,52h-4V26h4V52z M37,8H27V6h10V8z     M43,52.1l-4-0.2l2-26l4,0.2L43,52.1z"/>
        </svg>
    </button>`;

const selectEasingElement = (animationIx, selectedEase) => {

    const allEasing = {
        linear: 'linear',

        easeInSine: "cubic-bezier(0.12, 0, 0.39, 0)",
        easeInQuad: "cubic-bezier(0.11, 0, 0.5, 0)",
        easeInCubic: "cubic-bezier(0.32, 0, 0.67, 0)",
        easeInQuart: "cubic-bezier(0.5, 0, 0.75, 0)",
        easeInQuint: "cubic-bezier(0.64, 0, 0.78, 0);",
        easeInExpo: "cubic-bezier(0.7, 0, 0.84, 0)",
        easeInCirc: "cubic-bezier(0.55, 0, 1, 0.45)",
        easeInBack: "cubic-bezier(0.36, 0, 0.66, -0.56)",

        easeOutSine: "cubic-bezier(0.61, 1, 0.88, 1)",
        easeOutQuad: "cubic-bezier(0.5, 1, 0.89, 1)",
        easeOutCubic: "cubic-bezier(0.33, 1, 0.68, 1)",
        easeOutQuart: "cubic-bezier(0.25, 1, 0.5, 1)",
        easeOutQuint: "cubic-bezier(0.22, 1, 0.36, 1)",
        easeOutExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
        easeOutCirc: "cubic-bezier(0, 0.55, 0.45, 1)",
        easeOutBack: "cubic-bezier(0.34, 1.56, 0.64, 1)",

        easeInOutSine: "cubic-bezier(0.37, 0, 0.63, 1)",
        easeInOutQuad: "cubic-bezier(0.45, 0, 0.55, 1)",
        easeInOutCubic: "cubic-bezier(0.65, 0, 0.35, 1)",
        easeInOutQuart: "cubic-bezier(0.76, 0, 0.24, 1)",
        easeInOutQuint: "cubic-bezier(0.83, 0, 0.17, 1)",
        easeInOutExpo: "cubic-bezier(0.87, 0, 0.13, 1)",
        easeInOutCirc: "cubic-bezier(0.85, 0, 0.15, 1)",
        easeInOutBack: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
    };

    return `
        <select onchange="setTimingFunction(${animationIx}, this);">
            ${Object.entries(allEasing).map(([name, value]) => {
                return `<option value="${value}" ${selectedEase === value ? 'selected' : ''}>${name}</option>`
            })}
        </select>`;
}

function clearData() {
    data.animations.splice(0, data.animations.length);
    data.perspective = '800px';
    perspectiveInput.value = '800px';
    localStorage.clear();
    addAnimation();
}

function saveData() {
    const e = document.createElement('a');
    e.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)));
    e.setAttribute('download', 'animation.json');

    if (document.createEvent) {
        const ev = document.createEvent('MouseEvents');
        ev.initEvent('click', true, true);
        e.dispatchEvent(ev);
    }
    else {
        e.click();
    }
}

function loadData(e) {

    const reader = new FileReader();
    reader.onload = (ee) => {
        data = JSON.parse(ee.target.result);
        renderForm();
    }
    reader.readAsText(e.files[0]);
}

if (data.animations.length === 0) {
    addAnimation();
} else {
    renderForm();
}

function addAnimation() {

    const animationIx = data.animations.length;
    const thisData = {
        name: `Animation${animationIx}`,
        duration: 3,
        delay: 0,
        timingFunction: 'linear',
        iterations: 1,
        keyframes: [{
            key: '0',
            properties: [{ propertyName: undefined, value: '' }]
        }]
    }

    data.animations.push(thisData),

    renderForm();
}

function addKeyframe(animationIx) {
    data.animations[animationIx].keyframes.push({
        key: '0',
        properties: [{ propertyName: undefined, value: '' }]
    });
    renderForm();
}

function addProperty(animationIx, keyframeIx) {
    data.animations[animationIx].keyframes[keyframeIx].properties.push({ propertyName: undefined, value: '' });
    renderForm();
}

function deleteProperty(animationIx, keyframeIx, propertyIx) {
    
    data.animations[animationIx].keyframes[keyframeIx].properties.splice(propertyIx, 1);
        
    if (data.animations[animationIx].keyframes[keyframeIx].properties.length === 0) {
        data.animations[animationIx].keyframes.splice(keyframeIx, 1);
    }

    if (data.animations[animationIx].keyframes.length === 0) {
        data.animations.splice(animationIx, 1);
    }

    renderForm();
}

function renderForm() {

    let animationHTML = ``;

    data.animations.forEach((animation, animationIx) => {
        
        let keyframesHTML = ``;        
        animation.keyframes.forEach((keyframe, keyframeIx) => {

            let propertiesHTML = ``;

            keyframe.properties.forEach((property, propertyIx) => {
                
                const {propertyName, propertyFunction, value} = property;
                
                propertiesHTML += `
                    <fieldset class="propertyWrapper" name="property${propertyIx}">
                        ${getSelectProperyElement(animationIx, keyframeIx, propertyIx, propertyName)}
                        ${getPropertyFunctionElement(animationIx, keyframeIx, propertyIx, propertyName, propertyFunction)}
                        ${propertyName ?
                            `<input
                                type="text"
                                class="keyframeInput"
                                value="${value}"
                                placeholder="value"
                                onchange="setPropertyValue(${animationIx}, ${keyframeIx}, ${propertyIx}, this);"
                                />` : ''}
                        ${trashIcon(animationIx, keyframeIx, propertyIx)}
                    </fieldset>
                `;
            });

            keyframesHTML += `
                <fieldset class="keyframeWrapper" name="keyframe${keyframeIx}">
                
                    <div class="keyframeKey" contenteditable oninput="setKey(${animationIx}, ${keyframeIx}, this.innerHTML);">${keyframe.key}</div>
                    <div class="propertiesWrapper">
                        ${propertiesHTML}
                        <button type="button" onclick="addProperty(${animationIx}, ${keyframeIx});" class="txtBtn">Add Property</button>
                    </div>
                </fieldset>
            `;
        });

        animationHTML += `
            <fieldset class="animationWrapper">
                <div class="animationName" contenteditable oninput="setAnimationName(${animationIx}, this.innerHTML);">${animation.name}</div>
                <div class="animationDataline">
                    Duration:
                    <input
                        type="number"
                        class="durationInput"
                        value="${animation.duration}"
                        onchange="setDuration(${animationIx}, this.value);"
                        /> (seconds)
                </div>
                <div class="animationDataline">
                    Delay:
                    <input
                        type="number"
                        class="delayInput"
                        value="${animation.delay}"
                        onchange="setDelay(${animationIx}, this.value);"
                        /> (seconds)
                </div>
                <div class="animationDataline">
                    Timing function:
                    ${selectEasingElement(animationIx, animation.timingFunction)}
                </div>
                <div class="animationDataline">
                    Iterations:
                    <input
                        type="number"
                        class="iterationInput"
                        value="${animation.iterations}"
                        onchange="setIterations(${animationIx}, this.value);"
                        /> (set to 0 for looping)
                </div>
                <div class="keyframesWrapper">
                    ${keyframesHTML}
                    <button type="button" onclick="addKeyframe(${animationIx});" class="txtBtn">Add keyframe</button>                
                </div>
            </fieldset>
        `;
    });

    animationsContainer.innerHTML = animationHTML;
    localStorage.setItem('animationsData', JSON.stringify(data));

    usePerspective = document.querySelectorAll(`
        .propertyWrapper option[value="translateZ"][selected],
        .propertyWrapper option[value="rotateX"][selected],
        .propertyWrapper option[value="rotateY"][selected],
        .propertyWrapper option[value="scaleZ"][selected]
    `).length > 0;

    perspectiveInput.disabled = !usePerspective;
}

function setPerspective(v) {
    data.perspective = v;
    localStorage.setItem('animationsData', JSON.stringify(data));
}

function setAnimationName(animationIx, v) {
    data.animations[animationIx].name = v;
    localStorage.setItem('animationsData', JSON.stringify(data));
}

function setDuration(animationIx, v) {
    data.animations[animationIx].duration = v;
    localStorage.setItem('animationsData', JSON.stringify(data));
}

function setDelay(animationIx, v) {
    data.animations[animationIx].delay = v;
    localStorage.setItem('animationsData', JSON.stringify(data));
}

function setIterations(animationIx, v) {
    data.animations[animationIx].iterations = v;
    localStorage.setItem('animationsData', JSON.stringify(data));
}

function setTimingFunction(animationIx, e) {
    data.animations[animationIx].timingFunction = e.options[e.selectedIndex].value;
    localStorage.setItem('animationsData', JSON.stringify(data));
}

function setKey(animationIx, keyframeIx, v) {
    data.animations[animationIx].keyframes[keyframeIx].key = v;
    localStorage.setItem('animationsData', JSON.stringify(data));
}

function setPropertyName(animationIx, keyframeIx, propertyIx, e) {
    data.animations[animationIx].keyframes[keyframeIx].properties[propertyIx].propertyName = e.options[e.selectedIndex].value;
    localStorage.setItem('animationsData', JSON.stringify(data));
    renderForm();
}

function setPropertyFunction(animationIx, keyframeIx, propertyIx, e) {
    data.animations[animationIx].keyframes[keyframeIx].properties[propertyIx].propertyFunction = e.options[e.selectedIndex].value;
    localStorage.setItem('animationsData', JSON.stringify(data));
    console.log(e);
    console.log(e.options[e.selectedIndex].value);
    renderForm();
}

function setPropertyValue(animationIx, keyframeIx, propertyIx, e) {
    data.animations[animationIx].keyframes[keyframeIx].properties[propertyIx].value = e.value;
    localStorage.setItem('animationsData', JSON.stringify(data));
}

function runAnimation() {
    
    let divs;    
    const keyframes = data.animations.map(animation => {
                
        const keys = animation.keyframes.map(keyframe => {
            
            const thisKey = {
                "opacity": '',
                "transform": [],
                "clip-path": [],
                "filter": []
            }

            keyframe.properties.forEach(({propertyName, propertyFunction, value}) => {
                if (propertyName === 'opacity') {
                    thisKey.opacity = value;
                } else {
                    thisKey[propertyName]?.push(`${propertyFunction}(${value})`);
                }
            });

            // sort transforms:
            const newTransforms = thisKey.transform.map(p => {
                return p.replace('translate', 'A_translate').replace('rotate', 'B_rotate').replace('scale', 'C_scale').replace('skew', 'D_skew');
            }).sort().map(p => {
                return p.replace('A_', '').replace('B_', '').replace('C_', '').replace('D_', '');
            });

            return `
                ${keyframe.key}% {
                    ${thisKey.opacity !== '' ? `opacity: ${thisKey.opacity};` : ''}
                    ${newTransforms.length > 0 ? `transform: ${newTransforms.join(' ')};` : ''}
                    ${thisKey['clip-path'].length > 0 ? `clip-path: ${thisKey['clip-path'].join(' ')};` : ''}
                    ${thisKey['filter'].length > 0 ? `filter: ${thisKey['filter'].join(' ')};` : ''}
                }`;
        });

        const wrapper = document.createElement('div');
        wrapper.classList.add(divs ? 'liveAnimationWrapper' : 'liveAnimationComponent');

        const thisAnimation = `${animation.name} ${animation.duration}s ${animation.delay}s ${animation.iterations === '0' ? 'infinite' : animation.iterations} ${animation.timingFunction} both paused`;
        console.log(thisAnimation);

        wrapper.style.animation = thisAnimation;
        wrapper.dataset.animation = thisAnimation;
        
        if (divs) {
             wrapper.appendChild(divs);
        }
        divs = wrapper;

        return `
            @keyframes ${animation.name} {${keys.join('')}
            }`;
    });

    const style = keyframes.join('');

    console.log(style);

    generatedKeyframes.innerHTML = keyframes.join('');

    liveWrapper.appendChild(divs);
    
    if (usePerspective) {
        liveWrapper.style.perspective = document.querySelector('.perspectiveInput').value;
    }

    setTimeout(() => {
        document.querySelectorAll('[data-animation').forEach(e => {
            e.style.animationPlayState = 'running';
        })
    }, 500);
    
    liveWrapper.classList.add('show');
}

function editAnimation() {
    liveWrapper.classList.remove('show');
    setTimeout(() => {
        liveWrapper.querySelector(':scope > .liveAnimationWrapper')?.remove();
        liveWrapper.querySelector(':scope > .liveAnimationComponent')?.remove();
        liveWrapper.style.perspective = null;
    }, 500);
}

function rerunAnimation() {

    document.querySelectorAll('[data-animation]').forEach(e => {
        e.style.animation = null;
    })
    
    requestAnimationFrame(() => {
        document.querySelectorAll('[data-animation]').forEach(e => {
            e.style.animation = e.dataset.animation;
            e.style.animationPlayState = 'running';
        })
    });
}



