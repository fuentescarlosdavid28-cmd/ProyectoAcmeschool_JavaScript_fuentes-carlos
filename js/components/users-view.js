import { getAll, saveAll, nextId, onChange } from '../services/storage.js';
import { getSession } from '../services/auth.js';
import { escapeHtml } from '../utils/escape.js';

const CARGOS = ['Administrativo', 'Docente'];
const FIELDS = ['id', 'identificacion', 'nombre', 'email', 'telefono', 'cargo', 'password'];

class UsersView extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="view">
        <h1>Usuarios</h1>
        <p class="muted">Crea, edita y elimina los usuarios que pueden ingresar a la plataforma.</p>
        <div class="crud">
          <form class="form card" novalidate>
            <h2 class="form-title">Nuevo usuario</h2>
            <input type="hidden" name="id">
            <label>Numero de identificacion <input name="identificacion" inputmode="numeric" required></label>
            <label>Nombre completo <input name="nombre" required></label>
            <label>Correo <input type="email" name="email" required></label>
            <label>Telefono <input type="tel" name="telefono" required></label>
            <label>
              Cargo
              <select name="cargo" required>
                <option value="">Selecciona...</option>
                ${CARGOS.map(c => `<option>${c}</option>`).join('')}
              </select>
            </label>
            <label>Contrasena <input type="password" name="password" required></label>
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
                  <th>Identificacion</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Telefono</th>
                  <th>Cargo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </section>
    `;

    this.form = this.querySelector('form');
    this.form.addEventListener('submit', e => this.onSubmit(e));
    this.querySelector('[data-cancel]').addEventListener('click', () => this.resetForm());
    this.querySelector('tbody').addEventListener('click', e => this.onTableClick(e));
    this.stopWatching = onChange('usuarios', () => this.renderTable());
    this.renderTable();
  }

  disconnectedCallback() {
    this.stopWatching?.();
  }

  renderTable() {
    const users = getAll('usuarios');
    const tbody = this.querySelector('tbody');

    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No hay usuarios registrados.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${escapeHtml(u.identificacion)}</td>
        <td>${escapeHtml(u.nombre)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.telefono)}</td>
        <td>${escapeHtml(u.cargo)}</td>
        <td class="row-actions">
          <button type="button" class="btn btn-small" data-edit="${u.id}">Editar</button>
          <button type="button" class="btn btn-small btn-danger" data-delete="${u.id}">Eliminar</button>
        </td>
      </tr>
    `).join('');
  }

  onTableClick(event) {
    const { edit, delete: remove } = event.target.dataset;
    if (edit) this.fillForm(Number(edit));
    if (remove) this.deleteUser(Number(remove));
  }

  fillForm(id) {
    const user = getAll('usuarios').find(u => u.id === id);
    if (!user) return;

    FIELDS.forEach(key => { this.form.elements[key].value = user[key]; });
    this.querySelector('.form-title').textContent = 'Editar usuario';
    this.querySelector('[data-cancel]').hidden = false;
    this.hideError();
    this.form.elements.identificacion.focus();
  }

  resetForm() {
    this.form.reset();
    this.form.elements.id.value = '';
    this.querySelector('.form-title').textContent = 'Nuevo usuario';
    this.querySelector('[data-cancel]').hidden = true;
    this.hideError();
  }

  readForm() {
    const data = Object.fromEntries(new FormData(this.form));
    FIELDS.forEach(key => {
      if (key !== 'password') data[key] = data[key].trim();
    });
    return data;
  }

  validate(data, users) {
    const id = Number(data.id);
    const email = data.email.toLowerCase();

    if (FIELDS.some(key => key !== 'id' && !data[key])) return 'Completa todos los campos.';
    if (!/^\S+@\S+\.\S+$/.test(data.email)) return 'Escribe un correo valido.';
    if (users.some(u => u.id !== id && u.email.toLowerCase() === email)) return 'Ya existe un usuario con ese correo.';
    if (users.some(u => u.id !== id && u.identificacion === data.identificacion)) return 'Ya existe un usuario con esa identificacion.';
    return '';
  }

  onSubmit(event) {
    event.preventDefault();
    const users = getAll('usuarios');
    const data = this.readForm();
    const error = this.validate(data, users);

    if (error) {
      this.showError(error);
      return;
    }

    if (data.id) {
      const id = Number(data.id);
      saveAll('usuarios', users.map(u => (u.id === id ? { ...data, id } : u)));
    } else {
      saveAll('usuarios', [...users, { ...data, id: nextId(users) }]);
    }

    this.resetForm();
    this.renderTable();
    this.form.elements.identificacion.focus();
  }

  deleteUser(id) {
    if (getSession()?.id === id) {
      this.showError('No puedes eliminar tu propio usuario mientras tienes la sesion abierta.');
      return;
    }
    if (!confirm('¿Seguro que quieres eliminar este usuario?')) return;

    saveAll('usuarios', getAll('usuarios').filter(u => u.id !== id));
    if (Number(this.form.elements.id.value) === id) this.resetForm();
    this.renderTable();
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

customElements.define('users-view', UsersView);
