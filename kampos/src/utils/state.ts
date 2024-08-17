const STATE_KEY = 's';
const QUERY_CHANGE_KEY = 'queryChange';
const queryChangeEvent = new Event(QUERY_CHANGE_KEY);

let cachedQueryValue: any = null;

export function getQueryValue() {
  if (cachedQueryValue !== null) {
    return cachedQueryValue;
  }

  const value = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
  if (Object.keys(value).length === 0) {
    return null;
  }
  cachedQueryValue = value;
  return value;
}

export function onStateChange(callback: (query: any, currentState: any) => void) {
  window.addEventListener(QUERY_CHANGE_KEY, () => {
    cachedQueryValue = null; // Invalidate cache
    callback(getQueryValue(), getQueryValue());
  });
}

export function setState(value?: any) {
  if (!value) {
    localStorage.removeItem(STATE_KEY);
    cachedQueryValue = null;
  } else {
    localStorage.setItem(STATE_KEY, JSON.stringify(value));
    cachedQueryValue = value;
  }
    window.dispatchEvent(queryChangeEvent);
}
