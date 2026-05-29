// dashboard.js — Lógica principal del panel

import { requireAuth, getSession, logout } from '../js/auth.js';
import {
  getPatients, addPatient, getPatientById,
  updatePatientAnthro, deletePatient, calcIMC, formatDate
} from '../js/patients.js';
import {
  getConsultationsByPatient, addConsultation,
  deleteConsultationsByPatient, formatConsultDatetime
} from '../js/consultations.js';
import { showToast } from '../js/toast.js';

// ─── GUARD ───────────────────────────────────────────────────────────────────
requireAuth();

// ─── STATE ───────────────────────────────────────────────────────────────────
const session = getSession();
let selectedPatientId = null;

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const nutriName      = document.getElementById('nutri-name');
const btnLogout      = document.getElementById('btn-logout');
const patientList    = document.getElementById('patient-list');
const patientSearch  = document.getElementById('patient-search');

// Stats
const statPatients   = document.getElementById('stat-patients');
const statConsults   = document.getElementById('stat-consults');
const statToday      = document.getElementById('stat-today');

// Panel detalle
const detailPanel    = document.getElementById('detail-panel');
const welcomePanel   = document.getElementById('welcome-panel');
const detailName     = document.getElementById('detail-name');
const detailAge      = document.getElementById('detail-age');
const detailBirth    = document.getElementById('detail-birth');
const detailWeight   = document.getElementById('detail-weight');
const detailHeight   = document.getElementById('detail-height');
const detailIMC      = document.getElementById('detail-imc');
const detailDiag     = document.getElementById('detail-diag');
const consultHistory = document.getElementById('consult-history');

// Modal paciente
const modalPatient   = document.getElementById('modal-patient');
const formPatient    = document.getElementById('form-patient');
const modalPatTitle  = document.getElementById('modal-pat-title');
const btnNewPatient  = document.getElementById('btn-new-patient');
const btnClosePatMod = document.getElementById('btn-close-pat-modal');
const imcPreview     = document.getElementById('imc-preview');
const imcValue       = document.getElementById('imc-value');
const imcDiag        = document.getElementById('imc-diag');

// Modal consulta
const modalConsult   = document.getElementById('modal-consult');
const formConsult    = document.getElementById('form-consult');
const btnNewConsult  = document.getElementById('btn-new-consult');
const btnCloseConMod = document.getElementById('btn-close-con-modal');
const consultPatName = document.getElementById('consult-pat-name');

// Campos formulario paciente
const inpName        = document.getElementById('inp-name');
const inpBirth       = document.getElementById('inp-birth');
const inpAge         = document.getElementById('inp-age');
const inpWeight      = document.getElementById('inp-weight');
const inpHeight      = document.getElementById('inp-height');

// Campos formulario consulta
const inpDate        = document.getElementById('inp-date');
const inpTime        = document.getElementById('inp-time');
const inpEvolution   = document.getElementById('inp-evolution');
const inpMealPlan    = document.getElementById('inp-meal-plan');

// ─── INIT ─────────────────────────────────────────────────────────────────────
nutriName.textContent = session.nutriologist;
const avatarEl = document.getElementById('topbar-avatar');
if (avatarEl) avatarEl.textContent = session.nutriologist.charAt(0).toUpperCase();
renderPatientList();
updateStats();

// ─── STATS ───────────────────────────────────────────────────────────────────
function updateStats() {
  const { getAllConsultations } = window.__consults || {};
  const patients = getPatients();
  const { getAllConsultations: gc } = window.__gc || {};

  // Importamos dinámicamente para stats
  const raw = localStorage.getItem('nutrix_consultations');
  const allConsults = raw ? JSON.parse(raw) : [];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = allConsults.filter(c => c.date === todayStr).length;

  statPatients.textContent = patients.length;
  statConsults.textContent = allConsults.length;
  statToday.textContent    = todayCount;
}

// ─── PATIENT LIST ─────────────────────────────────────────────────────────────
function renderPatientList(filter = '') {
  const patients = getPatients();
  const filtered = filter
    ? patients.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
    : patients;

  if (filtered.length === 0) {
    patientList.innerHTML = `
      <div class="empty-state">
        <div class="icon">🌿</div>
        <p>${filter ? 'Sin resultados para "' + filter + '"' : 'Aún no hay pacientes registrados'}</p>
      </div>`;
    return;
  }

  patientList.innerHTML = filtered.map(p => `
    <div class="patient-item ${p.id === selectedPatientId ? 'active' : ''}"
         data-id="${p.id}" role="button" tabindex="0">
      <div class="patient-avatar">${p.name.charAt(0).toUpperCase()}</div>
      <div class="patient-info">
        <span class="patient-name">${p.name}</span>
        <span class="patient-meta">${p.age} años · IMC ${p.imc}</span>
      </div>
      <span class="badge ${p.badgeClass}">${p.diagnosis}</span>
    </div>
  `).join('');

  patientList.querySelectorAll('.patient-item').forEach(el => {
    el.addEventListener('click', () => selectPatient(el.dataset.id));
    el.addEventListener('keydown', e => { if (e.key === 'Enter') selectPatient(el.dataset.id); });
  });
}

// ─── SELECT PATIENT ───────────────────────────────────────────────────────────
function selectPatient(id) {
  selectedPatientId = id;
  const p = getPatientById(id);
  if (!p) return;

  welcomePanel.classList.add('hidden');
  detailPanel.classList.remove('hidden');

  detailName.textContent   = p.name;
  detailAge.textContent    = `${p.age} años`;
  detailBirth.textContent  = formatDate(p.birthdate);
  detailWeight.textContent = `${p.weight} kg`;
  detailHeight.textContent = `${p.height} cm`;
  detailIMC.textContent    = p.imc;
  detailDiag.className     = `badge ${p.badgeClass}`;
  detailDiag.textContent   = p.diagnosis;

  renderConsultHistory(id);
  renderPatientList(patientSearch.value);
  updateStats();
}

