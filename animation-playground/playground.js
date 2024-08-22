'use strict';
let animations;

// Animation properties
const animationProperties = window['santa-animations'].animationProperties;

// Selectors
const animationSelection = document.getElementById('animation-selection');
const animationSelectionForm = document.getElementById('animation-selection-form');
const animationViewModeName = document.getElementById('animation-viewmode-name');
const animationNameIn = document.getElementById('animation-name-in');
const animationNameOut = document.getElementById('animation-name-out');
const animationInfoIn = document.getElementById('animation-info-in');
const animationInfoOut = document.getElementById('animation-info-out');
const animationParamsIn = document.getElementById('animation-params-in');
const animationParamsOut = document.getElementById('animation-params-out');
const animationExecute = document.getElementById('animation-execute');

// Specials
const changeEvent = new Event('change');
const mobileQuery = window.matchMedia('(max-width: 768px)');
let isMobile = mobileQuery.matches;

// BaseClear props
const clearProps = 'clip,clipPath,webkitClipPath,willChange,opacity,transform,transformOrigin';
const clearPropsNoOpacity = 'clip,clipPath,webkitClipPath,willChange,transform,transformOrigin';

// Update form fields and info on select change
animationNameIn.addEventListener('change', (event) => {
    const props = animations.getProperties(event.target.value);
    animationInfoIn.textContent = JSON.stringify(props, null, 2);
    populateAnimationParams(animationParamsIn, 'in', props.schema);
});

// Update info on select change
animationNameOut.addEventListener('change', (event) => {
    const props = animations.getProperties(event.target.value);
    animationInfoOut.textContent = JSON.stringify(props, null, 2);
    populateAnimationParams(animationParamsOut, 'out', props.schema);
});

// On button click, Execute out animation and then in animation
animationExecute.addEventListener('click', () => {
    // Get all in form elements values
    const nameIn = animationNameIn.selectedOptions[0].label;
    const paramsInElements = animationParamsIn.querySelectorAll('input, select');
    const {
        duration: durationIn,
        delay: delayIn,
        ...paramsIn
    } = Object.fromEntries(
        Array.from(paramsInElements).map((el) => [el.dataset.key, el.type === 'number' ? +el.value : el.value]),
    );

    // Get all out form elements values
    const nameOut = animationNameOut.selectedOptions[0].label;
    const paramsOutElements = animationParamsOut.querySelectorAll('input, select');
    const {
        duration: durationOut,
        delay: delayOut,
        ...paramsOut
    } = Object.fromEntries(
        Array.from(paramsOutElements).map((el) => [el.dataset.key, el.type === 'number' ? +el.value : el.value]),
    );

    const elements = document.getElementsByClassName('comp');

    // In mobile view hide the panel
    if (isMobile) {
        animationSelection.classList.add('hide-panel');
    }

    // Run out animation, on complete clear transforms and run in animation
    animations.animate('BaseClear', elements, 0, 0, { clearProps });
    animations.animate(nameOut, elements, durationOut, delayOut, {
        ...paramsOut,
        callbacks: {
            onComplete: () => {
                animations.animate('BaseClear', elements, 0, 0, {
                    clearProps: clearPropsNoOpacity,
                });
                animations.animate(nameIn, elements, durationIn, delayIn, {
                    ...paramsIn,
                    callbacks: {
                        onComplete: () => {
                            if (isMobile) {
                                animationSelection.classList.remove('hide-panel');
                            }
                        },
                    },
                });
            },
        },
    });

    // Eventually save form values in session
    Array.from(animationSelectionForm.elements).forEach((el) => sessionStorage.setItem(el.name, el.value));
});

// Mobile Handling - reload animation definitions
mobileQuery.addListener((event) => {
    if (isMobile !== event.matches) {
        isMobile = event.matches;
        animations.updateViewMode(viewMode());
        animationViewModeName.textContent = viewMode();

        animationNameIn.dispatchEvent(changeEvent);
        animationNameOut.dispatchEvent(changeEvent);
    }
});

