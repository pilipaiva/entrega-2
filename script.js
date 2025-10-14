import data from "./van_gogh_filtrado_10_por_anio_VERIFICADO.json" assert { type: "json" };

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
  r.setAttribute("x", x);
  r.setAttribute("y", y);
  r.setAttribute("width", w);
  r.setAttribute("height", h);
  r.setAttribute("fill", color);
  r.setAttribute("shape-rendering", "crispEdges");
  return r;
}

function crearFila(colores, etiqueta = "") {
  const chipW = 20, chipH = 40, padTop = 16, padRight = 0;
  const totalW = colores.length * chipW + padRight;
  const totalH = chipH + padTop;

  const wrap = document.createElement("div");
  wrap.style.margin = "8px 0";
  wrap.style.overflowX = "auto"; // permite scroll si se pasa del ancho

  const label = document.createElement("div");
  label.textContent = `${etiqueta} (${colores.length} colores)`;
  label.style.font = "14px/1.2 system-ui, sans-serif";
  label.style.marginBottom = "4px";
  wrap.appendChild(label);

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", totalW);
  svg.setAttribute("height", totalH);
  svg.setAttribute("viewBox", `0 0 ${totalW} ${totalH}`);
  svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
  svg.style.display = "block";

  let x = 0;
  colores.forEach(c => {
    svg.appendChild(rect(c, x, padTop, chipW, chipH));
    x += chipW;
  });

  wrap.appendChild(svg);
  return wrap;
}

// 3) Render: incluye 1884–1890
const anios = [1884, 1885, 1886, 1887, 1888, 1889, 1890];
anios.forEach(y => {
  const cols = ColoresAno(y);
  document.body.appendChild(crearFila(cols, `Año ${y}`));
});

// 4) Texto informativo
const colores1885 = ColoresAno(1885);
div.textContent = `El año 1885 tiene estos colores (${colores1885.length}): ${colores1885.join(", ")}`;
