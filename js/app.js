const app = document.getElementById("app");
let peliculas = [],
  categorias = [];
const key = "sakila-carrito";
const getCart = () => JSON.parse(localStorage.getItem(key) || "[]");
const saveCart = (v) => {
  localStorage.setItem(key, JSON.stringify(v));
  document.getElementById("cantidad").textContent = v.length;
};
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) => "Bs. " + Number(n || 0).toFixed(2);


async function cargarImagenesTMDB() {
  await Promise.all(
    peliculas.map(async (p) => {
      try {
        const titulo = encodeURIComponent(p.titulo);
        const anio = Number(p.anio_estreno);

        const url = `/api/tmdb/buscar?titulo=${titulo}&anio=${anio}`;

        const respuesta = await fetch(url);

        if (!respuesta.ok) return;

        const resultados = await respuesta.json();

        if (!Array.isArray(resultados) || resultados.length === 0) {
          return;
        }

        const normalizar = (texto) =>
          String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

        const anioCoincide = (resultado) =>
          Number(resultado.fecha?.slice(0, 4)) === anio;

        // Buscamos primero una coincidencia exacta.
        let peliculaTMDB = resultados.find(
          (resultado) =>
            normalizar(resultado.titulo) === normalizar(p.titulo) &&
            anioCoincide(resultado)
        );

        // Algunos títulos tienen traducciones diferentes.
        // Solo usamos un ID conocido cuando está verificado.
        const idsVerificados = {
          "Avengers: Endgame": 299534
        };

        if (
          !peliculaTMDB &&
          idsVerificados[p.titulo]
        ) {
          peliculaTMDB = resultados.find(
            (resultado) =>
              resultado.tmdb_id === idsVerificados[p.titulo]
          );
        }

        if (!peliculaTMDB) return;

        p.tmdb_id = peliculaTMDB.tmdb_id;

        if (peliculaTMDB.poster_url) {
          p.poster_url = peliculaTMDB.poster_url;
        }

        if (peliculaTMDB.fondo_url) {
          p.fondo_url = peliculaTMDB.fondo_url;
        }

      } catch (error) {
        console.warn(
          "Error cargando imágenes de:",
          p.titulo,
          error
        );
      }
    })
  );
}

const poster = (p) =>
  p.poster_url
    ? `<img class="poster" src="${esc(p.poster_url)}" alt="Póster de ${esc(p.titulo)}" onerror="this.outerHTML='<div class=&quot;poster&quot;>🎬</div>'">`
    : `<div class="poster">🎬<br>${esc(p.titulo)}</div>`;
function card(p) {
  return `<article class="card">${poster(p)}<div class="card-body"><h3>${esc(p.titulo)}</h3><p class="muted">${esc(p.anio_estreno || "")} · ${esc(p.clasificacion || "Sin clasificación")}</p><p>${money(p.tarifa_alquiler)} / día</p><button class="btn" data-detail="${p.id_pelicula}">Ver detalles</button></div></article>`;
}
function bindCards() {
  document
    .querySelectorAll("[data-detail]")
    .forEach(
      (b) =>
        (b.onclick = () => (location.hash = "#detalle/" + b.dataset.detail)),
    );
}
function inicio() {
  const p = peliculas[0];
  app.innerHTML = `<section class="hero"><h1>Historias que merecen<br>una gran pantalla.</h1><p>Explora nuestro catálogo de películas y alquila tus favoritas desde Club Sakila.</p><button class="btn" id="explorar">Explorar películas</button></section><section class="wrap"><h2>🎬 Destacadas para ti</h2><div class="grid">${peliculas.slice(0, 8).map(card).join("") || "<p>No hay películas registradas todavía.</p>"}</div></section>`;
  document.getElementById("explorar").onclick = () =>
    (location.hash = "#peliculas");
  bindCards();
}
function catalogo() {
  app.innerHTML = `<section class="wrap"><h1>Catálogo de películas</h1><div class="row filters"><input id="buscar" placeholder="Buscar por título o director"><select id="clase"><option value="">Todas las clasificaciones</option>${[...new Set(peliculas.map((p) => p.clasificacion).filter(Boolean))].map((c) => `<option>${esc(c)}</option>`).join("")}</select><select id="orden"><option value="titulo">Orden alfabético</option><option value="rating">Mejor valoración</option></select></div><div class="grid" id="lista"></div></section>`;
  function filtrar() {
    let q = document.getElementById("buscar").value.toLowerCase(),
      c = document.getElementById("clase").value,
      orden = document.getElementById("orden").value;
    let lista = peliculas.filter(
      (p) =>
        (p.titulo + " " + (p.director || "")).toLowerCase().includes(q) &&
        (!c || p.clasificacion === c),
    );
    if (orden === "rating")
      lista.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    document.getElementById("lista").innerHTML =
      lista.map(card).join("") || "<p>No se encontraron películas.</p>";
    bindCards();
  }
  document
    .querySelectorAll(".filters input,.filters select")
    .forEach((e) => e.addEventListener("input", filtrar));
  filtrar();
}

