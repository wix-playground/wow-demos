const STATE_KEY = 's';
const VERSION_KEY = 'v';
const QUERY_CHANGE_KEY = 'queryChange';
const queryChangeEvent = new Event(QUERY_CHANGE_KEY);

let cachedQueryValue: any = null;

// Use Vite's import.meta.env for versioning
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || import.meta.env.MODE;
console.log('CURRENT_VERSION', CURRENT_VERSION);
function checkAndUpdateVersion() {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  if (storedVersion !== CURRENT_VERSION) {
    localStorage.removeItem(STATE_KEY);
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    return true;
  }
  return false;
}

export function getQueryValue() {
  if (checkAndUpdateVersion()) {
    cachedQueryValue = null;
    return null;
  }

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
