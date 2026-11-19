
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env")
});

const { Pool } = require("pg");
const readline = require("readline/promises");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "Club Sakila",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD
});

const teclado = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_KEY = process.env.TMDB_API_KEY;

async function tmdb(ruta, parametros = {}) {
  const url = new URL(
    "https://api.themoviedb.org/3" + ruta
  );

  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "es-ES");

  for (const [clave, valor] of Object.entries(parametros)) {
    url.searchParams.set(clave, String(valor));
  }

  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error("TMDB: " + respuesta.status);
  }

  return respuesta.json();
}

async function guardarReparto(pelicula, tmdbId) {
  const datos = await tmdb(
    `/movie/${tmdbId}/credits`
  );

  const reparto = datos.cast || [];
  const cliente = await pool.connect();

  let guardados = 0;

  try {
    await cliente.query("BEGIN");

    for (const actor of reparto) {
      if (!actor.id || !actor.name) continue;

      const foto = actor.profile_path
        ? "https://image.tmdb.org/t/p/w185" +
          actor.profile_path
        : null;

      let resultado = await cliente.query(
        `SELECT id_actor
         FROM public.actor
         WHERE tmdb_id = $1`,
        [actor.id]
      );

      let idActor;

      if (resultado.rows.length) {
        idActor = resultado.rows[0].id_actor;

        await cliente.query(
          `UPDATE public.actor
           SET foto_url = COALESCE($1, foto_url)
           WHERE id_actor = $2`,
          [foto, idActor]
        );
      } else {
        resultado = await cliente.query(
          `SELECT id_actor
           FROM public.actor
           WHERE LOWER(TRIM(nombre_completo)) =
                 LOWER(TRIM($1))
             AND tmdb_id IS NULL
           ORDER BY id_actor
           LIMIT 1`,
          [actor.name]
        );

        if (resultado.rows.length) {
          idActor = resultado.rows[0].id_actor;

          await cliente.query(
            `UPDATE public.actor
             SET tmdb_id = $1,
                 foto_url = COALESCE($2, foto_url)
             WHERE id_actor = $3`,
            [actor.id, foto, idActor]
          );
        } else {
          resultado = await cliente.query(
            `INSERT INTO public.actor
             (nombre_completo, tmdb_id, foto_url)
             VALUES ($1, $2, $3)
             RETURNING id_actor`,
            [actor.name, actor.id, foto]
          );

          idActor = resultado.rows[0].id_actor;
        }
      }

      resultado = await cliente.query(
        `SELECT 1
         FROM public.pelicula_actor
         WHERE id_pelicula = $1
           AND id_actor = $2`,
        [pelicula.id_pelicula, idActor]
      );

      if (resultado.rows.length) {
        await cliente.query(
          `UPDATE public.pelicula_actor
           SET personaje = $1
           WHERE id_pelicula = $2
             AND id_actor = $3`,
          [
            actor.character || null,
            pelicula.id_pelicula,
            idActor
          ]
        );
      } else {
        await cliente.query(
          `INSERT INTO public.pelicula_actor
           (id_pelicula, id_actor, personaje)
           VALUES ($1, $2, $3)`,
          [
            pelicula.id_pelicula,
            idActor,
            actor.character || null
          ]
        );
      }

      guardados++;
    }

    await cliente.query("COMMIT");

    console.log(
      `Guardados ${guardados} registros de reparto.`
    );

  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

async function iniciar() {
  if (!API_KEY) {
    throw new Error(
      "Falta TMDB_API_KEY en el archivo .env"
    );
  }

  const resultado = await pool.query(
    `SELECT id_pelicula, titulo, anio_estreno
     FROM public.pelicula
     ORDER BY titulo`
  );

  console.log(
    "\nPELÍCULAS REGISTRADAS:",
    resultado.rows.length
  );

  for (const pelicula of resultado.rows) {
    console.log(
      "\n----------------------------------"
    );

    console.log(
      pelicula.titulo,
      "(" + pelicula.anio_estreno + ")"
    );

    try {
      const busqueda = await tmdb(
        "/search/movie",
        { query: pelicula.titulo }
      );

      const opciones = (busqueda.results || [])
        .slice(0, 8);

      if (!opciones.length) {
        console.log("No se encontraron resultados.");
        continue;
      }

      opciones.forEach((opcion, indice) => {
        console.log(
          `${indice + 1}. ${opcion.title} ` +
          `(${opcion.release_date || "Sin fecha"}) ` +
          `[TMDB: ${opcion.id}]`
        );
      });

      console.log("0. Omitir esta película");

      const respuesta = await teclado.question(
        "Elige la película correcta (0-8): "
      );

      const seleccion = Number(respuesta);

      if (
        !Number.isInteger(seleccion) ||
        seleccion < 1 ||
        seleccion > opciones.length
      ) {
        console.log("Película omitida.");
        continue;
      }

      const elegida = opciones[seleccion - 1];

      const confirmar = await teclado.question(
        `¿Importar TODO el reparto de ` +
        `"${elegida.title}"? (s/n): `
      );

      if (confirmar.toLowerCase() !== "s") {
        console.log("Importación cancelada.");
        continue;
      }

      await guardarReparto(
        pelicula,
        elegida.id
      );

    } catch (error) {
      console.error(
        "Error en",
        pelicula.titulo,
        error.message
      );
    }
  }

  console.log("\nImportación finalizada.");
}

iniciar()
  .catch((error) => {
    console.error(error.message);
  })
  .finally(async () => {
    teclado.close();
    await pool.end();
  });
