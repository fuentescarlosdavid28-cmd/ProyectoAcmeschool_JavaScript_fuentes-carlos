import { getAll, onChange } from '../services/storage.js';
import { gradeExam, saveResult } from '../services/results.js';
import { getProgress, saveProgress, clearProgress } from '../services/progress.js';
import { escapeHtml } from '../utils/escape.js';
import './exam-runner.js';

class ExamPortal extends HTMLElement {
  connectedCallback() {
    this.stopWatching = onChange('examenes', () => {
      if (this.stage === 'list') this.showList();
    });

    const progress = getProgress();
    const exam = progress && getAll('examenes').find(ex => ex.id === progress.examId);
    if (exam) {
      this.startExam(exam, progress.estudiante, progress);
    } else {
      clearProgress();
      this.showList();
    }
  }

  disconnectedCallback() {
    this.stopWatching?.();
  }

  getAvailableExams() {
    return getAll('examenes').filter(ex => (ex.preguntas || []).length > 0);
  }

  showList() {
    this.stage = 'list';
    const exams = this.getAvailableExams();

    const cards = exams.map(ex => `
      <article class="exam-card">
        <h2>${escapeHtml(ex.titulo)}</h2>
        <p><strong>Tiempo:</strong> ${ex.tiempo} minutos</p>
        <p><strong>Aprobacion:</strong> ${ex.porcentaje}%</p>
        <button type="button" class="btn" data-exam="${ex.id}">Presentar</button>
      </article>
    `).join('');

    this.innerHTML = `
      <section class="view">
        <h1>Presentar examen</h1>
        <p class="muted">Elige el examen que vas a presentar.</p>
        ${exams.length
          ? `<div class="exam-grid">${cards}</div>`
          : '<p class="empty-state">Por ahora no hay examenes disponibles.</p>'}
      </section>
    `;

    this.querySelectorAll('[data-exam]').forEach(btn => {
      btn.addEventListener('click', () => this.showStudentForm(Number(btn.dataset.exam)));
    });
  }

  showStudentForm(examId) {
    const exam = this.getAvailableExams().find(ex => ex.id === examId);
    if (!exam) {
      this.showList();
      return;
    }

    this.stage = 'student';
    this.innerHTML = `
      <section class="view login">
        <h1>${escapeHtml(exam.titulo)}</h1>
        <p class="muted">Antes de empezar, escribe tus datos. Tus respuestas quedaran asociadas a ellos.</p>
        <form class="form" novalidate>
          <label>Numero de identificacion <input name="identificacion" inputmode="numeric" required></label>
          <label>Nombre completo <input name="nombre" required></label>
          <p class="error" role="alert" hidden></p>
          <div class="actions">
            <button type="submit" class="btn">Empezar examen</button>
            <button type="button" class="btn btn-secondary" data-back>Volver</button>
          </div>
        </form>
      </section>
    `;

    const form = this.querySelector('form');
    form.elements.identificacion.focus();
    this.querySelector('[data-back]').addEventListener('click', () => this.showList());
    form.addEventListener('submit', event => {
      event.preventDefault();
      const estudiante = {
        identificacion: form.elements.identificacion.value.trim(),
        nombre: form.elements.nombre.value.trim()
      };

      if (!estudiante.identificacion || !estudiante.nombre) {
        const error = this.querySelector('.error');
        error.textContent = 'Completa tu identificacion y tu nombre.';
        error.hidden = false;
        return;
      }

      this.startExam(exam, estudiante);
    });
  }

  startExam(exam, estudiante, progress = null) {
    this.stage = 'exam';
    const endTime = progress?.endTime ?? Date.now() + exam.tiempo * 60 * 1000;
    const respuestas = progress?.respuestas ?? [];
    saveProgress({ examId: exam.id, estudiante, endTime, respuestas });

    const runner = document.createElement('exam-runner');
    runner.exam = exam;
    runner.estudiante = estudiante;
    runner.endTime = endTime;
    runner.respuestas = respuestas;
    runner.addEventListener('exam-finished', e => this.showResult(exam, estudiante, e.detail));

    this.replaceChildren(runner);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showResult(exam, estudiante, { respuestas, porTiempo }) {
    const nota = gradeExam(exam, respuestas);
    saveResult(exam, estudiante, respuestas, nota, porTiempo);
    clearProgress();

    this.stage = 'result';
    this.innerHTML = `
      <section class="view login result ${nota.aprobado ? 'result-ok' : 'result-fail'}">
        <h1>${escapeHtml(exam.titulo)}</h1>
        <p class="muted">${escapeHtml(estudiante.nombre)} · ${escapeHtml(estudiante.identificacion)}</p>
        ${porTiempo ? '<p class="chip">Se acabo el tiempo</p>' : ''}
        <div class="result-score" aria-label="Porcentaje de aciertos">${nota.porcentaje}%</div>
        <p class="result-message">${nota.aprobado ? '¡Aprobaste el examen!' : 'No aprobaste el examen.'}</p>
        <p>Respuestas correctas: ${nota.correctas} de ${nota.total}</p>
        <p class="muted">Porcentaje para aprobar: ${exam.porcentaje}%</p>
        <button type="button" class="btn" data-back>Volver a los examenes</button>
      </section>
    `;

    this.querySelector('[data-back]').addEventListener('click', () => this.showList());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

customElements.define('exam-portal', ExamPortal);
