import { getAll, saveAll, nextId, onChange } from '../services/storage.js';
import { escapeHtml } from '../utils/escape.js';

const TOTAL_RESPUESTAS = 2;

class ExamQuestions extends HTMLElement {
  connectedCallback() {
    this.examId = Number(this.getAttribute('exam-id'));
    const exam = this.getExam();
    if (!exam) return;

    const answerRows = Array.from({ length: TOTAL_RESPUESTAS }, (_, i) => `
      <div class="answer-row">
        <input type="radio" name="correcta" value="${i}" aria-label="Marcar respuesta ${i + 1} como correcta">
        <input name="respuesta${i}" placeholder="Respuesta ${i + 1}" aria-label="Respuesta ${i + 1}" required>
      </div>
    `).join('');

    this.innerHTML = `
      <section class="questions card">
        <div class="questions-header">
          <h2 class="form-title">Preguntas de: ${escapeHtml(exam.titulo)}</h2>
          <button type="button" class="btn btn-secondary btn-small" data-close>Cerrar</button>
        </div>
        <ol class="question-list"></ol>
        <form class="form" novalidate>
          <h3 class="form-subtitle">Nueva pregunta</h3>
          <input type="hidden" name="id">
          <label>Pregunta <textarea name="texto" rows="2" required></textarea></label>
          <fieldset class="answers">
            <legend>Respuestas (marca la correcta)</legend>
            ${answerRows}
          </fieldset>
          <p class="error" role="alert" hidden></p>
          <div class="actions">
            <button type="submit" class="btn">Guardar pregunta</button>
            <button type="button" class="btn btn-secondary" data-cancel hidden>Cancelar</button>
          </div>
        </form>
      </section>
    `;

    this.form = this.querySelector('form');
    this.form.addEventListener('submit', e => this.onSubmit(e));
    this.querySelector('[data-cancel]').addEventListener('click', () => this.resetForm());
    this.querySelector('[data-close]').addEventListener('click', () => this.remove());
    this.querySelector('.question-list').addEventListener('click', e => this.onListClick(e));
    this.stopWatching = onChange('examenes', () => {
      if (this.getExam()) this.renderList();
      else this.remove();
    });
    this.renderList();
  }

  disconnectedCallback() {
    this.stopWatching?.();
  }

  getExam() {
    return getAll('examenes').find(ex => ex.id === this.examId);
  }

  getQuestions() {
    return this.getExam()?.preguntas || [];
  }

  saveQuestions(preguntas) {
    saveAll('examenes', getAll('examenes').map(ex => (ex.id === this.examId ? { ...ex, preguntas } : ex)));
    this.dispatchEvent(new CustomEvent('questions-changed', { bubbles: true }));
  }

  renderList() {
    const preguntas = this.getQuestions();
    const list = this.querySelector('.question-list');

    if (!preguntas.length) {
      list.innerHTML = '<li class="muted empty">Este examen aun no tiene preguntas.</li>';
      return;
    }

    list.innerHTML = preguntas.map(p => `
      <li class="question-item">
        <p class="question-text">${escapeHtml(p.texto)}</p>
        <ul class="answer-list">
          ${p.respuestas.map(r => `
            <li class="${r.correcta ? 'correct' : ''}">
              ${escapeHtml(r.descripcion)}
              ${r.correcta ? '<span class="badge">Correcta</span>' : ''}
            </li>
          `).join('')}
        </ul>
        <div class="row-actions">
          <button type="button" class="btn btn-small" data-edit="${p.id}">Editar</button>
          <button type="button" class="btn btn-small btn-danger" data-delete="${p.id}">Eliminar</button>
        </div>
      </li>
    `).join('');
  }

  onListClick(event) {
    const { edit, delete: remove } = event.target.dataset;
    if (edit) this.fillForm(Number(edit));
    if (remove) this.deleteQuestion(Number(remove));
  }

  fillForm(id) {
    const pregunta = this.getQuestions().find(p => p.id === id);
    if (!pregunta) return;

    const { elements } = this.form;
    elements.id.value = pregunta.id;
    elements.texto.value = pregunta.texto;
    pregunta.respuestas.forEach((r, i) => { elements[`respuesta${i}`].value = r.descripcion; });
    elements.correcta.value = String(pregunta.respuestas.findIndex(r => r.correcta));

    this.querySelector('.form-subtitle').textContent = 'Editar pregunta';
    this.querySelector('[data-cancel]').hidden = false;
    this.hideError();
    elements.texto.focus();
  }

  resetForm() {
    this.form.reset();
    this.form.elements.id.value = '';
    this.querySelector('.form-subtitle').textContent = 'Nueva pregunta';
    this.querySelector('[data-cancel]').hidden = true;
    this.hideError();
  }

  onSubmit(event) {
    event.preventDefault();
    const { elements } = this.form;
    const texto = elements.texto.value.trim();
    const correcta = elements.correcta.value;
    const descripciones = Array.from({ length: TOTAL_RESPUESTAS }, (_, i) => elements[`respuesta${i}`].value.trim());

    if (!texto || descripciones.some(d => !d)) {
      this.showError('Escribe la pregunta y sus dos respuestas.');
      return;
    }
    if (correcta === '') {
      this.showError('Marca cual es la respuesta correcta.');
      return;
    }

    const respuestas = descripciones.map((descripcion, i) => ({
      id: i + 1,
      descripcion,
      correcta: String(i) === correcta
    }));

    const preguntas = this.getQuestions();
    const id = Number(elements.id.value);

    if (id) {
      this.saveQuestions(preguntas.map(p => (p.id === id ? { ...p, texto, respuestas } : p)));
    } else {
      this.saveQuestions([...preguntas, { id: nextId(preguntas), texto, respuestas }]);
    }

    this.resetForm();
    this.renderList();
    this.form.elements.texto.focus();
  }

  deleteQuestion(id) {
    if (!confirm('¿Seguro que quieres eliminar esta pregunta?')) return;

    this.saveQuestions(this.getQuestions().filter(p => p.id !== id));
    if (Number(this.form.elements.id.value) === id) this.resetForm();
    this.renderList();
  }

  showError(message) {
    const error = this.querySelector('.error');
    error.textContent = message;
    error.hidden = false;
  }

  hideError() {
    this.querySelector('.error').hidden = true;
  }
}

customElements.define('exam-questions', ExamQuestions);
