import { $id } from '../../utils/utils.js';
export function setTextToolbarFontList(fonts) {
    const item = $id('font-family-template').content.firstElementChild;
    const list = $id('font-family-list');
    const variantInput = $id('font-family-variant');
    fonts.forEach(({ family, variants, selected }) => {
        variants.forEach((variant) => {
            // Create font item
            const clone = item.cloneNode(true);
            const familyInput = clone.querySelector('.family');
            const content = clone.querySelector('.content');

            familyInput.value = family;
            familyInput.dataset.variant = variant;
            content.textContent = `${family} ${['400', 'regular'].includes(variant) ? '' : variant}`;
            content.style.fontFamily = family;
            content.style.fontWeight = variant;

            // Set default
            if (selected) {
                familyInput.setAttribute('checked', 'checked');
            }

            familyInput.addEventListener('change', (event) => {
                variantInput.value = event.target.dataset.variant;
            });
            // Add to document
            list.appendChild(clone);
        });
    });
}
