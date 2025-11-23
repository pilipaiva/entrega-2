// ==========================================
//   CARGA DEL JSON SIN IMPORT (USANDO FETCH)
// ==========================================
let data = [];

fetch("./van_gogh_filtrado.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    renderAniosCon(); // ⬅️ SE RENDERIZA SOLO CUANDO EL JSON YA ESTÁ CARGADO
  });

const SVG_NS = "http://www.w3.org/2000/svg";

/* ===================== Datos de contexto ===================== */
const contexto = [
  [1885, "Fallece su padre en marzo. Pinta su primer gran obra, \"Los Comedores de Papas\"."],
  [1886, "Se muda a París con Theo, su hermano. Comienza una educación formal en artes, pero la deja luego de un par de semanas. Conoce a los impresionistas."],
  [1887, "París: influencia japonesa y puntillismo; vistas de Montmartre."],
  [1888, "Se muda a Arlés, a la casa Amarilla, una residencia de artistas. Se enfoca en pintar naturaleza, y en diciembre se cortó la oreja"],
  [1889, "Lo internan en un asilo mental. Sufre de alucinaciones y un estado mental fluctuante."],
  [1890, "Su salud mejora, hasta que cae en picada a mitad de año y se dispara en el pecho. A los dos días muere."]
];
const contextoMap = new Map(contexto);

