import { seedAdmin } from './services/seed.js';
import { isAuthenticated, logout } from './services/auth.js';
import { onChange } from './services/storage.js';
import './components/login-form.js';
import './components/users-view.js';
import './components/exams-view.js';
import './components/exam-portal.js';
import './components/results-view.js';

seedAdmin();

const routes = {
  '#/presentar': { view: () => '<exam-portal></exam-portal>' },
  '#/login': { view: () => '<login-form></login-form>', guest: true },
  '#/usuarios': { view: () => '<users-view></users-view>', private: true },
  '#/examenes': { view: () => '<exams-view></exams-view>', private: true },
  '#/resultados': { view: () => '<results-view></results-view>', private: true }
};

const defaultRoute = '#/presentar';

function render() {
  const auth = isAuthenticated();
  let hash = routes[location.hash] ? location.hash : defaultRoute;

  if (routes[hash].private && !auth) hash = '#/login';
  else if (routes[hash].guest && auth) hash = '#/usuarios';

  if (location.hash !== hash) {
    location.hash = hash;
    return;
  }

  document.getElementById('app').innerHTML = routes[hash].view();
  updateMenu(hash, auth);
}

function updateMenu(hash, auth) {
  document.querySelectorAll('[data-private]').forEach(el => { el.hidden = !auth; });
  document.querySelectorAll('[data-guest]').forEach(el => { el.hidden = auth; });
  document.querySelectorAll('.menu a').forEach(link => {
    const active = link.getAttribute('href') === hash;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

// si ya estas en la ruta, vuelve a pintar la vista
document.querySelector('.topbar').addEventListener('click', event => {
  const link = event.target.closest('a[href^="#/"]');
  if (link && link.getAttribute('href') === location.hash) render();
});

document.getElementById('logout').addEventListener('click', () => {
  logout();
  location.hash = '#/login';
});

onChange('sesion', () => {
  const route = routes[location.hash];
  if (route?.private || route?.guest) render();
  else updateMenu(location.hash, isAuthenticated());
});

window.addEventListener('hashchange', render);
render();
