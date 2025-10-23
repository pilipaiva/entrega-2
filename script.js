import data from "./van_gogh_filtrado.json" assert { type: "json" };

const SVG_NS = "http://www.w3.org/2000/svg";

/* ===================== Datos de contexto ===================== */
const contexto = [
  [1885, "Fallece su padre en marzo. Se interesa en las tallas de madera japonesas."],
  [1886, "Se muda a París con Theo, su hermano. Comienza una educación formal en artes, y conoce a los impresionistas."],
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
function rect(color, x, y, w = 15, h = 30) {
  const r = document.createElementNS(SVG_NS, "rect");
  // si tienes playColor(color) déjalo, si no, comenta la línea:
  // r.addEventListener('mouseenter', () => playColor(color));
  r.setAttribute("x", x);
  r.setAttribute("y", y);
  r.setAttribute("width", w);
  r.setAttribute("height", h);
  r.setAttribute("fill", color);
  r.setAttribute("shape-rendering", "crispEdges");
  return r;
}

/* ===================== Layout: columna filas + panel derecho global ===================== */
function setupLayout() {
  const salida = document.getElementById('salida');
  if (!salida) return null;

  // salida -> 2 columnas
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
    detail.style.display = 'none'; // ⬅️ oculto por defecto
    salida.appendChild(detail);
  }

  return { rowsCol, detail };
}

/* ===================== Panel derecho (contenido) ===================== */
function buildDetailPanelContent(year, contextoTexto, urls) {
  const box = document.createElement('div');

  // Título / contexto arriba
  const head = document.createElement('div');
  head.textContent = contextoTexto || '';
  head.style.fontSize = '20px';
  head.style.color = '#333';
  head.style.margin = '0 0 8px 0';
  head.style.lineHeight = '1.35';
  box.appendChild(head);

  // === Masonry con columnas (no grid) ===
  const wall = document.createElement('div');
  // Opción A: número fijo de columnas
  // wall.style.columnCount = 3;

  // Opción B (recomendada): auto en base a ancho deseado de columna
  wall.style.columnWidth = '220px';   // prueba 180–260px según gusto
  wall.style.columnGap = '8px';
  wall.style.width = '100%';

  if (urls.length === 0) {
    const empty = document.createElement('div');
    empty.style.fontSize = '13px';
    empty.style.color = '#666';
    empty.textContent = 'No hay imágenes marcadas como importantes para este año.';
    wall.appendChild(empty);
  } else {
    urls.forEach(u => {
      const img = document.createElement('img');
      img.src = u;
      img.alt = `Obra ${year}`;
      img.loading = 'lazy';

      // Importante para columnas:
      img.style.display = 'block';
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.margin = '0 0 8px 0';   // separación vertical entre imágenes
      img.style.borderRadius = '6px';
      img.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
      img.style.breakInside = 'avoid';  // evita cortes de imagen entre columnas
      img.style.webkitColumnBreakInside = 'avoid';
      img.style.pageBreakInside = 'avoid';

      wall.appendChild(img);
    });
  }

  box.appendChild(wall);
  return box;
}


/* ===================== Imágenes importantes por año ===================== */
function getImportantImagesByYear(year) {
  const y = Number(year);
  return data
    .filter(d => Number(d.Year) === y && (d.Show === true || d.Show === "True" || d.Show === "true"))
    .map(d => d.Link)
    .filter(Boolean);
}

/* ===================== Mostrar/ocultar textos de contexto ===================== */
function hideAllContextTexts() {
  document.querySelectorAll('.context-text').forEach(p => {
    p.style.display = 'none';
  });
}

function showAllContextTexts() {
  document.querySelectorAll('.context-text').forEach(p => (p.style.display = 'block'));
}

/* ===================== Enfoque visual de fila ===================== */
function applyRowFocus(wrap, on = true) {
  if (on) {
    wrap.style.background = '#f4f6f8';
    wrap.style.transform = 'scale(1.015)';
    wrap.style.transition = 'transform 120ms ease, background 120ms ease, box-shadow 120ms ease';
    wrap.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
  } else {
    wrap.style.background = 'transparent';
    wrap.style.transform = 'scale(1)';
    wrap.style.boxShadow = 'none';
  }
}

/* ===================== Sonidos por año ===================== */
const ROW_SOUNDS = {

  1885: new Audio('./1885.mp3'),
  1886: new Audio('./1886.mp3'),
  1887: new Audio('./1887.mp3'),
  1888: new Audio('./1888.mp3'),
  1889: new Audio('./1889.mp3'),
  1890: new Audio('./1890.mp3')
};
Object.values(ROW_SOUNDS).forEach(a => a && (a.volume = 0.35));
ROW_SOUNDS[1888].volume = 1.0; // o 1.0 para máximo volumen


/* ===================== Estado global de selección ===================== */
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
  // restaurar UI
  showAllContextTexts();

  const detail = document.getElementById('detailPanel');
  if (detail) {
    detail.innerHTML = '';
    detail.style.background = 'transparent';
    detail.style.boxShadow = 'none';
    detail.style.display = 'none';
  }

  if (activeWrap) applyRowFocus(activeWrap, false);
  if (activeSound) { try { activeSound.pause(); activeSound.currentTime = 0; } catch {} }

  activeYear = null;
  activeWrap = null;
  activeSound = null;
  cancelClearTimer();
}