/* ===================== Utilidades de color ===================== */
function hexToHSL(hex) {
  let r = 0, g = 0, b = 0;
  hex = String(hex).replace('#', '');
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/* ===================== Filtro y parseo de Colors ===================== */
function ColoresAno(ano) {
  const year = Number(ano);
  const filtered = data.filter(item => Number(item.Year) === year);

  const colors = filtered.flatMap(item => {
    if (Array.isArray(item.Colors)) {
      return item.Colors.map(s => String(s).trim());
    }
    return String(item.Colors)
      .replace(/[()]/g, '')
      .split(/\s*,\s*/)
      .map(s => s.replace(/'/g, ''))
      .map(s => s.trim())
      .filter(s => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s));
  });

  return colors;
}

/* ===================== SVG helpers ===================== */
function rect(color, x, y, w = 16.5, h = 33) {
  const r = document.createElementNS(SVG_NS, "rect");
  r.setAttribute("x", x);
  r.setAttribute("y", y);
  r.setAttribute("width", w);
  r.setAttribute("height", h);
  r.setAttribute("fill", color);
  r.setAttribute("shape-rendering", "crispEdges");
  return r;
}

/* ===================== Layout ===================== */
function setupLayout() {
  const salida = document.getElementById('salida');
  if (!salida) return null;

  salida.style.display = 'flex';
  salida.style.gap = '16px';
  salida.style.alignItems = 'flex-start';

  let rowsCol = document.getElementById('rowsCol');
  if (!rowsCol) {
    rowsCol = document.createElement('div');
    rowsCol.id = 'rowsCol';
    rowsCol.style.flex = '1 1 auto';
    rowsCol.style.minWidth = '0';
    salida.appendChild(rowsCol);
  }

  let detail = document.getElementById('detailPanel');
  if (!detail) {
    detail = document.createElement('div');
    detail.id = 'detailPanel';
    detail.style.flex = '0 0 36%';
    detail.style.maxWidth = '600px';
    detail.style.minWidth = '280px';
    detail.style.padding = '8px';
    detail.style.borderRadius = '8px';
    detail.style.background = 'transparent';
    detail.style.display = 'none';
    salida.appendChild(detail);
  }

  return { rowsCol, detail };
}

/* ===================== Panel derecho ===================== */
function buildDetailPanelContent(year, contextoTexto, urls) {
  const box = document.createElement('div');

  const head = document.createElement('div');
  head.textContent = contextoTexto || '';
  head.style.fontSize = '20px';
  head.style.margin = '0 0 8px';
  head.style.lineHeight = '1.35';
  box.appendChild(head);

  const wall = document.createElement('div');
  wall.style.columnWidth = '220px';
  wall.style.columnGap = '8px';
  wall.style.width = '100%';

  if (urls.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No hay imágenes importantes para este año.';
    empty.style.fontSize = '13px';
    wall.appendChild(empty);
  } else {
    urls.forEach(u => {
      const img = document.createElement('img');
      img.src = u;
      img.alt = `Obra ${year}`;
      img.loading = 'lazy';
      img.style.display = 'block';
      img.style.width = '100%';
      img.style.marginBottom = '8px';
      img.style.borderRadius = '6px';
      img.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
      img.style.breakInside = 'avoid';
      wall.appendChild(img);
    });
  }

  box.appendChild(wall);
  return box;
}

/* ===================== Imágenes importantes ===================== */
function getImportantImagesByYear(year) {
  return data
    .filter(d => Number(d.Year) === Number(year) && (d.Show === true || d.Show === "True" || d.Show === "true"))
    .map(d => d.Link)
    .filter(Boolean);
}

/* ===================== Contexto en filas ===================== */
function hideAllContextTexts() {
  document.querySelectorAll('.context-text').forEach(p => {
    const h = Number(p.dataset.h) || p.offsetHeight || 0;
    p.dataset.h = h;
    p.style.height = h + 'px';
    p.style.visibility = 'hidden';
    p.style.pointerEvents = 'none';
  });
}

function showAllContextTexts() {
  document.querySelectorAll('.context-text').forEach(p => {
    p.style.visibility = 'visible';
    p.style.pointerEvents = 'auto';
    p.style.height = 'auto';
  });
}

/* ===================== Focos visuales ===================== */
function applyRowFocus(wrap, on = true) {
  if (on) {
    wrap.style.background = '#e9ebecff';
    wrap.style.transform = 'scale(1.015)';
    wrap.style.transition = 'transform 120ms, background 120ms, box-shadow 120ms';
    wrap.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
  } else {
    wrap.style.background = 'transparent';
    wrap.style.transform = 'scale(1)';
    wrap.style.boxShadow = 'none';
  }
}

/* ===================== Sonidos ===================== */
const ROW_SOUNDS = {
  1885: new Audio('./1885.mp3'),
  1886: new Audio('./1886.mp3'),
  1887: new Audio('./1887.mp3'),
  1888: new Audio('./1888.mp3'),
  1889: new Audio('./1889.mp3'),
  1890: new Audio('./1890.mp3')
};

Object.values(ROW_SOUNDS).forEach(a => a.volume = 0.35);
ROW_SOUNDS[1888].volume = 1.0;

/* ===================== Estado global ===================== */
let activeYear = null;
let activeWrap = null;
let activeSound = null;
let clearTimer = null;

function cancelClearTimer() {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
}

function clearActive() {
  showAllContextTexts();
  const detail = document.getElementById('detailPanel');
  if (detail) {
    detail.innerHTML = '';
    detail.style.background = 'transparent';
    detail.style.display = 'none';
    detail.style.boxShadow = 'none';
  }
  if (activeWrap) applyRowFocus(activeWrap, false);
  if (activeSound) { try { activeSound.pause(); activeSound.currentTime = 0; } catch {} }
  activeYear = activeWrap = activeSound = null;
  cancelClearTimer();
}

function setActiveRow(wrap, year) {
  cancelClearTimer();

  const detail = document.getElementById('detailPanel');
  const contextoTexto = contextoMap.get(Number(year)) || '';
  const sound = ROW_SOUNDS[year];

  if (activeWrap && activeWrap !== wrap) applyRowFocus(activeWrap, false);
  if (activeSound && activeSound !== sound) {
    try { activeSound.pause(); activeSound.currentTime = 0; } catch {}
  }

  applyRowFocus(wrap, true);

  if (sound) {
    try { sound.currentTime = 0; sound.play().catch(()=>{}); } catch {}
  }

  if (detail) {
    detail.innerHTML = '';
    const urls = getImportantImagesByYear(year);
    detail.appendChild(buildDetailPanelContent(year, contextoTexto, urls));
    detail.style.background = '#e9ebecff';
    detail.style.display = 'block';
    detail.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
  }

  hideAllContextTexts();

  activeYear = year;
  activeWrap = wrap;
  activeSound = sound;
}

/* ===================== Crear fila ===================== */
function crearFila(colores, etiqueta, ano) {
  const chipW = 16.5, chipH = 33;
  const totalW = colores.length * chipW;

  const wrap = document.createElement("div");
  wrap.style.margin = "8px";
  wrap.style.display = "flex";
  wrap.style.gap = "10px";
  wrap.style.alignItems = "center";
  wrap.style.padding = "8px";
  wrap.style.overflowX = "auto";

  const titulo = document.createElement("h3");
  titulo.textContent = ano;
  titulo.style.margin = "0 6px 0 0";

  const contextoTexto = contextoMap.get(Number(ano)) || "";

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", totalW);
  svg.setAttribute("height", chipH);
  svg.style.flexShrink = "0";

  let x = 0;
  colores.forEach(c => {
    svg.appendChild(rect(c, x, 0, chipW, chipH));
    x += chipW;
  });

  const texto = document.createElement("p");
  texto.className = "context-text";
  texto.textContent = contextoTexto;
  texto.style.margin = "0";
  texto.style.fontSize = "16px";
  texto.style.color = "#555";

  wrap.appendChild(titulo);
  wrap.appendChild(svg);
  wrap.appendChild(texto);

  requestAnimationFrame(() => {
    texto.dataset.h = texto.offsetHeight;
  });

  wrap.addEventListener('mouseenter', () => setActiveRow(wrap, ano));
  wrap.addEventListener('mouseleave', (e) => {
    const detail = document.getElementById('detailPanel');
    const to = e.relatedTarget;
    if (detail && detail.contains(to)) return;
    if (to && to.closest && to.closest('#rowsCol')) return;

    cancelClearTimer();
    clearTimer = setTimeout(() => {
      const over = document.querySelector(':hover');
      const stillOverRow = over && over.closest && over.closest('#rowsCol');
      const stillOverDetail = over && detail && detail.contains(over);
      if (!stillOverRow && !stillOverDetail) clearActive();
    }, 250);
  });

  return wrap;
}

/* ===================== Guards panel derecho ===================== */
function bindDetailPanelGuards() {
  const detail = document.getElementById('detailPanel');
  if (!detail) return;
  detail.addEventListener('mouseenter', cancelClearTimer);
  detail.addEventListener('mouseleave', () => {
    cancelClearTimer();
    clearTimer = setTimeout(() => {
      const over = document.querySelector(':hover');
      const stillOverRow = over && over.closest && over.closest('#rowsCol');
      const stillOverDetail = over && detail.contains(over);
      if (!stillOverRow && !stillOverDetail) clearActive();
    }, 250);
  });
}

/* ===================== Ordenamientos ===================== */
function ordenarPorColor_RYB(colors) {
  function key(cHex){
    const {h,s,l} = hexToHSL(cHex);
    const hue = (h + 360) % 360;
    let bucket, pos;
    if (hue >= 330 || hue < 60) { bucket = 0; pos = hue < 60 ? hue : hue - 360; pos += 60; }
    else if (hue < 180) { bucket = 1; pos = hue - 60; }
    else { bucket = 2; pos = hue - 180; }
    return [bucket, pos, -s, l];
  }
  return [...colors].sort((a,b)=>{
    const ka = key(a), kb = key(b);
    return (ka[0]-kb[0])||(ka[1]-kb[1])||(ka[2]-kb[2])||(ka[3]-kb[3]);
  });
}

function ordenarPorLuminosidad(colors) {
  return [...colors].sort((a, b) => hexToHSL(a).l - hexToHSL(b).l);
}

function ordenarPorSaturacion(colors) {
  return [...colors].sort((a, b) => hexToHSL(b).s - hexToHSL(a).s);
}

/* ===================== Render ===================== */
function renderAniosCon(ordenador = null) {
  const layout = setupLayout();
  const rowsCol = layout?.rowsCol;
  if (!rowsCol) return;

  rowsCol.innerHTML = '';

  const anios = [1885, 1886, 1887, 1888, 1889, 1890];
  anios.forEach(y => {
    const base = ColoresAno(y);
    const cols = ordenador ? ordenador(base) : base;
    const fila = crearFila(cols, `Año ${y}`, y);
    rowsCol.appendChild(fila);
  });
  showAllContextTexts();

  
  const detail = document.getElementById('detailPanel');
  if (detail) {
    detail.innerHTML = '';
    detail.style.display = 'none';
    detail.style.background = 'transparent';
  }

  bindDetailPanelGuards();
}

/* ===================== Botones ===================== */
const buttons = [
  document.getElementById('btnValor'),
  document.getElementById('btnLum'),
  document.getElementById('btnSat')
];

function setActiveButton(activeBtn) {
  buttons.forEach(btn => {
    if (btn === activeBtn) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

buttons[0]?.addEventListener('click', () => {
  renderAniosCon(ordenarPorColor_RYB);
  setActiveButton(buttons[0]);
});
buttons[1]?.addEventListener('click', () => {
  renderAniosCon(ordenarPorLuminosidad);
  setActiveButton(buttons[1]);
});
buttons[2]?.addEventListener('click', () => {
  renderAniosCon(ordenarPorSaturacion);
  setActiveButton(buttons[2]);
});

