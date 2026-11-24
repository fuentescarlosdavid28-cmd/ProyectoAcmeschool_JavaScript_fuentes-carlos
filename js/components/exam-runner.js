import { escapeHtml } from '../utils/escape.js';
import { updateAnswers } from '../services/progress.js';
import './exam-timer.js';

class ExamRunner extends HTMLElement {
  connectedCallback() {
    const { exam, estudiante } = this;
    this.finished = false;

    const questions = exam.preguntas.map(p => `
      <li class="exam-question">
        <fieldset>
          <legend>${escapeHtml(p.texto)}</legend>
          ${p.respuestas.map(r => `
            <label class="option">
              <input type="radio" name="p${p.id}" value="${r.id}">
              <span>${escapeHtml(r.descripcion)}</span>
            </label>
          `).join('')}
        </fieldset>
      </li>
    `).join('');

    this.innerHTML = `
      <section class="view exam">
        <header class="exam-header">
          <div>
            <h1>${escapeHtml(exam.titulo)}</h1>
            <p class="muted">${escapeHtml(estudiante.nombre)} · ${escapeHtml(estudiante.identificacion)}</p>
          </div>
          <div class="exam-meta">
            <span class="chip">${exam.preguntas.length} preguntas</span>
            <span class="chip">Aprobacion: ${exam.porcentaje}%</span>
            <exam-timer end="${this.endTime}"></exam-timer>
          </div>
        </header>
        <form novalidate>
          <ol class="exam-questions">${questions}</ol>
          <button type="submit" class="btn btn-finish">Terminar</button>
        </form>
      </section>
    `;

    this.form = this.querySelector('form');
    this.restoreAnswers(this.respuestas || []);
    this.form.addEventListener('submit', e => this.onSubmit(e));
    this.form.addEventListener('change', () => updateAnswers(this.getAnswers()));
    this.addEventListener('time-up', () => this.finish(true));
  }

  restoreAnswers(respuestas) {
    respuestas.forEach(({ preguntaId, respuestaId }) => {
      const input = this.form.querySelector(`input[name="p${preguntaId}"][value="${respuestaId}"]`);
      if (input) input.checked = true;
    });
  }

  getAnswers() {
    return this.exam.preguntas.map(p => ({
      preguntaId: p.id,
      respuestaId: Number(this.form.elements[`p${p.id}`].value) || null
    }));
  }

  onSubmit(event) {
    event.preventDefault();
    const pending = this.getAnswers().filter(a => a.respuestaId === null).length;
    if (pending && !confirm(`Te faltan ${pending} preguntas por responder. ¿Quieres terminar de todas formas?`)) return;
    this.finish(false);
  }

  finish(porTiempo) {
    if (this.finished) return;
    this.finished = true;

    const respuestas = this.getAnswers();
    this.querySelector('exam-timer').stop();
    this.form.querySelectorAll('input, button').forEach(el => { el.disabled = true; });

    this.dispatchEvent(new CustomEvent('exam-finished', {
      bubbles: true,
      detail: { respuestas, porTiempo }
    }));
  }
}

customElements.define('exam-runner', ExamRunner);