onLoad(() => {
    // Init animations with gsap2 or 3
    if (window.tweenEngine2) {
        animations = window['santa-animations'].create(
            window.tweenEngine2.create(window.TweenMax, window.TimelineMax),
            window,
            viewMode(),
        );
    } else {
        animations = window['santa-animations'].create(window.tweenEngine3.create(window.gsap), window, viewMode());
    }

    // Get all animation names
    populateAnimationsSelect();
    animationViewModeName.textContent = viewMode();

    // Default to FadeIn and FadeOut
    animationNameIn.value = sessionStorage.getItem(animationNameIn.name) || 'FadeIn';
    animationNameOut.value = sessionStorage.getItem(animationNameOut.name) || 'FadeOut';

    animationNameIn.dispatchEvent(changeEvent);
    animationNameOut.dispatchEvent(changeEvent);

    // Get values from sessionStorage if any
    requestAnimationFrame(() =>
        Array.from(animationSelectionForm.elements).forEach((element) => {
            const value = sessionStorage.getItem(element.name);
            if (value) {
                element.value = element.type === 'number' ? +value : value;
            }
        }),
    );
});

// Fill Select fields
// Filter by in and out but not modes animations
function populateAnimationsSelect() {
    Object.entries(animationProperties).forEach(([name, props]) => {
        const { groups = [], modeChange } = props;
        if ((groups.includes('entrance') || groups.includes('exit')) && !modeChange) {
            const option = document.createElement('option');
            option.label = name;
            option.value = name;
            if (groups.includes('entrance')) {
                animationNameIn.appendChild(option);
            } else {
                animationNameOut.appendChild(option);
            }
        }
    });
}

function populateAnimationParams(paramsArea, suffix, schema) {
    paramsArea.innerHTML = '';
    Object.entries(schema).forEach(([key, def]) => {
        const id = `${key}-${suffix}`;
        const label = document.createElement('label');
        label.for = id;
        paramsArea.appendChild(label);
        label.textContent = `${capitalize(key)}:`;
        if (def.type === 'number') {
            // override duration 0 default
            if (key === 'duration') {
                def.default = 1;
            }
            paramsArea.appendChild(numberInput(def, id, key));
        } else if (def.type === 'string' && def.enum) {
            paramsArea.appendChild(enumInput(def, id, key));
        } else if (def.type === 'boolean') {
            paramsArea.appendChild(booleanInput(def, id, key));
        } else {
            paramsArea.appendChild(missingInput(def, id, key));
        }
    });
}

// Controls

function numberInput(schema, id, key) {
    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.name = id;
    input.dataset.key = key;
    if (typeof schema.min !== 'undefined') {
        input.min = schema.min;
    }
    if (typeof schema.max !== 'undefined') {
        input.max = schema.max;
    }
    input.step = schema.step || 0.1;
    input.value = schema.default;
    return input;
}

function enumInput(schema, id, key) {
    const select = document.createElement('select');
    select.id = id;
    select.name = id;
    select.dataset.key = key;

    for (const item of schema.enum) {
        const option = document.createElement('option');
        option.value = item;
        option.label = item;
        if (schema.default === item) {
            option.selected = 'selected';
        }
        select.appendChild(option);
    }

    return select;
}

function booleanInput(schema, id, key) {
    const checkbox = document.createElement('input');
    checkbox.id = id;
    checkbox.name = id;
    checkbox.dataset.key = key;
    checkbox.type = 'checkbox';
    if (schema.default) {
        checkbox.checked = 'checked';
    }

    return checkbox;
}

function missingInput(schema, id) {
    const textarea = document.createElement('textarea');
    textarea.id = id;
    textarea.name = id;
    textarea.placeholder = `missing ${JSON.stringify(schema, null, 2)}`;

    return textarea;
}

// Helpers

function onLoad(func) {
    if (document.readyState === 'loading') {
        // Loading hasn't finished yet
        document.addEventListener('DOMContentLoaded', () => func());
    } else {
        // `DOMContentLoaded` has already fired
        func();
    }
}

function viewMode() {
    return isMobile ? 'mobile' : 'desktop';
}

function capitalize(str) {
    return str.replace(/^\w|\s\w/g, (match) => match.toUpperCase());
}
