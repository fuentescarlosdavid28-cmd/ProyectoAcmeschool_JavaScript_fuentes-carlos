import { getAll, saveAll, nextId } from './storage.js';

export function gradeExam(exam, respuestas) {
  const total = exam.preguntas.length;
  const correctas = exam.preguntas.filter(p => {
    const elegida = respuestas.find(r => r.preguntaId === p.id);
    const correcta = p.respuestas.find(r => r.correcta);
    return elegida && correcta && elegida.respuestaId === correcta.id;
  }).length;

  const porcentaje = total ? Math.round((correctas / total) * 100) : 0;
  return { correctas, total, porcentaje, aprobado: porcentaje >= exam.porcentaje };
}

export function saveResult(exam, estudiante, respuestas, nota, porTiempo) {
  const resultados = getAll('resultados');
  const resultado = {
    id: nextId(resultados),
    examenId: exam.id,
    examenTitulo: exam.titulo,
    estudiante,
    respuestas,
    ...nota,
    porTiempo,
    fecha: new Date().toISOString()
  };

  saveAll('resultados', [...resultados, resultado]);
  return resultado;
}
