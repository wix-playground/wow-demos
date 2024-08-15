const STATE_KEY = "s";
const QUERY_CHANGE_KEY = "queryChange";
const queryChangeEvent = new Event(QUERY_CHANGE_KEY);

export function getQueryValue() {
    return JSON.parse(new URLSearchParams(window.location.search).get(STATE_KEY) || "{}");
}

export function onStateChange(callback: (query: any) => void) {
    window.addEventListener("popstate", () => {
        callback(getQueryValue());
    });

    window.addEventListener(QUERY_CHANGE_KEY, () => {
        callback(getQueryValue());
    });
}

export function setState(value?: any) {
    window.dispatchEvent(queryChangeEvent);

    const query = new URLSearchParams(window.location.search);
    if (!value) {
        query.delete(STATE_KEY);
    } else {
        query.set(STATE_KEY, JSON.stringify(value));
    }
    history.replaceState(null, "", `?${query.toString()}`);
}
