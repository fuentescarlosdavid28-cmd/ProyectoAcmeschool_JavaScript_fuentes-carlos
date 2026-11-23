import { seedAdmin } from './services/seed.js';
import { isAuthenticated, logout } from './services/auth.js';
import './components/login-form.js';
import './components/users-view.js';

seedAdmin();

const routes = {
  '#/presentar': { view: () => '<section class="view"><h1>Presentar examen</h1><p>Aqui van los examenes disponibles.</p></section>' },
  '#/login': { view: () => '<login-form></login-form>', guest: true },
  '#/usuarios': { view: () => '<users-view></users-view>', private: true },
  '#/examenes': { view: () => '<section class="view"><h1>Examenes</h1><p>Aqui va la gestion de examenes.</p></section>', private: true }
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
    link.classList.toggle('active', link.getAttribute('href') === hash);
  });
}

document.getElementById('logout').addEventListener('click', () => {
  logout();
  location.hash = '#/login';
});

window.addEventListener('hashchange', render);
render();