function detalle(id) {
  const p = peliculas.find(
    (pelicula) => String(pelicula.id_pelicula) === String(id)
  );

  if (!p) {
    app.innerHTML = `
      <section class="wrap">
        <h2>Película no encontrada</h2>
        <a href="#peliculas" class="btn">Volver al catálogo</a>
      </section>
    `;
    return;
  }

  const imagen = p.fondo_url
  ? esc(p.fondo_url)
  : p.poster_url
    ? esc(p.poster_url)
    : "";

  const fondo = imagen
    ? `linear-gradient(90deg, rgba(10,10,15,.98), rgba(10,10,15,.78)), url("${imagen}")`
    : "linear-gradient(120deg, #22152f, #090909)";

  const calificacion = Number(p.rating || 0).toFixed(1);

  app.innerHTML = `
    <section class="movie-detail-page">

      <div class="movie-backdrop"
           style="background-image: ${fondo}">

        <div class="movie-detail-container">

          <div class="movie-main-poster">
            ${poster(p)}
          </div>

          <div class="movie-information">

            <a href="#peliculas" class="movie-back">
              ← Volver al catálogo
            </a>

            <h1>${esc(p.titulo)}</h1>

            <div class="movie-metadata">
              <span>${esc(p.anio_estreno || "Sin año")}</span>
              <span>${esc(p.clasificacion || "N/D")}</span>
              <span>${esc(p.duracion || "?")} min</span>
            </div>

            <div class="movie-score">
              <span class="score-circle">
                ⭐ ${calificacion}
              </span>
              <span>Calificación de la película</span>
            </div>

            <h2>Sinopsis</h2>

            <p class="movie-synopsis">
              ${esc(p.sinopsis || "Sin sinopsis registrada.")}
            </p>

            <div class="movie-credits">
              <div>
                <strong>Director</strong>
                <p>${esc(p.director || "No registrado")}</p>
              </div>

              <div>
                <strong>Duración</strong>
                <p>${esc(p.duracion || "?")} minutos</p>
              </div>

              <div>
                <strong>Clasificación</strong>
                <p>${esc(p.clasificacion || "N/D")}</p>
              </div>
            </div>

            <div class="movie-actions">

              <button class="btn" id="agregar">
                🛒 Alquilar película
              </button>

              ${
                p.trailer_url
                  ? `<a class="btn secondary"
                       href="${esc(p.trailer_url)}"
                       target="_blank"
                       rel="noopener noreferrer">
                       ▶ Ver tráiler
                     </a>`
                  : ""
              }

            </div>

          </div>

        </div>
      </div>

      <section class="movie-extra wrap">

        <h2>Información de la película</h2>

        <div class="movie-extra-grid">

          <div class="movie-extra-card">
            <h3>Precio de alquiler</h3>
            <p>${money(p.tarifa_alquiler)} por día</p>
          </div>

          <div class="movie-extra-card">
            <h3>Año de estreno</h3>
            <p>${esc(p.anio_estreno || "No registrado")}</p>
          </div>

          <div class="movie-extra-card">
            <h3>Calificación</h3>
            <p>⭐ ${calificacion} / 10</p>
          </div>

        </div>

        <h2>Reparto principal</h2>

        <div id="movie-cast" class="movie-cast-grid">
          <p class="muted">Cargando reparto...</p>
        </div>

      </section>

    </section>
  `;

  
document.getElementById("agregar").onclick = () => {
  let c = getCart();

  const existe = c.some(
    (x) => String(x.id) === String(p.id_pelicula)
  );

  if (existe) {
    alert(
      "Esta película ya está en tu carrito. " +
      "Puedes aumentar los días de alquiler desde allí."
    );
  } else {
    c.push({
      id: p.id_pelicula,
      dias: 1
    });

    saveCart(c);
  }

  location.hash = "#carrito";
};


  cargarReparto(p.id_pelicula);
}


