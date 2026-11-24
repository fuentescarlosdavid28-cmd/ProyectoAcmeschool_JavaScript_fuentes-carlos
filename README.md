# ProyectoAcmeschool_JavaScript_fuentes-carlos

Plataforma web para crear y presentar examenes de la escuela Acme. Esta hecha con HTML, CSS y JavaScript puro, usando Web Components y localStorage.

## Funcionalidades

- **Login:** inicio de sesion con correo y contrasena. Es la entrada a los modulos privados.
- **Gestion de usuarios (privado):** tabla, formulario y botones para crear, editar y eliminar usuarios. Datos: numero de identificacion, nombre completo, email, telefono, cargo (Administrativo o Docente) y contrasena.
- **Gestion de examenes (privado):** tabla, formulario y botones para crear, editar y eliminar examenes. Datos: codigo, titulo, tiempo en minutos, porcentaje de aprobacion y descripcion.
  - Cada examen tiene preguntas. Cada pregunta tiene dos respuestas y solo una puede estar marcada como correcta.
- **Resolucion de examenes (publico):**
  1. Lista de examenes disponibles con titulo, tiempo y porcentaje de aprobacion.
  2. El estudiante escribe su numero de identificacion y su nombre completo.
  3. Vista del examen con encabezado (titulo, total de preguntas y porcentaje para aprobar), preguntas numeradas, reloj en cuenta regresiva y boton Terminar.
  4. Al terminar, o cuando el reloj llega a 0, se muestra el porcentaje de aciertos y si aprobo o no.

## Como ejecutarlo

El proyecto usa modulos de JavaScript (`import` / `export`), asi que necesita un servidor local. Si abres el `index.html` con doble clic no funciona.

1. Abre la carpeta del proyecto en VS Code.
2. Instala la extension **Live Server**.
3. Haz clic derecho en `index.html` y elige **Open with Live Server**.

## Usuario inicial

La primera vez que se abre la app, si no hay usuarios guardados, se crea un administrador:

| Correo | Contrasena |
|--------|------------|
| admin@acme.com | admin123 |

> Las contrasenas se guardan en texto plano en localStorage. Esta bien para un proyecto de aprendizaje, pero no es seguro en una aplicacion real.

## Estructura

```
index.html                  pagina principal y menu
css/
  styles.css                colores, estilos y animaciones
js/
  main.js                   rutas por hash y proteccion de vistas privadas
  components/
    login-form.js           <login-form>
    users-view.js           <users-view> crud de usuarios
    exams-view.js           <exams-view> crud de examenes
    exam-questions.js       <exam-questions> preguntas de un examen
    exam-portal.js          <exam-portal> modulo publico
    exam-runner.js          <exam-runner> vista del examen
    exam-timer.js           <exam-timer> reloj del examen
  services/
    storage.js              leer y guardar JSON en localStorage
    seed.js                 crea el admin inicial
    auth.js                 login, logout y sesion
    results.js              calificar y guardar resultados
  utils/
    escape.js               escapa texto antes de mostrarlo en HTML
```

## Rutas

| Ruta | Vista | Acceso |
|------|-------|--------|
| `#/presentar` | Presentar examen | Publico |
| `#/login` | Ingresar | Solo sin sesion |
| `#/usuarios` | Gestion de usuarios | Requiere sesion |
| `#/examenes` | Gestion de examenes | Requiere sesion |

## Datos en localStorage

Todas las claves usan el prefijo `acme_`.

**`acme_usuarios`**

```json
[{
  "id": 1,
  "identificacion": "1000000000",
  "nombre": "Administrador",
  "email": "admin@acme.com",
  "telefono": "3000000000",
  "cargo": "Administrativo",
  "password": "admin123"
}]
```

**`acme_examenes`**

```json
[{
  "id": 1,
  "codigo": "MAT01",
  "titulo": "Matematicas",
  "tiempo": 30,
  "porcentaje": 70,
  "descripcion": "Operaciones basicas",
  "preguntas": [{
    "id": 1,
    "texto": "Cuanto es 2 + 2",
    "respuestas": [
      { "id": 1, "descripcion": "4", "correcta": true },
      { "id": 2, "descripcion": "5", "correcta": false }
    ]
  }]
}]
```

**`acme_resultados`**

```json
[{
  "id": 1,
  "examenId": 1,
  "examenTitulo": "Matematicas",
  "estudiante": { "identificacion": "123456", "nombre": "Ana Perez" },
  "respuestas": [{ "preguntaId": 1, "respuestaId": 1 }],
  "correctas": 1,
  "total": 1,
  "porcentaje": 100,
  "aprobado": true,
  "porTiempo": false,
  "fecha": "2026-11-23T15:00:00.000Z"
}]
```

**`acme_sesion`**

```json
{ "id": 1, "nombre": "Administrador", "email": "admin@acme.com" }
```

## Tecnologias

- HTML5
- CSS3 (variables, grid, flexbox, animaciones y media queries)
- JavaScript (modulos ES y Web Components con `customElements`)
- localStorage
