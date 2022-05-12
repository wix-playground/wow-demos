import { $id } from '../../utils/utils.js';
export function setTextToolbarFontList(fonts) {
    const item = $id('font-family-template').content.firstElementChild;
    const list = $id('font-family-list');

    fonts.forEach(({ family, selected }) => {
        // Create font item
        const clone = item.cloneNode(true);
        const input = clone.querySelector('.input');
        const content = clone.querySelector('.content');

        input.value = family;
        content.textContent = family;
        content.style.fontFamily = family;

        // Set default
        if (selected) {
            input.setAttribute('checked', 'checked');
        }

        // Add to document
        list.appendChild(clone);
    });
}

