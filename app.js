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

/* ================== PARSER ================== */
function parseTexto(texto) {
  const match = texto.match(/^(.+)\s(\d+)\.(\d+)-(\d+)$/);
  if (!match) return null;

  return {
    libro: match[1].toLowerCase(),
    capitulo: match[2],
    inicio: parseInt(match[3]),
    fin: parseInt(match[4])
  };
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
    const cap = bible.chapters[parsed.capitulo];

    let textoFinal = "";

    let html = `
      <div>📅 ${item.dia}</div>
      <div>📚 ${item.tema}</div>
      <div>📄 ${item.texto}</div>

      <hr>
    `;

    for (let i = parsed.inicio; i <= parsed.fin; i++) {
      if (cap[i]) {
        const v = cap[i];

        html += `
          <div class="verse">
            <b>${i}</b> ${v}
          </div>
        `;

        textoFinal += `${i}. ${v}\n`;
      }
    }

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