class ExamTimer extends HTMLElement {
  connectedCallback() {
    const end = Number(this.getAttribute('end'));
    const minutes = Number(this.getAttribute('minutes')) || 0;
    this.endTime = end || Date.now() + minutes * 60 * 1000;
    this.className = 'timer';
    this.setAttribute('role', 'timer');
    this.render();
    this.interval = setInterval(() => this.tick(), 500);
  }

  disconnectedCallback() {
    this.stop();
  }

  stop() {
    clearInterval(this.interval);
  }

  render() {
    const remaining = Math.max(0, this.endTime - Date.now());
    const totalSeconds = Math.ceil(remaining / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');

    this.textContent = `${mm}:${ss}`;
    this.setAttribute('aria-label', `Tiempo restante ${mm} minutos ${ss} segundos`);
    this.classList.toggle('timer-warning', totalSeconds <= 60);
    return remaining;
  }

  tick() {
    if (this.render() === 0) {
      this.stop();
      this.dispatchEvent(new CustomEvent('time-up', { bubbles: true }));
    }
  }
}

customElements.define('exam-timer', ExamTimer);
