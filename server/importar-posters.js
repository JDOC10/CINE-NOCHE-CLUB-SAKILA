
require("dotenv").config();

const { Pool } = require("pg");
const readline = require("readline");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "Club Sakila",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function preguntar(texto) {
  return new Promise(resolve => rl.question(texto, resolve));
}

async function buscarTMDB(titulo, anio) {
  const url = new URL("https://api.themoviedb.org/3/search/movie");

  url.searchParams.set("api_key", process.env.TMDB_API_KEY);
  url.searchParams.set("language", "es-ES");
  url.searchParams.set("query", titulo);

  if (anio) {
    url.searchParams.set("year", String(anio));
  }

  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error("Error de TMDB: " + respuesta.status);
  }

  const datos = await respuesta.json();
  return (datos.results || []).slice(0, 8);
}

async function iniciar() {
  if (!process.env.TMDB_API_KEY) {
    throw new Error("Falta TMDB_API_KEY en el archivo .env");
  }

  const resultado = await pool.query(`
    SELECT id_pelicula, titulo, anio_estreno
    FROM public.pelicula
    WHERE poster_url IS NULL
       OR TRIM(poster_url) = ''
    ORDER BY titulo
  `);

  console.log("\nPelículas sin póster:", resultado.rows.length);

  for (const pelicula of resultado.rows) {
    console.log("\n------------------------------");
    console.log(pelicula.titulo, "(" + pelicula.anio_estreno + ")");

    try {
      let resultados = await buscarTMDB(
        pelicula.titulo,
        pelicula.anio_estreno
      );

      if (!resultados.length) {
        resultados = await buscarTMDB(pelicula.titulo, null);
      }

      if (!resultados.length) {
        console.log("No se encontraron resultados.");
        continue;
      }

      resultados.forEach((p, i) => {
        console.log(
          `${i + 1}. ${p.title} (${p.release_date || "Sin fecha"}) [TMDB: ${p.id}] ${p.poster_path ? "Con póster" : "Sin póster"}`
        );
      });

      console.log("0. Omitir esta película");

      const opcion = Number(
        await preguntar("Elige la película correcta: ")
      );

      if (
        !Number.isInteger(opcion) ||
        opcion < 1 ||
        opcion > resultados.length
      ) {
        console.log("Película omitida.");
        continue;
      }

      const elegida = resultados[opcion - 1];

      if (!elegida.poster_path) {
        console.log("Este resultado no tiene póster.");
        continue;
      }

      const posterUrl =
        "https://image.tmdb.org/t/p/w500" +
        elegida.poster_path;

      console.log("Seleccionaste:", elegida.title);

      const confirmar = (
        await preguntar("¿Guardar este póster? (s/n): ")
      ).trim().toLowerCase();

      if (confirmar !== "s") {
        console.log("No se guardó.");
        continue;
      }

      await pool.query(
        `UPDATE public.pelicula
         SET poster_url = $1
         WHERE id_pelicula = $2`,
        [posterUrl, pelicula.id_pelicula]
      );

      console.log("Póster guardado correctamente.");

    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  console.log("\nProceso finalizado.");
}

iniciar()
  .catch(error => console.error(error.message))
  .finally(async () => {
    rl.close();
    await pool.end();
  });
