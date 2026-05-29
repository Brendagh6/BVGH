// consultations.js — Gestión del historial de consultas

const CONSULTS_KEY = 'nutrix_consultations';

/**
 * Obtiene todas las consultas del localStorage
 * @returns {Array}
 */
export function getAllConsultations() {
  const raw = localStorage.getItem(CONSULTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Guarda el arreglo completo de consultas
 */
function saveConsultations(consultations) {
  localStorage.setItem(CONSULTS_KEY, JSON.stringify(consultations));
}

/**
 * Retorna las consultas de un paciente, ordenadas de más reciente a más antigua
 * @param {string} patientId
 * @returns {Array}
 */
export function getConsultationsByPatient(patientId) {
  return getAllConsultations()
    .filter(c => c.patientId === patientId)
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
}

/**
 * Agrega una nueva consulta
 * @param {{ patientId, nutriologist, evolution, mealPlan, date, time }} data
 * @returns {object} consulta creada
 */
export function addConsultation(data) {
  const consultations = getAllConsultations();

  // Combinar fecha y hora en un datetime ISO
  const datetime = new Date(`${data.date}T${data.time}:00`).toISOString();

  const consultation = {
    id: crypto.randomUUID(),
    patientId: data.patientId,
    nutriologist: data.nutriologist,
    date: data.date,
    time: data.time,
    datetime,
    evolution: data.evolution.trim(),
    mealPlan: data.mealPlan.trim(),
    createdAt: new Date().toISOString(),
  };

  consultations.push(consultation);
  saveConsultations(consultations);

  return consultation;
}

/**
 * Elimina todas las consultas de un paciente (cuando se borra el paciente)
 * @param {string} patientId
 */
export function deleteConsultationsByPatient(patientId) {
  const remaining = getAllConsultations().filter(c => c.patientId !== patientId);
  saveConsultations(remaining);
}

/**
 * Formatea fecha y hora para mostrar en el historial
 * @param {string} dateStr — YYYY-MM-DD
 * @param {string} timeStr — HH:MM
 * @returns {string}
 */
export function formatConsultDatetime(dateStr, timeStr) {
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'
  ];
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} de ${months[parseInt(m)-1]} de ${y} — ${timeStr} hrs`;
}