// ─── CONSULTATION HISTORY ─────────────────────────────────────────────────────
function renderConsultHistory(patientId) {
  const consults = getConsultationsByPatient(patientId);

  if (consults.length === 0) {
    consultHistory.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        <p>Sin consultas registradas aún</p>
      </div>`;
    return;
  }

  consultHistory.innerHTML = consults.map((c, i) => `
    <div class="consult-card ${i === 0 ? 'latest' : ''}">
      <div class="consult-header">
        <div>
          <span class="consult-date">${formatConsultDatetime(c.date, c.time)}</span>
          ${i === 0 ? '<span class="consult-badge-latest">Más reciente</span>' : ''}
        </div>
        <span class="consult-nutri">Dr(a). ${c.nutriologist}</span>
      </div>
      <div class="consult-body">
        <div class="consult-section">
          <h4>📈 Evolución</h4>
          <p>${escapeHtml(c.evolution)}</p>
        </div>
        <div class="consult-section">
          <h4>🥗 Plan de alimentación</h4>
          <p>${escapeHtml(c.mealPlan)}</p>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\n/g,'<br>');
}

// ─── NEW PATIENT MODAL ────────────────────────────────────────────────────────
btnNewPatient.addEventListener('click', () => {
  modalPatTitle.textContent = 'Nuevo Paciente';
  formPatient.reset();
  imcPreview.classList.add('hidden');
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  modalPatient.classList.remove('hidden');
});

btnClosePatMod.addEventListener('click', () => modalPatient.classList.add('hidden'));
modalPatient.addEventListener('click', e => { if (e.target === modalPatient) modalPatient.classList.add('hidden'); });

// IMC en tiempo real
[inpWeight, inpHeight].forEach(el => {
  el.addEventListener('input', previewIMC);
});

function previewIMC() {
  const w = parseFloat(inpWeight.value);
  const h = parseFloat(inpHeight.value);
  if (w > 0 && h > 0) {
    const { imc, diagnosis, badgeClass } = calcIMC(w, h);
    imcValue.textContent = imc;
    imcDiag.textContent  = diagnosis;
    imcDiag.className    = `badge ${badgeClass}`;
    imcPreview.classList.remove('hidden');
  } else {
    imcPreview.classList.add('hidden');
  }
}

// Auto-calcular edad desde fecha de nacimiento
inpBirth.addEventListener('change', () => {
  const birth = new Date(inpBirth.value);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age >= 0 && age < 150) inpAge.value = age;
});

formPatient.addEventListener('submit', e => {
  e.preventDefault();
  const result = addPatient({
    name:      inpName.value,
    birthdate: inpBirth.value,
    age:       inpAge.value,
    weight:    inpWeight.value,
    height:    inpHeight.value,
  });

  if (!result.success) {
    showToast(result.message, 'error');
    return;
  }

  showToast(result.message);
  modalPatient.classList.add('hidden');
  renderPatientList(patientSearch.value);
  updateStats();
  selectPatient(result.patient.id);
});

// ─── NEW CONSULTATION MODAL ───────────────────────────────────────────────────
btnNewConsult.addEventListener('click', () => {
  if (!selectedPatientId) return;
  const p = getPatientById(selectedPatientId);
  consultPatName.textContent = p.name;

  // Rellenar fecha y hora actual
  const now = new Date();
  inpDate.value = now.toISOString().split('T')[0];
  inpTime.value = now.toTimeString().slice(0, 5);

  formConsult.reset();
  inpDate.value = now.toISOString().split('T')[0];
  inpTime.value = now.toTimeString().slice(0, 5);

  modalConsult.classList.remove('hidden');
});

btnCloseConMod.addEventListener('click', () => modalConsult.classList.add('hidden'));
modalConsult.addEventListener('click', e => { if (e.target === modalConsult) modalConsult.classList.add('hidden'); });

formConsult.addEventListener('submit', e => {
  e.preventDefault();
  addConsultation({
    patientId:   selectedPatientId,
    nutriologist: session.nutriologist,
    date:        inpDate.value,
    time:        inpTime.value,
    evolution:   inpEvolution.value,
    mealPlan:    inpMealPlan.value,
  });

  showToast('Consulta registrada exitosamente.');
  modalConsult.classList.add('hidden');
  renderConsultHistory(selectedPatientId);
  updateStats();
});

// ─── DELETE PATIENT ───────────────────────────────────────────────────────────
document.getElementById('btn-delete-patient').addEventListener('click', () => {
  if (!selectedPatientId) return;
  const p = getPatientById(selectedPatientId);
  if (!confirm(`¿Eliminar al paciente "${p.name}" y todo su historial? Esta acción no se puede deshacer.`)) return;

  deleteConsultationsByPatient(selectedPatientId);
  deletePatient(selectedPatientId);
  showToast(`Paciente "${p.name}" eliminado.`);

  selectedPatientId = null;
  detailPanel.classList.add('hidden');
  welcomePanel.classList.remove('hidden');
  renderPatientList();
  updateStats();
});

// ─── SEARCH ───────────────────────────────────────────────────────────────────
patientSearch.addEventListener('input', () => renderPatientList(patientSearch.value));

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
btnLogout.addEventListener('click', () => {
  if (confirm('¿Cerrar sesión?')) logout();
});

// ─── CLOCK ───────────────────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
updateClock();
setInterval(updateClock, 1000);