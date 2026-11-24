import { getAll, saveAll, nextId, onChange } from '../services/storage.js';
import { escapeHtml } from '../utils/escape.js';
import './exam-questions.js';

const FIELDS = ['id', 'codigo', 'titulo', 'tiempo', 'porcentaje', 'descripcion'];

class ExamsView extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="view">
        <h1>Examenes</h1>
        <p class="muted">Crea, edita y elimina los examenes de la plataforma.</p>
        <div class="crud">
          <form class="form card" novalidate>
            <h2 class="form-title">Nuevo examen</h2>
            <input type="hidden" name="id">
            <label>Codigo <input name="codigo" required></label>
            <label>Titulo <input name="titulo" required></label>
            <label>Tiempo (minutos) <input type="number" name="tiempo" min="1" step="1" required></label>
            <label>Porcentaje de aprobacion <input type="number" name="porcentaje" min="1" max="100" step="1" required></label>
            <label>Descripcion <textarea name="descripcion" rows="3" required></textarea></label>
            <p class="error" role="alert" hidden></p>
            <div class="actions">
              <button type="submit" class="btn">Guardar</button>
              <button type="button" class="btn btn-secondary" data-cancel hidden>Cancelar</button>
            </div>
          </form>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Titulo</th>
                  <th>Tiempo</th>
                  <th>Aprobacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
        <div class="questions-slot"></div>
      </section>
    `;

    this.questionsBox = this.querySelector('.questions-slot');
    this.questionsBox.addEventListener('questions-changed', () => this.renderTable());
    this.form = this.querySelector('form');
    this.form.addEventListener('submit', e => this.onSubmit(e));
    this.form.querySelector('[data-cancel]').addEventListener('click', () => this.resetForm());
    this.querySelector('tbody').addEventListener('click', e => this.onTableClick(e));
    this.stopWatching = onChange('examenes', () => this.renderTable());
    this.renderTable();
  }

  disconnectedCallback() {
    this.stopWatching?.();
  }

  renderTable() {
    const exams = getAll('examenes');
    const tbody = this.querySelector('tbody');

    if (!exams.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="muted">No hay examenes registrados.</td></tr>';
      return;
    }

    tbody.innerHTML = exams.map(ex => `
      <tr>
        <td>${escapeHtml(ex.codigo)}</td>
        <td>${escapeHtml(ex.titulo)}</td>
        <td>${ex.tiempo} min</td>
        <td>${ex.porcentaje}%</td>
        <td class="row-actions">
          <button type="button" class="btn btn-small btn-secondary" data-questions="${ex.id}">Preguntas (${(ex.preguntas || []).length})</button>
          <button type="button" class="btn btn-small" data-edit="${ex.id}">Editar</button>
          <button type="button" class="btn btn-small btn-danger" data-delete="${ex.id}">Eliminar</button>
        </td>
      </tr>
    `).join('');
  }

  onTableClick(event) {
    const { edit, delete: remove, questions } = event.target.dataset;
    if (edit) this.fillForm(Number(edit));
    if (remove) this.deleteExam(Number(remove));
    if (questions) this.openQuestions(Number(questions));
  }

  openQuestions(id, scroll = true) {
    this.questionsBox.innerHTML = `<exam-questions exam-id="${id}"></exam-questions>`;
    if (scroll) this.questionsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openQuestionsId() {
    return Number(this.questionsBox.querySelector('exam-questions')?.getAttribute('exam-id'));
  }

  fillForm(id) {
    const exam = getAll('examenes').find(ex => ex.id === id);
    if (!exam) return;

    FIELDS.forEach(key => { this.form.elements[key].value = exam[key]; });
    this.form.querySelector('.form-title').textContent = 'Editar examen';
    this.form.querySelector('[data-cancel]').hidden = false;
    this.hideError();
    this.form.elements.codigo.focus();
  }

  resetForm() {
    this.form.reset();
    this.form.elements.id.value = '';
    this.form.querySelector('.form-title').textContent = 'Nuevo examen';
    this.form.querySelector('[data-cancel]').hidden = true;
    this.hideError();
  }

  readForm() {
    const data = Object.fromEntries(new FormData(this.form));
    FIELDS.forEach(key => { data[key] = data[key].trim(); });
    return data;
  }

  validate(data, exams) {
    const id = Number(data.id);
    const tiempo = Number(data.tiempo);
    const porcentaje = Number(data.porcentaje);

    if (FIELDS.some(key => key !== 'id' && !data[key])) return 'Completa todos los campos.';
    if (!Number.isInteger(tiempo) || tiempo < 1) return 'El tiempo debe ser un numero entero mayor a 0.';
    if (!Number.isInteger(porcentaje) || porcentaje < 1 || porcentaje > 100) return 'El porcentaje debe ser un numero entero entre 1 y 100.';
    if (exams.some(ex => ex.id !== id && ex.codigo.toLowerCase() === data.codigo.toLowerCase())) return 'Ya existe un examen con ese codigo.';
    return '';
  }

  onSubmit(event) {
    event.preventDefault();
    const exams = getAll('examenes');
    const data = this.readForm();
    const error = this.validate(data, exams);

    if (error) {
      this.showError(error);
      return;
    }

    const exam = {
      codigo: data.codigo,
      titulo: data.titulo,
      tiempo: Number(data.tiempo),
      porcentaje: Number(data.porcentaje),
      descripcion: data.descripcion
    };

    if (data.id) {
      const id = Number(data.id);
      saveAll('examenes', exams.map(ex => (ex.id === id ? { ...ex, ...exam } : ex)));
      if (this.openQuestionsId() === id) this.openQuestions(id, false);
    } else {
      saveAll('examenes', [...exams, { id: nextId(exams), ...exam, preguntas: [] }]);
    }

    this.resetForm();
    this.renderTable();
    this.form.elements.codigo.focus();
  }

  deleteExam(id) {
    if (!confirm('¿Seguro que quieres eliminar este examen?')) return;

    saveAll('examenes', getAll('examenes').filter(ex => ex.id !== id));
    if (Number(this.form.elements.id.value) === id) this.resetForm();
    if (this.openQuestionsId() === id) this.questionsBox.innerHTML = '';
    this.renderTable();
  }

  showError(message) {
    const error = this.form.querySelector('.error');
    error.textContent = message;
    error.hidden = false;
  }

  hideError() {
    this.form.querySelector('.error').hidden = true;
  }
}

customElements.define('exams-view', ExamsView);
