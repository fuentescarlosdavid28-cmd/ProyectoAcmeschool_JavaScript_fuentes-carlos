const KEY = 'acme_examen_en_curso';

export function getProgress() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function saveProgress(progress) {
  sessionStorage.setItem(KEY, JSON.stringify(progress));
}

export function updateAnswers(respuestas) {
  const progress = getProgress();
  if (progress) saveProgress({ ...progress, respuestas });
}

export function clearProgress() {
  sessionStorage.removeItem(KEY);
}
