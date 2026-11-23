import { getAll, saveAll } from './storage.js';

export function seedAdmin() {
  if (getAll('usuarios').length) return;

  saveAll('usuarios', [{
    id: 1,
    identificacion: '1000000000',
    nombre: 'Administrador',
    email: 'admin@acme.com',
    telefono: '3000000000',
    cargo: 'Administrativo',
    password: 'admin123'
  }]);
}
