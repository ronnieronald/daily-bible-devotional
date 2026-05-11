/* ================== CONFIG ================== */
const SHEET_ID =
  "2PACX-1vQK8r6I6vYuBhlxnU7pBKRkzknIwqLPFoyuF17xWeIhBihhMQ5JOfXdgy65YKn6sZQ-0BdvoS5Nj2S_";

/* ================== DÍA ================== */
function getDia() {
  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sabado"
  ];
  return dias[new Date().getDay()];
}

/* ================== SHEETS ================== */
async function getData() {
  const url =
    `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?output=tsv`;

  const res = await fetch(url);
  const text = await res.text();

  const lines = text.trim().split("\n");

  return lines.slice(1).map(line => {
    const cols = line.split("\t");

    return {
      dia: cols[0],
      tema: cols[1],
      texto: cols[2]
    };
  });
}

/* ================== PARSER (MEJORADO) ================== */
function parseTexto(texto) {

  // Hechos 21.37-22.5 (multi capítulo)
  let match = texto.match(/^(.+)\s(\d+)\.(\d+)-(\d+)\.(\d+)$/);
  if (match) {
    return {
      libro: match[1].toLowerCase(),
      capInicio: parseInt(match[2]),
      versInicio: parseInt(match[3]),
      capFin: parseInt(match[4]),
      versFin: parseInt(match[5]),
      type: "range_multi"
    };
  }

  // Hechos 21.37-50 (mismo capítulo)
  match = texto.match(/^(.+)\s(\d+)\.(\d+)-(\d+)$/);
  if (match) {
    return {
      libro: match[1].toLowerCase(),
      capitulo: parseInt(match[2]),
      inicio: parseInt(match[3]),
      fin: parseInt(match[4]),
      type: "range_single"
    };
  }

  // Hechos 21 (capítulo completo)
  match = texto.match(/^(.+)\s(\d+)$/);
  if (match) {
    return {
      libro: match[1].toLowerCase(),
      capitulo: parseInt(match[2]),
      type: "chapter"
    };
  }

  // Juan 3.16 (versículo único)
  match = texto.match(/^(.+)\s(\d+)\.(\d+)$/);
  if (match) {
    return {
      libro: match[1].toLowerCase(),
      capitulo: parseInt(match[2]),
      versiculo: parseInt(match[3]),
      type: "single"
    };
  }

  return null;
}

/* ================== LIBROS ================== */
const libros = {
  "romanos": "Romanos",
  "juan": "Juan",
  "mateo": "Mateo",
  "marcos": "Marcos",
  "lucas": "Lucas",
  "hechos": "Hechos",
  "1 corintios": "1Corintios",
  "2 corintios": "2Corintios",
  "galatas": "Galatas",
  "efesios": "Efesios",
  "filipenses": "Filipenses",
  "colosenses": "Colosenses",
  "1 pedro": "1Pedro",
  "2 pedro": "2Pedro",
  "apocalipsis": "Apocalipsis"
};

/* ================== BIBLIA ================== */
async function getBiblia(libro) {
  const res = await fetch(`data/${libro}.json`);
  return await res.json();
}

/* ================== WHATSAPP ================== */
function compartirWhatsApp(texto) {
  const url =
    `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
}

/* ================== MAIN ================== */
async function cargarDevocional() {

  const box = document.getElementById("result");
  const preloader = document.getElementById("preloader");

  preloader.style.display = "flex";
  box.innerHTML = "";

  try {

    const dia = getDia();
    const data = await getData();
    const item = data.find(d => d.dia === dia);

    if (!item) {
      box.innerHTML = "❌ No hay devocional";
      preloader.style.display = "none";
      return;
    }

    const parsed = parseTexto(item.texto);

    if (!parsed) {
      box.innerHTML = "⚠️ Formato inválido";
      preloader.style.display = "none";
      return;
    }

    const libroReal = libros[parsed.libro];

    if (!libroReal) {
      box.innerHTML = "❌ Libro no encontrado";
      preloader.style.display = "none";
      return;
    }

    const bible = await getBiblia(libroReal);
    const cap = bible.chapters;

    let textoFinal = "";

    let html = `
      <div>📅 ${item.dia}</div>
      <div>📚 ${item.tema}</div>
      <div>📄 ${item.texto}</div>
      <hr>
    `;

    /* ================= MULTI CAPÍTULO ================= */
    if (parsed.type === "range_multi") {

      for (let c = parsed.capInicio; c <= parsed.capFin; c++) {

        const chapter = cap[c];
        if (!chapter) continue;

        let vStart = (c === parsed.capInicio) ? parsed.versInicio : 1;
        let vEnd = (c === parsed.capFin) ? parsed.versFin : chapter.length - 1;

        for (let i = vStart; i <= vEnd; i++) {
          if (chapter[i]) {

            html += `
              <div class="verse">
                <b>${c}:${i}</b> ${chapter[i]}
              </div>
            `;

            textoFinal += `${c}:${i}. ${chapter[i]}\n`;
          }
        }
      }
    }

    /* ================= MISMO CAPÍTULO ================= */
    else if (parsed.type === "range_single") {

      const chapter = cap[parsed.capitulo];

      for (let i = parsed.inicio; i <= parsed.fin; i++) {
        if (chapter[i]) {

          html += `
            <div class="verse">
              <b>${parsed.capitulo}:${i}</b> ${chapter[i]}
            </div>
          `;

          textoFinal += `${parsed.capitulo}:${i}. ${chapter[i]}\n`;
        }
      }
    }

    /* ================= CAPÍTULO COMPLETO ================= */
    else if (parsed.type === "chapter") {

      const chapter = cap[parsed.capitulo];

      chapter.forEach((v, i) => {
        if (i === 0) return;

        html += `
          <div class="verse">
            <b>${parsed.capitulo}:${i}</b> ${v}
          </div>
        `;

        textoFinal += `${parsed.capitulo}:${i}. ${v}\n`;
      });
    }

    /* ================= VERSÍCULO ÚNICO ================= */
    else if (parsed.type === "single") {

      const v = cap[parsed.capitulo]?.[parsed.versiculo];

      if (v) {

        html += `
          <div class="verse">
            <b>${parsed.capitulo}:${parsed.versiculo}</b> ${v}
          </div>
        `;

        textoFinal += `${parsed.capitulo}:${parsed.versiculo}. ${v}\n`;
      }
    }

    /* ================= BOTÓN ================= */
    html += `
      <button onclick="compartirWhatsApp(\`${item.texto}\n${textoFinal}\`)">
        📤 Compartir WhatsApp
      </button>
    `;

    box.innerHTML = html;

  } catch (err) {
    box.innerHTML = "⚠️ Error al cargar";
  }

  preloader.style.display = "none";
}

/* ================== AUTOLOAD ================== */
window.onload = () => {
  cargarDevocional();
};