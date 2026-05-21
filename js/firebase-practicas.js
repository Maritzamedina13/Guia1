// ── Firebase Prácticas Profesionales ITM ───────────────────────────────────
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyAsjH3q5_WhaKYcqTRwDRktY9cShfv3X_g",
  authDomain:        "gifted-dreamer-402613.firebaseapp.com",
  projectId:         "gifted-dreamer-402613",
  storageBucket:     "gifted-dreamer-402613.firebasestorage.app",
  messagingSenderId: "397197163762",
  appId:             "1:397197163762:web:da2db1c38954db19da246b"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Recolectar todos los valores del formulario ───────────────────────────
export function recolectarFormulario() {
  const datos = {};

  // Inputs de texto, date, selects, textareas con ID
  document.querySelectorAll('input[id]:not([type="radio"]):not([type="checkbox"]), select[id], textarea[id]')
    .forEach(el => { datos[el.id] = el.value; });

  // Checkboxes con ID
  document.querySelectorAll('input[type="checkbox"][id]')
    .forEach(el => { datos[el.id] = el.checked; });

  // Radio buttons — guardar el valor seleccionado por grupo (name)
  const radiosVistos = new Set();
  document.querySelectorAll('input[type="radio"]').forEach(el => {
    if (!el.name || radiosVistos.has(el.name)) return;
    radiosVistos.add(el.name);
    const sel = document.querySelector(`input[type="radio"][name="${el.name}"]:checked`);
    datos['radio__' + el.name] = sel ? (sel.value || sel.id) : '';
  });

  // Checkboxes SIN ID — guardar por posición con label
  document.querySelectorAll('input[type="checkbox"]:not([id])').forEach((el, i) => {
    const label = el.closest('label, td')?.textContent?.trim().slice(0, 60) || `chk_${i}`;
    datos['chk__' + i + '__' + label.replace(/\s+/g,'_')] = el.checked;
  });

  datos['_timestamp'] = new Date().toISOString();
  return datos;
}

// ── Restaurar formulario con datos guardados ──────────────────────────────
export function restaurarFormulario(datos) {
  Object.entries(datos).forEach(([key, val]) => {
    if (key.startsWith('_')) return;

    if (key.startsWith('radio__')) {
      const name = key.replace('radio__', '');
      if (!val) return;
      const el = document.querySelector(`input[type="radio"][name="${name}"][id="${val}"]`)
              || document.querySelector(`input[type="radio"][name="${name}"][value="${val}"]`);
      if (el) el.checked = true;
      return;
    }

    if (key.startsWith('chk__')) return; // difícil restaurar sin ID

    const el = document.getElementById(key);
    if (!el) return;

    if (el.type === 'checkbox') {
      el.checked = !!val;
    } else {
      el.value = val;
      el.dispatchEvent(new Event('change'));
      el.dispatchEvent(new Event('input'));
    }
  });
}

// ── Guardar guía en Firestore ─────────────────────────────────────────────
export async function guardarGuia(coleccion) {
  const cedula = document.getElementById('inp-cedula')?.value?.trim();
  if (!cedula) {
    mostrarMensaje('⚠️ Ingrese el número de cédula antes de guardar.', 'warn');
    return;
  }

  mostrarMensaje('⏳ Guardando…', 'info');
  try {
    const datos = recolectarFormulario();
    datos.cedula = cedula;
    datos.coleccion = coleccion;
    datos.guardadoEn = new Date().toLocaleString('es-CO');

    await setDoc(doc(db, coleccion, cedula), datos, { merge: true });
    mostrarMensaje('✅ Datos guardados correctamente.', 'ok');
  } catch (e) {
    mostrarMensaje('❌ Error al guardar: ' + e.message, 'error');
    console.error(e);
  }
}

// ── Cargar guía desde Firestore por cédula ────────────────────────────────
export async function cargarGuia(coleccion) {
  const cedula = document.getElementById('buscar-cedula')?.value?.trim();
  if (!cedula) {
    mostrarMensaje('⚠️ Ingrese la cédula para buscar.', 'warn');
    return;
  }

  mostrarMensaje('⏳ Buscando…', 'info');
  try {
    const snap = await getDoc(doc(db, coleccion, cedula));
    if (!snap.exists()) {
      mostrarMensaje('ℹ️ No se encontraron datos para la cédula: ' + cedula, 'warn');
      return;
    }
    restaurarFormulario(snap.data());
    mostrarMensaje('✅ Datos cargados — Cédula: ' + cedula
      + (snap.data().guardadoEn ? ' · Guardado: ' + snap.data().guardadoEn : ''), 'ok');
  } catch (e) {
    mostrarMensaje('❌ Error al cargar: ' + e.message, 'error');
    console.error(e);
  }
}

// ── Mensaje de estado ─────────────────────────────────────────────────────
function mostrarMensaje(texto, tipo) {
  const el = document.getElementById('fb-msg');
  if (!el) return;
  const colores = {
    ok:    { bg: '#E8F5E9', color: '#1B5E20', border: '#1B5E20' },
    warn:  { bg: '#FFF3E0', color: '#E65100', border: '#E65100' },
    error: { bg: '#FFEBEE', color: '#B71C1C', border: '#B71C1C' },
    info:  { bg: '#E3F2FD', color: '#1565C0', border: '#1565C0' },
  };
  const c = colores[tipo] || colores.info;
  el.textContent = texto;
  el.style.cssText = `display:block;padding:6px 12px;margin:4px 0;border-radius:4px;font-size:8.5pt;
    font-weight:bold;border:1.5px solid ${c.border};background:${c.bg};color:${c.color};`;
}