const repartoPeliculas = {
  "Avengers: Endgame": [
    {
      nombre: "Robert Downey Jr.",
      personaje: "Tony Stark / Iron Man",
      foto: "/assets/images/actores/robert-downey.jpg"
    },
    {
      nombre: "Chris Evans",
      personaje: "Steve Rogers / Capitán América",
      foto: "/assets/images/actores/chris-evans.jpg"
    },
    {
      nombre: "Mark Ruffalo",
      personaje: "Bruce Banner / Hulk",
      foto: "/assets/images/actores/mark-ruffalo.jpg"
    },
    {
      nombre: "Chris Hemsworth",
      personaje: "Thor",
      foto: "/assets/images/actores/chris-hemsworth.jpg"
    },
    {
      nombre: "Scarlett Johansson",
      personaje: "Natasha Romanoff / Black Widow",
      foto: "/assets/images/actores/scarlett-johansson.jpg"
    },
    {
      nombre: "Jeremy Renner",
      personaje: "Clint Barton / Hawkeye",
      foto: "/assets/images/actores/jeremy-renner.jpg"
    },
    {
      nombre: "Josh Brolin",
      personaje: "Thanos",
      foto: "/assets/images/actores/josh-brolin.jpg"
    }
  ]
};




async function cargarReparto(id) {
  const contenedor = document.getElementById("movie-cast");

  if (!contenedor) return;

  contenedor.innerHTML =
    '<p class="muted">Cargando actores...</p>';

  try {
    const respuesta = await fetch(
      "/api/peliculas/" +
      encodeURIComponent(id) +
      "/actores"
    );

    if (!respuesta.ok) {
      throw new Error("No se pudo cargar el reparto");
    }

    const actores = await respuesta.json();

    if (!contenedor.isConnected) return;

    if (!actores.length) {
      contenedor.innerHTML =
        '<p class="muted">Todavía no hay actores registrados para esta película.</p>';
      return;
    }

    const LIMITE_REPARTO = 12;

    function mostrarActores(mostrarTodos = false) {
      const visibles = mostrarTodos
        ? actores
        : actores.slice(0, LIMITE_REPARTO);

      contenedor.innerHTML = visibles.map(actor => {
        const nombre = esc(actor.nombre || "Sin nombre");
        const personaje = esc(actor.personaje || "Reparto");
        const foto = actor.foto
          ? esc(actor.foto)
          : "";

        return `
          <article class="cast-card">
            ${foto ? `
              <img
                class="cast-photo"
                src="${foto}"
                alt="${nombre}"
                loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
              >
            ` : ""}

            <div
              class="cast-placeholder"
              style="display:${foto ? "none" : "flex"}"
            >👤</div>

            <div class="cast-info">
              <h3>${nombre}</h3>
              <p>${personaje}</p>
            </div>
          </article>
        `;
      }).join("");

      if (actores.length > LIMITE_REPARTO) {
        const boton = document.createElement("button");

        boton.className = "cast-more-button";

        boton.textContent = mostrarTodos
          ? "Ver menos"
          : `Ver todo el reparto (${actores.length})`;

        boton.addEventListener("click", () => {
          mostrarActores(!mostrarTodos);
        });

        contenedor.appendChild(boton);
      }
    }

    mostrarActores();

  } catch (error) {
    console.error("Error cargando actores:", error);

    if (contenedor.isConnected) {
      contenedor.innerHTML =
        '<p class="muted">No se pudo cargar el reparto.</p>';
    }
  }
}