function setActiveRow(wrap, year) {
  cancelClearTimer();

  const detail = document.getElementById('detailPanel');
  const contextoTexto = contextoMap.get(Number(year)) || '';
  const sound = ROW_SOUNDS[year];

  // si ya hay una activa distinta, des-enfócala
  if (activeWrap && activeWrap !== wrap) {
    applyRowFocus(activeWrap, false);
  }
  if (activeSound && activeSound !== sound) {
    try { activeSound.pause(); activeSound.currentTime = 0; } catch {}
  }

  // foco visual + sonido
  applyRowFocus(wrap, true);
  if (sound) { try { sound.currentTime = 0; sound.play().catch(()=>{}); } catch {} 
}

  // panel derecho visible con imágenes + contexto arriba
  if (detail) {
    detail.innerHTML = '';
    const urls = getImportantImagesByYear(year);
    detail.appendChild(buildDetailPanelContent(year, contextoTexto, urls));
    detail.style.background = '#f4f6f8';
    detail.style.borderRadius = '8px';
    detail.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
    detail.style.display = 'block'; // ⬅️ mostrar panel
  }

  // ocultar TODAS las líneas de contexto en las filas (solo queda la del panel)
  hideAllContextTexts();


  // guarda estado
  activeYear = year;
  activeWrap = wrap;
  activeSound = sound;
}

/* ===================== Crear una fila ===================== */
function crearFila(colores, etiqueta = "", ano) {
  const chipW = 16.5, chipH = 33, padTop = 16, padRight = 0;
  const totalW = colores.length * chipW + padRight;
  const totalH = chipH + padTop;

  const wrap = document.createElement("div");
  wrap.style.margin = "0px 8px";
  wrap.style.overflowX = "auto";
  wrap.style.display = "flex";
  wrap.style.gap = "10px";
  wrap.style.alignItems = "center";
  wrap.style.padding = "6px 8px";

  const titulo = document.createElement("h3");
  titulo.textContent = ano;
  titulo.style.margin = "0 6px 0 0";
  titulo.style.fontSize = "16px";

  const key = Number(ano);
  const contextoTexto = contextoMap.get(key) || "";

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", totalW);
  svg.setAttribute("height", totalH);
  svg.setAttribute("viewBox", `0 0 ${totalW} ${totalH}`);
  svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
  svg.style.display = "block";
  svg.style.flex = "0 0 auto";
  svg.style.flexShrink = "0";
  svg.style.minWidth = totalW + "px";

  let x = 0;
  colores.forEach(c => {
    svg.appendChild(rect(c, x, padTop, chipW, chipH));
    x += chipW;
  });

  const texto = document.createElement("p");
  texto.className = "context-text";
  texto.dataset.year = String(ano);
  texto.textContent = contextoTexto;
  texto.style.margin = "0";
  texto.style.fontSize = "14px";
  texto.style.color = "#555";

  wrap.appendChild(titulo);
  wrap.appendChild(svg);
  wrap.appendChild(texto);

  // Eventos: activar al entrar, programar limpieza al salir si el mouse NO va al panel
  wrap.addEventListener('mouseenter', () => setActiveRow(wrap, ano));
  wrap.addEventListener('mouseleave', (e) => {
    // si el mouse se mueve hacia el panel derecho o hacia otra fila, no limpies aún
    const detail = document.getElementById('detailPanel');
    const to = e.relatedTarget;
    const towardDetail = detail && detail.contains(to);
    const towardRow = to && to.closest && to.closest('#rowsCol');
    if (towardDetail || towardRow) return;

    // si realmente saliste de ambas zonas, limpia con delay
    cancelClearTimer();
    clearTimer = setTimeout(() => {
      // antes de limpiar, verifica que no volvimos a entrar a la fila o al panel
      const over = document.querySelector(':hover');
      const stillOverRow = over && over.closest && over.closest('#rowsCol');
      const stillOverDetail = over && detail && detail.contains(over);
      if (!stillOverRow && !stillOverDetail) {
        clearActive();
      }
    }, 250);
  });

  return wrap;
}

/* ===================== Listeners en panel derecho para cancelar limpieza ===================== */
function bindDetailPanelGuards() {
  const detail = document.getElementById('detailPanel');
  if (!detail) return;
  detail.addEventListener('mouseenter', () => {
    cancelClearTimer(); // mientras esté sobre el panel, no limpies
  });
  detail.addEventListener('mouseleave', () => {
    // si al salir del panel no estamos sobre una fila, limpia con delay
    cancelClearTimer();
    clearTimer = setTimeout(() => {
      const over = document.querySelector(':hover');
      const stillOverRow = over && over.closest && over.closest('#rowsCol');
      const stillOverDetail = over && detail.contains(over);
      if (!stillOverRow && !stillOverDetail) {
        clearActive();
      }
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

  // Estado “nada seleccionado”: ver todos los textos y panel oculto
  showAllContextTexts();
  const detail = document.getElementById('detailPanel');
  if (detail) {
    detail.innerHTML = '';
    detail.style.background = 'transparent';
    detail.style.boxShadow = 'none';
    detail.style.display = 'none';
  }

  // asegúrate de que el panel tenga los guards del hover
  bindDetailPanelGuards();
}

/* ===================== Enganche inicial y botones ===================== */
renderAniosCon();

document.getElementById('btnValor')?.addEventListener('click', () => {
  renderAniosCon(ordenarPorColor_RYB);
});
document.getElementById('btnLum')?.addEventListener('click', () => {
  renderAniosCon(ordenarPorLuminosidad);
});
document.getElementById('btnSat')?.addEventListener('click', () => {
  renderAniosCon(ordenarPorSaturacion);
});
