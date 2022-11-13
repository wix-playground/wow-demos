const CLIP_PARAMS = {
    initial: (top, bottom, left, right) =>  `${left}% ${top}%, ${right}% ${top}%, ${right}% ${bottom}%, ${left}% ${bottom}%`,
    top: (top, bottom, left, right, minimum) => `${left}% ${top}%, ${right}% ${top}%, ${right}% ${top + minimum}%, ${left}% ${top + minimum}%`,
    right: (top, bottom, left, right, minimum) => `${right - minimum}% ${top}%, ${right}% ${top}%, ${right}% ${bottom}%, ${right - minimum}% ${bottom}%`,
    center: (top, bottom, left, right, minimum, centerX, centerY) => `${centerX - minimum / 2}% ${centerY - minimum / 2}%, ${centerX + minimum / 2}% ${centerY - minimum / 2}%, ${centerX + minimum / 2}% ${centerY + minimum / 2}%, ${centerX - minimum / 2}% ${centerY + minimum / 2}%`,
    bottom: (top, bottom, left, right, minimum) => `${left}% ${bottom - minimum}%, ${right}% ${bottom - minimum}%, ${right}% ${bottom}%, ${left}% ${bottom}%`,
    left: (top, bottom, left, minimum) => `${left}% ${top}%, ${left + minimum}% ${top}%, ${left + minimum}% ${bottom}%, ${left}% ${bottom}%`
};

export function getClipPolygonParams (compRect, direction, minimum = 0) {
    const top = 0;
    const left = 0;
    const right = 100;
    const bottom = 100;
    const centerX = 50;
    const centerY = 50;

    return CLIP_PARAMS[direction](top, bottom, left, right, minimum, centerX, centerY);
}

export function getTranslations(rect, originDirection, scale = 1) {
    const x = originDirection.dx * rect.width * scale;
    const y = originDirection.dy * rect.height * scale;

    return { x, y };
}

export function getClipPolygonParamsExtended (
    compRect,
    contentRect,
    direction,
    { scaleX = 1, scaleY = 1, minimum = 0 } = {},
) {
    const top =
        ((contentRect.top - compRect.top) / compRect.height) * 100 +
        ((1 - scaleY) / 2) * 100;
    const left =
        ((contentRect.left - compRect.left) / compRect.width) * 100 +
        ((1 - scaleX) / 2) * 100;
    const right =
        (contentRect.width / compRect.width) * 100 + left - (1 - scaleX) * 100;
    const bottom =
        (contentRect.height / compRect.height) * 100 + top - (1 - scaleY) * 100;
    const centerX = (right + left) / 2;
    const centerY = (bottom + top) / 2;

    return CLIP_PARAMS[direction](top, bottom, left, right, minimum, centerX, centerY);
}

export function getAdjustedDirection (paramsMap, direction, angleInDeg) {
    const directions = Object.keys(paramsMap);
    const index = paramsMap[direction].idx;
    const shiftBy = Math.round(angleInDeg / 90);
    const newIndex =
        (index + (directions.length - 1) * shiftBy) % directions.length;
    return directions[newIndex];
}
