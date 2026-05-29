// patients.js — Gestión de pacientes y cálculo de IMC

const PATIENTS_KEY = 'nutrix_patients';

/**
 * Obtiene todos los pacientes del localStorage
 * @returns {Array}
 */
export function getPatients() {
  const raw = localStorage.getItem(PATIENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Guarda el arreglo completo de pacientes
 * @param {Array} patients
 */
function savePatients(patients) {
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
}

/**
 * Calcula el IMC y retorna valor + diagnóstico
 * @param {number} weight — kg
 * @param {number} height — cm
 * @returns {{ imc: number, diagnosis: string, badgeClass: string }}
 */
export function calcIMC(weight, height) {
  const heightM = height / 100;
  const imc = weight / (heightM * heightM);
  const rounded = parseFloat(imc.toFixed(2));

  let diagnosis, badgeClass;
  if (rounded < 18.5) {
    diagnosis = 'Bajo peso';
    badgeClass = 'badge-bajo';
  } else if (rounded < 25) {
    diagnosis = 'Peso normal';
    badgeClass = 'badge-normal';
  } else if (rounded < 30) {
    diagnosis = 'Sobrepeso';
    badgeClass = 'badge-sobre';
  } else {
    diagnosis = 'Obesidad';
    badgeClass = 'badge-obeso';
  }

  return { imc: rounded, diagnosis, badgeClass };
}

/**
 * Agrega un nuevo paciente (sin duplicar por nombre+fecha_nacimiento)
 * @param {{ name, birthdate, weight, height, age }} data
 * @returns {{ success: boolean, message: string, patient?: object }}
 */
export function addPatient(data) {
  const patients = getPatients();

  // Verificar duplicado por nombre + fecha de nacimiento
  const exists = patients.find(
    p => p.name.toLowerCase() === data.name.trim().toLowerCase() &&
         p.birthdate === data.birthdate
  );
  if (exists) {
    return { success: false, message: 'Ya existe un paciente con ese nombre y fecha de nacimiento.' };
  }

  const { imc, diagnosis, badgeClass } = calcIMC(
    parseFloat(data.weight),
    parseFloat(data.height)
  );

  const patient = {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    birthdate: data.birthdate,
    age: parseInt(data.age),
    weight: parseFloat(data.weight),
    height: parseFloat(data.height),
    imc,
    diagnosis,
    badgeClass,
    createdAt: new Date().toISOString(),
  };

  patients.push(patient);
  savePatients(patients);

  return { success: true, message: 'Paciente registrado exitosamente.', patient };
}

/**
 * Retorna un paciente por su ID
 * @param {string} id
 * @returns {object|null}
 */
export function getPatientById(id) {
  return getPatients().find(p => p.id === id) || null;
}

/**
 * Actualiza los datos antropométricos de un paciente
 * @param {string} id
 * @param {{ weight, height, age }} data
 * @returns {object|null} paciente actualizado
 */
export function updatePatientAnthro(id, data) {
  const patients = getPatients();
  const idx = patients.findIndex(p => p.id === id);
  if (idx === -1) return null;

  const { imc, diagnosis, badgeClass } = calcIMC(
    parseFloat(data.weight),
    parseFloat(data.height)
  );

  patients[idx] = {
    ...patients[idx],
    weight: parseFloat(data.weight),
    height: parseFloat(data.height),
    age: parseInt(data.age),
    imc,
    diagnosis,
    badgeClass,
    updatedAt: new Date().toISOString(),
  };

  savePatients(patients);
  return patients[idx];
}

/**
 * Elimina un paciente y sus consultas asociadas
 * @param {string} id
 */
export function deletePatient(id) {
  const patients = getPatients().filter(p => p.id !== id);
  savePatients(patients);
}

/**
 * Formatea fecha de nacimiento a texto legible
 * @param {string} dateStr — YYYY-MM-DD
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}