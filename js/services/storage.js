const PREFIX = 'acme_';

export function getAll(key) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key)) || [];
  } catch {
    return [];
  }
}

export function saveAll(key, items) {
  localStorage.setItem(PREFIX + key, JSON.stringify(items));
}

export function onChange(key, callback) {
  const handler = event => {
    if (event.key === null || event.key === PREFIX + key) callback();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export function nextId(items) {
  return items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;
}
