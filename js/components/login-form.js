import { login } from '../services/auth.js';

class LoginForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="view login">
        <h1>Ingresar</h1>
        <p class="muted">Accede con tu correo y contraseña.</p>
        <form class="form" novalidate>
          <label>
            Correo
            <input type="email" name="email" autocomplete="username" required>
          </label>
          <label>
            Contraseña
            <input type="password" name="password" autocomplete="current-password" required>
          </label>
          <p class="error" role="alert" hidden></p>
          <button type="submit" class="btn">Ingresar</button>
        </form>
      </section>
    `;
    this.querySelector('form').addEventListener('submit', e => this.onSubmit(e));
  }

  onSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      this.showError('Completa el correo y la contraseña.');
      return;
    }

    if (!login(email, password)) {
      this.showError('Correo o contraseña incorrectos.');
      return;
    }

    location.hash = '#/usuarios';
  }

  showError(message) {
    const error = this.querySelector('.error');
    error.textContent = message;
    error.hidden = false;
  }
}

customElements.define('login-form', LoginForm);
