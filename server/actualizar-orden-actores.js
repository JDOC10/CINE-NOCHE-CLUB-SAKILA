
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env")
});

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "Club Sakila",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD
});

const API_KEY = process.env.TMDB_API_KEY;

// Solo películas cuyo reparto ya fue importado y confirmado.
const peliculas = [
  { id: 299534, titulo: "Avengers: Endgame" },
  { id: 920, titulo: "Cars" }
];

async function actualizarOrden() {
  if (!API_KEY) {
    throw new Error("Falta TMDB_API_KEY en .env");
  }

  for (const pelicula of peliculas) {
    try {
      const url = new URL(
        `https://api.themoviedb.org/3/movie/${pelicula.id}/credits`
      );

      url.searchParams.set("api_key", API_KEY);
      url.searchParams.set("language", "es-ES");

      const respuesta = await fetch(url);

      if (!respuesta.ok) {
        throw new Error("TMDB: " + respuesta.status);
      }

      const datos = await respuesta.json();

      const resultado = await pool.query(
        `SELECT id_pelicula
         FROM public.pelicula
         WHERE titulo = $1`,
        [pelicula.titulo]
      );

      if (resultado.rows.length !== 1) {
        console.log(
          "Película no encontrada o duplicada:",
          pelicula.titulo
        );
        continue;
      }

      const idPelicula = resultado.rows[0].id_pelicula;
      let actualizados = 0;

      for (const actor of datos.cast || []) {
        if (!Number.isInteger(actor.order)) continue;

        const cambio = await pool.query(
          `UPDATE public.pelicula_actor pa
           SET orden_reparto = $1
           FROM public.actor a
           WHERE pa.id_actor = a.id_actor
             AND pa.id_pelicula = $2
             AND a.tmdb_id = $3`,
          [actor.order, idPelicula, actor.id]
        );

        actualizados += cambio.rowCount;
      }

      console.log(
        `${pelicula.titulo}: ${actualizados} actores ordenados.`
      );

    } catch (error) {
      console.error(
        "Error en",
        pelicula.titulo,
        error.message
      );
    }
  }
}

actualizarOrden()
  .catch(error => console.error(error.message))
  .finally(async () => {
    await pool.end();
  });

  