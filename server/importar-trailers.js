
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env")
});

const { Pool } = require("pg");
const readline = require("readline");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "Club Sakila",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD
});

const API_KEY = process.env.TMDB_API_KEY;

const teclado = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function preguntar(texto) {
  return new Promise(resolve => {
    teclado.question(texto, respuesta => {
      resolve(respuesta.trim());
    });
  });
}

async function consultarTMDB(ruta, parametros = {}) {
  const url = new URL("https://api.themoviedb.org/3" + ruta);

  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "es-ES");

  for (const [clave, valor] of Object.entries(parametros)) {
    url.searchParams.set(clave, String(valor));
  }

  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error("Error de TMDB: " + respuesta.status);
  }

  return respuesta.json();
}

async function buscarPeliculas(titulo, anio) {
  const parametros = { query: titulo };

  if (anio && Number.isInteger(Number(anio))) {
    parametros.year = Number(anio);
  }

  const datos = await consultarTMDB(
    "/search/movie",
    parametros
  );

  return (datos.results || []).slice(0, 5);
}

async function buscarTrailers(idTMDB) {
  const idiomas = ["es-ES", "en-US"];
  const encontrados = [];
  const claves = new Set();

  for (const idioma of idiomas) {
    const datos = await consultarTMDB(
      `/movie/${idTMDB}/videos`,
      { language: idioma }
    );

    for (const video of datos.results || []) {
      if (
        video.site !== "YouTube" ||
        video.type !== "Trailer" ||
        !/^[a-zA-Z0-9_-]{11}$/.test(video.key) ||
        claves.has(video.key)
      ) {
        continue;
      }

      claves.add(video.key);

      encontrados.push({
        nombre: video.name,
        idioma: idioma,
        oficial: video.official === true,
        url: "https://www.youtube.com/embed/" + video.key
      });
    }
  }

  encontrados.sort((a, b) => {
    if (a.oficial !== b.oficial) {
      return Number(b.oficial) - Number(a.oficial);
    }

    return idiomas.indexOf(a.idioma) -
      idiomas.indexOf(b.idioma);
  });

  return encontrados;
}

async function importarTrailers() {
  if (!API_KEY) {
    throw new Error("Falta TMDB_API_KEY en .env");
  }

  const resultado = await pool.query(`
    SELECT id_pelicula, titulo, anio_estreno
    FROM public.pelicula
    WHERE trailer_url IS NULL
       OR TRIM(trailer_url) = ''
    ORDER BY id_pelicula
  `);

  const peliculas = resultado.rows;

  console.log("\n==================================");
  console.log("    CINE NOCHE - IMPORTAR TRAILERS");
  console.log("==================================");
  console.log("Peliculas pendientes:", peliculas.length);

  let guardados = 0;

  for (const pelicula of peliculas) {
    console.log("\n----------------------------------");
    console.log("Pelicula:", pelicula.titulo);
    console.log("Anio:", pelicula.anio_estreno);
    console.log("ID PostgreSQL:", pelicula.id_pelicula);

    try {
      const coincidencias = await buscarPeliculas(
        pelicula.titulo,
        pelicula.anio_estreno
      );

      if (coincidencias.length === 0) {
        console.log("No se encontraron coincidencias.");
        continue;
      }

      console.log("\nCoincidencias en TMDB:");

      coincidencias.forEach((p, i) => {
        console.log(
          `${i + 1}. ${p.title} (${p.release_date || "Sin fecha"}) - TMDB: ${p.id}`
        );
      });

      const eleccion = await preguntar(
        "\nNumero de pelicula correcta (0 = omitir): "
      );

      const numero = Number(eleccion);

      if (
        !eleccion ||
        !Number.isInteger(numero) ||
        numero < 1 ||
        numero > coincidencias.length
      ) {
        console.log("Pelicula omitida.");
        continue;
      }

      const seleccionada = coincidencias[numero - 1];

      const trailers = await buscarTrailers(seleccionada.id);

      if (trailers.length === 0) {
        console.log("No se encontraron trailers.");
        continue;
      }

      console.log("\nTrailers disponibles:");

      trailers.forEach((trailer, i) => {
        console.log(`\n${i + 1}. ${trailer.nombre}`);
        console.log("Idioma:", trailer.idioma);
        console.log("Oficial:", trailer.oficial ? "Si" : "No");
        console.log("URL:", trailer.url);
      });

      const respuesta = await preguntar(
        "\nNumero de trailer para guardar (0 = omitir): "
      );

      const opcion = Number(respuesta);

      if (
        !respuesta ||
        !Number.isInteger(opcion) ||
        opcion < 1 ||
        opcion > trailers.length
      ) {
        console.log("Trailer omitido.");
        continue;
      }

      const elegido = trailers[opcion - 1];

      const confirmar = await preguntar(
        `\nGuardar trailer para "${pelicula.titulo}"? (s/n): `
      );

      if (confirmar.toLowerCase() !== "s") {
        console.log("No se guardo.");
        continue;
      }

      const actualizado = await pool.query(
        `UPDATE public.pelicula
         SET trailer_url = $1
         WHERE id_pelicula = $2
           AND (trailer_url IS NULL OR TRIM(trailer_url) = '')
         RETURNING id_pelicula`,
        [elegido.url, pelicula.id_pelicula]
      );

      if (actualizado.rowCount === 1) {
        guardados++;
        console.log("TRAILER GUARDADO CORRECTAMENTE");
      } else {
        console.log("No se actualizo: ya existe un trailer.");
      }

    } catch (error) {
      console.log("Error:", error.message);
      console.log("Continuando con la siguiente pelicula...");
    }
  }

  console.log("\n==================================");
  console.log("PROCESO FINALIZADO");
  console.log("Trailers guardados:", guardados);
  console.log("==================================");
}

importarTrailers()
  .catch(error => console.error("Error general:", error.message))
  .finally(async () => {
    teclado.close();
    await pool.end();
  });
