import { getAll, onChange } from '../services/storage.js';
import { escapeHtml } from '../utils/escape.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' });

class ResultsView extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="view">
        <h1>Resultados</h1>
        <p class="muted">Notas de los examenes presentados por los estudiantes.</p>
        <div class="filters">
          <label>Examen <select name="examen"></select></label>
          <label>Estudiante <input type="search" name="buscar" placeholder="Nombre o identificacion"></label>
        </div>
        <p class="summary muted" aria-live="polite"></p>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estudiante</th>
                <th>Examen</th>
                <th>Aciertos</th>
                <th>Nota</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </section>
    `;

    this.select = this.querySelector('select');
    this.search = this.querySelector('input');
    this.select.addEventListener('change', () => this.renderTable());
    this.search.addEventListener('input', () => this.renderTable());
    this.stopWatching = onChange('resultados', () => this.render());
    this.render();
  }

  disconnectedCallback() {
    this.stopWatching?.();
  }

  render() {
    this.renderOptions();
    this.renderTable();
  }

  // las opciones salen de los resultados, asi aparecen tambien examenes ya eliminados
  renderOptions() {
    const current = this.select.value;
    const exams = new Map();
    getAll('resultados').forEach(r => exams.set(String(r.examenId), r.examenTitulo));

    this.select.innerHTML = '<option value="">Todos</option>' + [...exams]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, titulo]) => `<option value="${id}">${escapeHtml(titulo)}</option>`)
      .join('');

    if (exams.has(current)) this.select.value = current;
  }

  filtered() {
    const examId = this.select.value;
    const text = this.search.value.trim().toLowerCase();

    return getAll('resultados')
      .filter(r => !examId || String(r.examenId) === examId)
      .filter(r => !text
        || r.estudiante.nombre.toLowerCase().includes(text)
        || r.estudiante.identificacion.includes(text))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  renderTable() {
    const results = this.filtered();
    const tbody = this.querySelector('tbody');
    const summary = this.querySelector('.summary');

    if (!results.length) {
      summary.textContent = '';
      tbody.innerHTML = `<tr><td colspan="6" class="muted">${
        getAll('resultados').length ? 'Ningun resultado coincide con el filtro.' : 'Todavia nadie ha presentado un examen.'
      }</td></tr>`;
      return;
    }

    const aprobados = results.filter(r => r.aprobado).length;
    const promedio = Math.round(results.reduce((sum, r) => sum + r.porcentaje, 0) / results.length);
    summary.textContent = `${results.length} presentados · ${aprobados} aprobados · ${results.length - aprobados} reprobados · promedio ${promedio}%`;

    tbody.innerHTML = results.map(r => `
      <tr>
        <td>${dateFormat.format(new Date(r.fecha))}</td>
        <td>${escapeHtml(r.estudiante.nombre)}<br><span class="muted">${escapeHtml(r.estudiante.identificacion)}</span></td>
        <td>${escapeHtml(r.examenTitulo)}</td>
        <td>${r.correctas} / ${r.total}</td>
        <td>${r.porcentaje}%</td>
        <td>
          <span class="${r.aprobado ? 'status-ok' : 'status-fail'}">${r.aprobado ? 'Aprobado' : 'Reprobado'}</span>
          ${r.porTiempo ? '<br><span class="muted">Se acabo el tiempo</span>' : ''}
        </td>
      </tr>
    `).join('');
  }
}

customElements.define('results-view', ResultsView);