function carrito() {
  let c = getCart();
  let total = 0;
  app.innerHTML = `<section class="wrap"><h1>Mi carrito</h1>${
    c
      .map((x) => {
        let p = peliculas.find((p) => p.id_pelicula === x.id);
        if (!p) return "";
        let subtotal = Number(p.tarifa_alquiler) * x.dias;
        total += subtotal;
        return `<div class="item row"><strong>${esc(p.titulo)}</strong><span>${money(p.tarifa_alquiler)} / día</span><label>Días: <input type="number" min="1" max="30" value="${x.dias}" data-days="${x.id}"></label><strong>${money(subtotal)}</strong><button class="btn secondary" data-remove="${x.id}">Quitar</button></div>`;
      })
      .join("") || "<p>Tu carrito está vacío.</p>"
  }<h2>Total: ${money(total)}</h2><button class="btn" id="confirmar" ${!c.length ? "disabled" : ""}>Confirmar alquiler (demostración)</button></section>`;
  document.querySelectorAll("[data-days]").forEach(
    (el) =>
      (el.onchange = () => {
        let c = getCart(),
          x = c.find((v) => String(v.id) === el.dataset.days);
        x.dias = Math.max(1, Math.min(30, Number(el.value) || 1));
        saveCart(c);
        carrito();
      }),
  );
  document.querySelectorAll("[data-remove]").forEach(
    (el) =>
      (el.onclick = () => {
        saveCart(getCart().filter((x) => String(x.id) !== el.dataset.remove));
        carrito();
      }),
  );
  document.getElementById("confirmar").onclick = () => {
    let h = JSON.parse(localStorage.getItem("sakila-historial") || "[]");
    h.push({ fecha: new Date().toLocaleDateString(), items: c, total });
    localStorage.setItem("sakila-historial", JSON.stringify(h));
    saveCart([]);
    alert("Alquiler registrado en el navegador (no en PostgreSQL).");
    location.hash = "#cuenta";
  };
}

function cuenta() {
  const historial = JSON.parse(
    localStorage.getItem("sakila-historial") || "[]"
  );

  const agrupados = {};

  historial.forEach((alquiler) => {
    alquiler.items.forEach((item) => {
      const id = String(item.id);

      if (!agrupados[id]) {
        agrupados[id] = {
          id: item.id,
          dias: 0
        };
      }

      agrupados[id].dias += Number(item.dias) || 1;
    });
  });

  const registros = Object.values(agrupados);

  app.innerHTML = `
    <section class="wrap">

      <h1>Mi cuenta</h1>

      <p class="muted">
        Historial de alquileres de demostración.
        Los datos se guardan en este navegador.
      </p>

      ${
        registros.map((registro) => {
          const pelicula = peliculas.find(
            (p) => String(p.id_pelicula) === String(registro.id)
          );

          if (!pelicula) return "";

          const total =
            Number(pelicula.tarifa_alquiler) * registro.dias;

          return `
            <div class="item">

              <h3>${esc(pelicula.titulo)}</h3>

              <p>
                Días acumulados:
                <strong>${registro.dias}</strong>
              </p>

              <p>
                Tarifa diaria:
                ${money(pelicula.tarifa_alquiler)}
              </p>

              <h3>
                Total acumulado: ${money(total)}
              </h3>

              <a class="btn secondary"
                 href="#detalle/${pelicula.id_pelicula}">
                Ver película
              </a>

            </div>
          `;
        }).join("") || "<p>Todavía no tienes alquileres.</p>"
      }

    </section>
  `;
}

function route() {
  let hash = location.hash.slice(1) || "inicio";
  if (hash.startsWith("detalle/")) detalle(hash.split("/")[1]);
  else if (hash === "peliculas") catalogo();
  else if (hash === "carrito") carrito();
  else if (hash === "cuenta") cuenta();
  else inicio();
}
async function iniciar() {
  saveCart(getCart());
  try {
    const r = await fetch("/api/peliculas");
    const data = await r.json();
    if (!r.ok) throw Error(data.error || "Error del servidor");
    peliculas = data;
    await cargarImagenesTMDB();
    route();
  } catch (e) {
    app.innerHTML = `<div class="status"><h2>No se pudo cargar el catálogo</h2><p>${esc(e.message)}</p><p>Abre el sitio en <strong>http://localhost:3000</strong> después de iniciar Node.js. Live Server (puerto 5500) no conecta directamente a PostgreSQL.</p></div>`;
  }
}
window.addEventListener("hashchange", route);
iniciar();
