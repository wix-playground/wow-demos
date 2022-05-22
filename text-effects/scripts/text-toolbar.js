import { $id } from '../../utils/utils.js';
export function setTextToolbarFontList(fonts) {
    const item = $id('font-family-template').content.firstElementChild;
    const list = $id('font-family-list');

    fonts.forEach(({ family, variants, selected }) => {
        variants.forEach((variant) => {
            // Create font item
            const clone = item.cloneNode(true);
            const familyInput = clone.querySelector('.family');
            const variantInput = clone.querySelector('.variant');
            const content = clone.querySelector('.content');

            familyInput.value = family;
            variantInput.value = variant;
            content.textContent = `${family} ${['400', 'regular'].includes(variant) ? '' : variant}`;
            content.style.fontFamily = family;
            content.style.fontWeight = variant;
            // Set default
            if (selected) {
                familyInput.setAttribute('checked', 'checked');
            }

            // Add to document
            list.appendChild(clone);
        });
    });
}
