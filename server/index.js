const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env")
});
const express = require('express');
const {Pool}=require('pg');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app=express();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("Configura un JWT_SECRET seguro en .env");
}

const TMDB_IMG = "https://image.tmdb.org/t/p/";

async function consultarTMDB(ruta, parametros = {}) {
  if (!TMDB_API_KEY) {
    throw new Error("Falta TMDB_API_KEY en .env");
  }

  const url = new URL("https://api.themoviedb.org/3" + ruta);

  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "es-ES");

  for (const [clave, valor] of Object.entries(parametros)) {
    url.searchParams.set(clave, String(valor));
  }

  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error("TMDB respondió con estado " + respuesta.status);
  }

  return respuesta.json();
}
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "Club Sakila",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: 10000
});
app.use(express.json());
app.use(express.static(path.join(__dirname,'..')));
app.get('/api/estado',async(req,res)=>{try{await pool.query('SELECT 1');res.json({ok:true,base:process.env.DB_NAME});}catch(e){res.status(503).json({ok:false,error:'No se pudo conectar a PostgreSQL. Revisa el archivo .env y que el servidor esté encendido.'});}});
app.get('/api/peliculas',async(req,res)=>{try{const {rows}=await pool.query('SELECT id_pelicula,titulo,sinopsis,anio_estreno,clasificacion,duracion,tarifa_alquiler,rating,director,poster_url,trailer_url FROM public.pelicula ORDER BY titulo');res.json(rows);}catch(e){console.error(e);res.status(500).json({error:'No se pudieron consultar las películas. Revisa las columnas de public.pelicula.'});}});
app.get('/api/categorias',async(req,res)=>{try{const {rows}=await pool.query('SELECT id_categoria,nombre FROM public.categoria ORDER BY nombre');res.json(rows);}catch(e){res.status(500).json({error:'No se pudieron consultar las categorías'});}});
app.get('/api/peliculas/:id',async(req,res)=>{const id=Number(req.params.id);if(!Number.isInteger(id))return res.status(400).json({error:'ID inválido'});try{const {rows}=await pool.query('SELECT * FROM public.pelicula WHERE id_pelicula=$1',[id]);if(!rows.length)return res.status(404).json({error:'Película no encontrada'});res.json(rows[0]);}catch(e){res.status(500).json({error:'Error consultando película'});}});

app.get("/api/tmdb/buscar", async (req, res) => {
  try {
    const titulo = String(req.query.titulo || "").trim();
    const anio = Number(req.query.anio);

    if (!titulo || titulo.length > 150) {
      return res.status(400).json({
        error: "Título inválido"
      });
    }

    const parametros = { query: titulo };

    if (Number.isInteger(anio) && anio >= 1888 && anio <= 2100) {
      parametros.year = anio;
    }

    const datos = await consultarTMDB(
      "/search/movie",
      parametros
    );

    const resultados = (datos.results || []).slice(0, 5).map((p) => ({
      tmdb_id: p.id,
      titulo: p.title,
      fecha: p.release_date,
      poster_url: p.poster_path
        ? TMDB_IMG + "w500" + p.poster_path
        : null,
      fondo_url: p.backdrop_path
        ? TMDB_IMG + "w1280" + p.backdrop_path
        : null
    }));

    res.json(resultados);
  } catch (error) {
    console.error("Error buscando en TMDB:", error.message);

    res.status(502).json({
      error: "No se pudo consultar TMDB"
    });
  }
});

app.get("/api/tmdb/reparto/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "ID inválido"
      });
    }

    const datos = await consultarTMDB(
      `/movie/${id}/credits`
    );

    const actores = (datos.cast || []).slice(0, 12).map((a) => ({
      nombre: a.name,
      personaje: a.character,
      foto: a.profile_path
        ? TMDB_IMG + "w185" + a.profile_path
        : null
    }));

    res.json(actores);
  } catch (error) {
    console.error("Error consultando reparto:", error.message);

    res.status(502).json({
      error: "No se pudo obtener el reparto"
    });
  }
});

app.get("/api/peliculas/:id/actores", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "ID de película inválido"
    });
  }

  try {
    const resultado = await pool.query(
      `SELECT
          a.id_actor,
          a.nombre_completo AS nombre,
          pa.personaje,
          a.foto_url AS foto
       FROM public.pelicula_actor pa
       JOIN public.actor a
         ON a.id_actor = pa.id_actor
       WHERE pa.id_pelicula = $1
       ORDER BY pa.orden_reparto ASC NULLS LAST,
         a.nombre_completo ASC`,
      [id]
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error("Error consultando actores:", error);

    res.status(500).json({
      error: "No se pudo consultar el reparto"
    });
  }
});

