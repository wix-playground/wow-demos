const STATE_KEY = "s";
const QUERY_CHANGE_KEY = "queryChange";
const queryChangeEvent = new Event(QUERY_CHANGE_KEY);

export function getQueryValue() {
    const value = JSON.parse(new URLSearchParams(window.location.search).get(STATE_KEY) || "{}");
    if(Object.keys(value).length === 0) {
        return null;
    }
    return value;
}

export function onStateChange(callback: (query: any, currentState: any) => void) {
    window.addEventListener("popstate", () => {
        callback(getQueryValue(), getQueryValue());
    });

    window.addEventListener(QUERY_CHANGE_KEY, () => {
        callback(getQueryValue(), getQueryValue());
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
