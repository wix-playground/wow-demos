const CLIP_PARAMS = {
    initial: (top, bottom, left, right) =>  `${left}% ${top}%, ${right}% ${top}%, ${right}% ${bottom}%, ${left}% ${bottom}%`,
    top: (top, bottom, left, right) => `${left}% ${top}%, ${right}% ${top}%, ${right}% ${top}%, ${left}% ${top}%`,
    right: (top, bottom, left, right) => `${right}% ${top}%, ${right}% ${top}%, ${right}% ${bottom}%, ${right}% ${bottom}%`,
    center: (top, bottom, left, right, centerX, centerY) => `${centerX / 2}% ${centerY / 2}%, ${centerX / 2}% ${centerY / 2}%, ${centerX / 2}% ${centerY / 2}%, ${centerX / 2}% ${centerY / 2}%`,
    bottom: (top, bottom, left, right) => `${left}% ${bottom}%, ${right}% ${bottom}%, ${right}% ${bottom}%, ${left}% ${bottom}%`,
    left: (top, bottom, left) => `${left}% ${top}%, ${left}% ${top}%, ${left}% ${bottom}%, ${left}% ${bottom}%`
};

export function getClipPolygonParams (compRect, direction) {
    const top = 0;
    const left = 0;
    const right = 100;
    const bottom = 100;
    const centerX = 50;
    const centerY = 50;

    return CLIP_PARAMS[direction](top, bottom, left, right, centerX, centerY);
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