app.listen(Number(process.env.PORT||3000),()=>console.log('Club Sakila: http://localhost:'+(process.env.PORT||3000)));


app.get("/api/tmdb/trailers/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "ID de TMDB inválido"
    });
  }

  try {
    const idiomas = ["es-ES", "en-US"];
    let videos = [];

    for (const idioma of idiomas) {
      const datos = await consultarTMDB(
        `/movie/${id}/videos`,
        { language: idioma }
      );

      const encontrados = (datos.results || [])
        .filter(video =>
          video.site === "YouTube" &&
          video.type === "Trailer" &&
          typeof video.key === "string" &&
          /^[a-zA-Z0-9_-]{11}$/.test(video.key)
        )
        .map(video => ({
          nombre: video.name,
          idioma: idioma,
          oficial: video.official === true,
          youtube_url: `https://www.youtube.com/watch?v=${video.key}`,
          trailer_url: `https://www.youtube.com/embed/${video.key}`
        }));

      videos.push(...encontrados);
    }

    videos.sort((a, b) =>
      Number(b.oficial) - Number(a.oficial)
    );

    res.json(videos);

  } catch (error) {
    console.error("Error consultando tráilers:", error.message);

    res.status(502).json({
      error: "No se pudieron consultar los tráilers"
    });
  }
});


app.post("/api/alquileres", verificarSesion, async (req, res) => {
  const idPelicula = Number(req.body.id_pelicula);
  const dias = Number(req.body.dias_prestamo);

  if (
    !Number.isSafeInteger(idPelicula) ||
    idPelicula <= 0 ||
    !Number.isSafeInteger(dias) ||
    dias < 1 ||
    dias > 30
  ) {
    return res.status(400).json({
      error: "Selecciona una película y entre 1 y 30 días"
    });
  }

  const cliente = await pool.connect().catch(() => null);

  if (!cliente) {
    return res.status(503).json({
      error: "No se pudo conectar a PostgreSQL"
    });
  }

  try {
    await cliente.query("BEGIN");

    const socio = await cliente.query(
      "SELECT id_socio FROM public.socio WHERE id_socio = $1",
      [req.idSocio]
    );

    if (socio.rows.length === 0) {
      await cliente.query("ROLLBACK");
      return res.status(401).json({
        error: "Tu cuenta no está disponible"
      });
    }

    const pelicula = await cliente.query(
      `SELECT id_pelicula, titulo, tarifa_alquiler
       FROM public.pelicula
       WHERE id_pelicula = $1`,
      [idPelicula]
    );

    if (pelicula.rows.length === 0) {
      await cliente.query("ROLLBACK");
      return res.status(404).json({
        error: "Película no encontrada"
      });
    }

    const tarifa = Number(pelicula.rows[0].tarifa_alquiler);

    if (!Number.isFinite(tarifa) || tarifa < 0) {
      await cliente.query("ROLLBACK");
      return res.status(400).json({
        error: "La película no tiene una tarifa válida"
      });
    }

    const subtotal = Number((tarifa * dias).toFixed(2));

    const alquiler = await cliente.query(
      `INSERT INTO public.alquiler
       (id_socio, fecha_alquiler, costo_total)
       VALUES ($1, CURRENT_DATE, $2)
       RETURNING id_alquiler`,
      [req.idSocio, subtotal]
    );

    const idAlquiler = alquiler.rows[0].id_alquiler;

    await cliente.query(
      `INSERT INTO public.detalle_alquiler
       (id_alquiler, id_pelicula, dias_prestamo,
        tarifa_por_dia, subtotal, fecha_devolucion,
        estado, multa)
       VALUES ($1, $2, $3, $4, $5,
               CURRENT_DATE + $3::integer, $6, $7)`,
      [
        idAlquiler,
        idPelicula,
        dias,
        tarifa,
        subtotal,
        "Activo",
        0
      ]
    );

    await cliente.query("COMMIT");

    res.status(201).json({
      mensaje: "Alquiler registrado correctamente",
      id_alquiler: idAlquiler,
      pelicula: pelicula.rows[0].titulo,
      dias_prestamo: dias,
      tarifa_por_dia: tarifa,
      costo_total: subtotal
    });

  } catch (error) {
    await cliente.query("ROLLBACK").catch(() => {});

    console.error("Error registrando alquiler:", error);

    res.status(500).json({
      error: "No se pudo registrar el alquiler"
    });

  } finally {
    cliente.release();
  }
});

