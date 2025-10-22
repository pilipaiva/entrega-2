import data from "./van_gogh_filtrado.json" assert { type: "json" };

const SVG_NS = "http://www.w3.org/2000/svg";
const div = document.getElementById("info");

// 1) Filtro robusto + parseo robusto de Colors
function ColoresAno(ano) {
  const year = Number(ano);
  const filtered = data.filter(item => Number(item.Year) === year);

  const colors = filtered.flatMap(item => {
    // Si viniera como array, lo tomamos directo
    if (Array.isArray(item.Colors)) {
      return item.Colors.map(s => String(s).trim());
    }
    // Si es string tipo "('#AA', '#BB', ...')" lo parseamos robusto
    return String(item.Colors)
      .replace(/[()]/g, '')           // saca paréntesis
      .split(/\s*,\s*/)               // separa por coma con o sin espacios
      .map(s => s.replace(/'/g, ''))  // quita comillas simples
      .map(s => s.trim())
      .filter(s => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)); // valida hex
  });

  return colors; // <-- ¡clave!
}

// 2) Helpers SVG

function rect(color, x, y, w = 15, h = 30) {
  const r = document.createElementNS(SVG_NS, "rect");
  // evento de sonido al pasar el mouse
  r.addEventListener('mouseenter', () => playColor(color));
  r.setAttribute("x", x);
  r.setAttribute("y", y);
  r.setAttribute("width", w);
  r.setAttribute("height", h);
  r.setAttribute("fill", color);
  r.setAttribute("shape-rendering", "crispEdges");
  return r;
}

  const contexto = [[1884, ""],
  [1885, "Fallece su padre en marzo. Se interesa en las tallas de madera japonesas."],
  [1886, "Se muda a París con Theo, su hermano. Comienza una educación formal en artes, y conoce a los impresionistas."], 
  [1887, "París: influencia japonesa y puntillismo; vistas de Montmartre."], 
  [1888, "Se muda a Arlés, a la casa Amarilla, una residencia de artistas. Se enfoca en pintar naturaleza, y en diciembre se cortó la oreja"], 
  [1889, "Lo internan en un asilo mental. Sufre de alucinaciones y un estado mental fluctuante."], 
  [1890, "Su salud aumenta drásticamente, hasta que cae en picada a mitad de año y se dispara en el pecho. A los dos días muere."]]
  const contextoMap = new Map(contexto);

function crearFila(colores, etiqueta = "", ano) {
  const chipW = 15, chipH = 30, padTop = 16, padRight = 0;
  const totalW = colores.length * chipW + padRight;
  const totalH = chipH + padTop;

  const wrap = document.createElement("div");
  wrap.style.margin = "0px 8px";
  wrap.style.overflowX = "auto";
  wrap.style.display = "flex";
  wrap.style.gap = "10px";
  wrap.style.alignItems = "center";   // centrar verticalmente
  wrap.style.padding = "6px 8px";     // un poco de respiro

  const titulo = document.createElement("h3");
  titulo.textContent = ano;
  titulo.style.margin = "0 6px 0 0";
  titulo.style.fontSize = "16px";

  // frase de contexto original (string)
  const key = Number(ano);
  const contextoTexto = (contextoMap ? contextoMap.get(key) : (contexto.find(([y]) => y === key)?.[1])) || "";

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

  // === NUEVO: contenedor derecho ("sideBox") donde irá texto o fotos ===
  const sideBox = document.createElement('div');
  sideBox.style.minWidth = '220px';    // ancho mínimo para fotos/ texto
  sideBox.style.maxWidth = '380px';
  sideBox.style.flex = '0 0 26%';      // % del ancho (ajusta a gusto)

  // por defecto: mostrar SOLO el texto de contexto
  const p = document.createElement('p');
  p.textContent = contextoTexto;
  p.style.margin = '0';
  p.style.fontSize = '14px';
  p.style.color = '#555';
  sideBox.appendChild(p);

  // armar fila
  wrap.appendChild(titulo);
  wrap.appendChild(svg);
  wrap.appendChild(sideBox);

  // === NUEVO: enganchar comportamiento hover en ESTA fila
  attachRowHover(wrap, ano, titulo, sideBox, contextoTexto);

  return wrap;
}



// ===== (A) util: conv HEX -> HSL (se usa por los 3 botones) =====
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

// ===== (B) funciones separadas de orden =====
// 1) Por valor: primero luminosidad (negro→blanco), y como desempate tono (Hue)
function ordenarPorColor_RYB(colors) {
  function key(cHex){
    const {h,s,l} = hexToHSL(cHex);
    const hue = (h+360)%360;
    // Buckets: R=[330..360)∪[0..60), Y=[60..180), B=[180..330)
    let bucket, pos;
    if (hue >= 330 || hue < 60) {           // Rojos
      bucket = 0;
      pos = hue < 60 ? hue : hue - 360;     // normaliza para que 350° < 10°
      pos += 60;                             // rango ~0..120 aprox
    } else if (hue < 180) {                  // Amarillos/Verdes
      bucket = 1;
      pos = hue - 60;                        // 0..120
    } else {                                 // Azules/Cyan/Violetas
      bucket = 2;
      pos = hue - 180;                       // 0..150
    }
    // tiebreakers: más saturado primero, luego más claro
    return [bucket, pos, -s, l];
  }
  return [...colors].sort((a,b)=>{
    const ka = key(a), kb = key(b);
    return (ka[0]-kb[0])||(ka[1]-kb[1])||(ka[2]-kb[2])||(ka[3]-kb[3]);
  });
}


// 2) Por luminosidad: oscuro → claro
function ordenarPorLuminosidad(colors) {
  return [...colors].sort((a, b) => hexToHSL(a).l - hexToHSL(b).l);
}

// 3) Por saturación: más saturado → menos saturado
function ordenarPorSaturacion(colors) {
  return [...colors].sort((a, b) => hexToHSL(b).s - hexToHSL(a).s);
}

// ===== (C) re-render NO destructivo =====
// Renderiza todas las filas en #salida usando el "ordenador" que pases.
// Si no pasas ordenador, usa el orden original.
function renderAniosCon(ordenador = null) {
  const salida = document.getElementById('salida');
  if (!salida) return;

  // Limpia SOLO el contenedor de filas (no el body)
  salida.innerHTML = '';

  const anios = [1884, 1885, 1886, 1887, 1888, 1889, 1890];

  anios.forEach(y => {
    const base = ColoresAno(y);
    const cols = ordenador ? ordenador(base) : base;
    // Reutilizamos tu crearFila tal cual
    const fila = crearFila(cols, `Año ${y}`, y);
    salida.appendChild(fila);
  });
}

// ===== (D) enganche: dibuja inicialmente dentro de #salida =====
// (Opcional pero recomendado) Si ya renderizaste al body, puedes comentar tu
// bloque original y llamar a esta línea. Si quieres mantener lo tuyo,
// puedes dejarlo; esto solo asegura que los botones operen sobre #salida.
renderAniosCon();

// ===== (E) listeners de botones (no tocan tu código original) =====
document.getElementById('btnValor')?.addEventListener('click', () => {
  renderAniosCon(ordenarPorColor_RYB);
});
document.getElementById('btnLum')?.addEventListener('click', () => {
  renderAniosCon(ordenarPorLuminosidad);
});
document.getElementById('btnSat')?.addEventListener('click', () => {
  renderAniosCon(ordenarPorSaturacion);
});
/***** === HOVER DE FILA: SONIDO + IMÁGENES IMPORTANTES + ENFOQUE VISUAL === *****/
// === Un sonido distinto por año ===
// Coloca los archivos de audio en la misma carpeta del proyecto.
// Ejemplo: sonido_1884.mp3, sonido_1885.mp3, etc.
const ROW_SOUNDS = {
  1884: new Audio('./1884.mp3'),
  1885: new Audio('./1885.mp3'),
  1886: new Audio('./1886.mp3'),
  1887: new Audio('./1887.mp3'),
  1888: new Audio('./1888.mp3'),
  1889: new Audio('./1889.mp3'),
  1890: new Audio('./1890.mp3')
};

// Ajusta el volumen de todos
Object.values(ROW_SOUNDS).forEach(a => (a.volume = 0.35));


// Audio del “rollover” de fila (pon el archivo en la misma carpeta)
const ROW_SOUND = new Audio('./sonido.mp3');   // cámbialo si usas otro nombre/extension
ROW_SOUND.volume = 0.3;

// util: obtiene imágenes “importantes” (Show === true) para un año
function getImportantImagesByYear(year) {
  const y = Number(year);
  return data
    .filter(d => Number(d.Year) === y && (d.Show === true || d.Show === "True"))
    .map(d => d.Link)
    .filter(Boolean);
}

// Crea un grid de imágenes con un título arriba (la frase de contexto)
function buildImagePanel(year, contextoTexto, urls) {
  const panel = document.createElement('div');
  panel.className = 'side-panel';
  panel.style.display = 'grid';
  panel.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
  panel.style.gap = '8px';
  panel.style.alignContent = 'start';

  // título (frase de contexto del año)
  const head = document.createElement('div');
  head.textContent = contextoTexto || '';
  head.style.gridColumn = '1 / -1';
  head.style.fontSize = '14px';
  head.style.color = '#333';
  head.style.marginBottom = '4px';
  panel.appendChild(head);

  // imágenes
  urls.forEach(u => {
    const img = document.createElement('img');
    img.src = u;
    img.alt = `Obra ${year}`;
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '6px';
    img.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
    panel.appendChild(img);
  });

  if (urls.length === 0) {
    const empty = document.createElement('div');
    empty.style.gridColumn = '1 / -1';
    empty.style.fontSize = '13px';
    empty.style.color = '#666';
    empty.textContent = 'No hay imágenes marcadas como importantes para este año.';
    panel.appendChild(empty);
  }

  return panel;
}

// Aplica/quita el “foco visual” a la fila y su panel derecho
function applyRowFocus(wrap, on = true) {
  if (on) {
    wrap.classList.add('row-focus');
    wrap.style.background = '#f4f6f8';            // gris claro
    wrap.style.transform = 'scale(1.015)';        // leve agrande
    wrap.style.transition = 'transform 120ms ease, background 120ms ease, box-shadow 120ms ease';
    wrap.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
  } else {
    wrap.classList.remove('row-focus');
    wrap.style.background = 'transparent';
    wrap.style.transform = 'scale(1)';
    wrap.style.boxShadow = 'none';
  }
}

// Vincula los eventos de hover a UNA fila (wrap)
// - tituloElem: <h3> del año
// - sideBox: contenedor a la derecha (donde estará el texto o las imágenes)
function attachRowHover(wrap, year, tituloElem, sideBox, contextoTexto) {
  const onEnter = () => {
    const sound = ROW_SOUNDS[year];
if (sound) {
  try {
    sound.currentTime = 0;
    sound.play().catch(() => {});
  } catch {}
}

    applyRowFocus(wrap, true);

    // reemplaza contenido del sideBox: muestra imágenes con el contexto arriba
    sideBox.innerHTML = '';
    const urls = getImportantImagesByYear(year);
    const panel = buildImagePanel(year, contextoTexto, urls);
    sideBox.appendChild(panel);
    sideBox.style.background = '#f4f6f8';  // mismo gris claro
    sideBox.style.borderRadius = '8px';
    sideBox.style.padding = '6px';
  };

  const onLeave = () => {
    const sound = ROW_SOUNDS[year];
if (sound) {
  try { sound.pause(); sound.currentTime = 0; } catch {}
}

    applyRowFocus(wrap, false);

    // restaura: solo la frase de contexto (sin imágenes)
    sideBox.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = contextoTexto || '';
    p.style.margin = '0';
    p.style.fontSize = '14px';
    p.style.color = '#555';
    sideBox.appendChild(p);
    sideBox.style.background = 'transparent';
    sideBox.style.padding = '0';
  };

  wrap.addEventListener('mouseenter', onEnter);
  wrap.addEventListener('mouseleave', onLeave);
}

