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

function rect(color, x, y, w = 20, h = 40) {
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
  const chipW = 20, chipH = 40, padTop = 16, padRight = 0;
  const totalW = colores.length * chipW + padRight;
  const totalH = chipH + padTop;

  const wrap = document.createElement("div");
  wrap.style.margin = "2px 10px";
  wrap.style.overflowX = "auto"; // permite scroll si se pasa del ancho
  wrap.style.display = "flex"
  wrap.style.gap = "10px"

  const titulo = document.createElement("h3");
  titulo.textContent = ano;

  const texto = document.createElement("p");
  const key = Number(ano);
  texto.textContent = (contextoMap ? contextoMap.get(key) : (contexto.find(([ano]) => ano === key)?.[1])) || "";

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", totalW);
  svg.setAttribute("height", totalH);
  svg.setAttribute("viewBox", `0 0 ${totalW} ${totalH}`);
  svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
  svg.style.display = "block";
  svg.style.flex = "0 0 auto";        // 🚫 no encoger
  svg.style.flexShrink = "0";         // 🚫 no encoger
  svg.style.minWidth = totalW + "px";

  let x = 0;
  colores.forEach(c => {
    svg.appendChild(rect(c, x, padTop, chipW, chipH));
    x += chipW;
  });

  wrap.appendChild(titulo);
  wrap.appendChild(svg);
  wrap.appendChild(texto);
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

