const routes = {
  '#/presentar': () => '<section class="view"><h1>Presentar examen</h1><p>Aqui van los examenes disponibles.</p></section>',
  '#/login': () => '<section class="view"><h1>Ingresar</h1><p>Aqui va el login.</p></section>',
  '#/usuarios': () => '<section class="view"><h1>Usuarios</h1><p>Aqui va la gestion de usuarios.</p></section>',
  '#/examenes': () => '<section class="view"><h1>Examenes</h1><p>Aqui va la gestion de examenes.</p></section>'
};

const defaultRoute = '#/presentar';

function render() {
  const hash = routes[location.hash] ? location.hash : defaultRoute;
  if (location.hash !== hash) {
    location.hash = hash;
    return;
  }

  document.getElementById('app').innerHTML = routes[hash]();

  document.querySelectorAll('.menu a').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === hash);
  });
}

window.addEventListener('hashchange', render);
render();