function crearToken(socio) {
  return jwt.sign(
    { id_socio: socio.id_socio },
    JWT_SECRET,
    { expiresIn: "8h", algorithm: "HS256" }
  );
}

function verificarSesion(req, res, next) {
  const autorizacion = req.headers.authorization || "";
  const token = autorizacion.startsWith("Bearer ")
    ? autorizacion.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: "Debes iniciar sesión"
    });
  }

  try {
    const datos = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"]
    });

    req.idSocio = datos.id_socio;
    next();
  } catch {
    return res.status(401).json({
      error: "Tu sesión expiró o no es válida"
    });
  }
}

app.post("/api/auth/registro", async (req, res) => {
  try {
    const nombre = String(req.body.nombre || "").trim();
    const apellido = String(req.body.apellido || "").trim();
    const correo = String(req.body.correo || "").trim().toLowerCase();
    const password = req.body.password;

    if (
      !nombre || nombre.length > 100 ||
      !apellido || apellido.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
      correo.length > 254 ||
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        error: "Revisa tus datos. La contraseña debe tener al menos 8 caracteres."
      });
    }

    const existente = await pool.query(
      "SELECT id_socio FROM public.socio WHERE LOWER(correo) = $1",
      [correo]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({
        error: "Este correo ya está registrado"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const resultado = await pool.query(
      `INSERT INTO public.socio
       (nombre, apellido, correo, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id_socio, nombre, apellido, correo`,
      [nombre, apellido, correo, passwordHash]
    );

    const socio = resultado.rows[0];

    res.status(201).json({
      mensaje: "Cuenta creada correctamente",
      token: crearToken(socio),
      usuario: socio
    });

  } catch (error) {
    console.error("Error registrando usuario:", error);

    res.status(500).json({
      error: "No se pudo crear la cuenta"
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const correo = String(req.body.correo || "").trim().toLowerCase();
    const password = req.body.password;

    if (
      !correo || correo.length > 254 ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Correo o contraseña inválidos"
      });
    }

    const resultado = await pool.query(
      `SELECT id_socio, nombre, apellido, correo, password
       FROM public.socio
       WHERE LOWER(correo) = $1`,
      [correo]
    );

    const socio = resultado.rows[0];

    if (!socio || !socio.password.startsWith("$2")) {
      return res.status(401).json({
        error: "Correo o contraseña incorrectos"
      });
    }

    const correcta = await bcrypt.compare(
      password,
      socio.password
    );

    if (!correcta) {
      return res.status(401).json({
        error: "Correo o contraseña incorrectos"
      });
    }

    res.json({
      mensaje: "Sesión iniciada correctamente",
      token: crearToken(socio),
      usuario: {
        id_socio: socio.id_socio,
        nombre: socio.nombre,
        apellido: socio.apellido,
        correo: socio.correo
      }
    });

  } catch (error) {
    console.error("Error iniciando sesión:", error);

    res.status(500).json({
      error: "No se pudo iniciar sesión"
    });
  }
});

app.get("/api/auth/yo", verificarSesion, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id_socio, nombre, apellido, correo
       FROM public.socio
       WHERE id_socio = $1`,
      [req.idSocio]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        error: "Usuario no encontrado"
      });
    }

    res.json(resultado.rows[0]);

  } catch (error) {
    console.error("Error consultando usuario:", error);

    res.status(500).json({
      error: "No se pudo consultar tu cuenta"
    });
  }
});


app.get("/api/mis-alquileres", verificarSesion, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
         a.id_alquiler,
         a.fecha_alquiler,
         a.costo_total,
         p.id_pelicula,
         p.titulo,
         p.poster_url,
         d.dias_prestamo,
         d.tarifa_por_dia,
         d.subtotal,
         d.fecha_devolucion,
         d.estado
       FROM public.alquiler a
       INNER JOIN public.detalle_alquiler d
         ON a.id_alquiler = d.id_alquiler
       INNER JOIN public.pelicula p
         ON d.id_pelicula = p.id_pelicula
       WHERE a.id_socio = $1
       ORDER BY a.fecha_alquiler DESC, a.id_alquiler DESC`,
      [req.idSocio]
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error("Error consultando alquileres:", error);

    res.status(500).json({
      error: "No se pudieron consultar tus alquileres"
    });
  }
});

