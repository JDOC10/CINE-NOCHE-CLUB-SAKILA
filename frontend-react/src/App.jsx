
import { useEffect, useState, useRef } from "react";
import {
  enviarCorreoBienvenida,
  enviarCorreoAlquiler
} from "./emailjs";

import "./App.css";
import "./Auth.css";
import "./CineAvanzado.css";

/* ==========================================
   FUNCIONES PARA LOS TRAILERES
   ========================================== */

function obtenerIdYouTube(url) {
  if (!url) return "";

  try {
    const direccion = new URL(url);
    const dominio = direccion.hostname.toLowerCase();

    if (dominio.includes("youtu.be")) {
      return direccion.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (
      dominio.includes("youtube.com") ||
      dominio.includes("youtube-nocookie.com")
    ) {
      if (direccion.pathname === "/watch") {
        return direccion.searchParams.get("v") || "";
      }

      if (
        direccion.pathname.startsWith("/embed/") ||
        direccion.pathname.startsWith("/shorts/")
      ) {
        return direccion.pathname.split("/")[2] || "";
      }
    }
  } catch (error) {
    return "";
  }

  return "";
}

function crearUrlTrailerFondo(url) {
  const id = obtenerIdYouTube(url);

  if (!id) return "";

  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&modestbranding=1`;
}

function crearUrlTrailerOficial(url) {
  const id = obtenerIdYouTube(url);

  if (!id) return "";

  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
}

function App() {
  const [peliculas, setPeliculas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [ordenPeliculas, setOrdenPeliculas] = useState("destacadas");
  const [soloConTrailer, setSoloConTrailer] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [paginaActual, setPaginaActual] = useState(
    window.location.hash === "#peliculas" ? "peliculas" : "inicio"
  );

  const [peliculaSeleccionada, setPeliculaSeleccionada] = useState(null);
  const [actores, setActores] = useState([]);
  const [cargandoActores, setCargandoActores] = useState(false);
  const [verTodos, setVerTodos] = useState(false);
  const [mostrarTrailer, setMostrarTrailer] = useState(false);

  const trailerRef = useRef(null);

  const [token, setToken] = useState(
    () => localStorage.getItem("cine_token") || ""
  );
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(Boolean(token));
  const [mostrarAuth, setMostrarAuth] = useState(false);
  const [modoAuth, setModoAuth] = useState("login");
  const [mostrarCuenta, setMostrarCuenta] = useState(false);
  const [misAlquileres, setMisAlquileres] = useState([]);
  const [cargandoMisAlquileres, setCargandoMisAlquileres] = useState(false);
  const [errorMisAlquileres, setErrorMisAlquileres] = useState("");

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [errorAuth, setErrorAuth] = useState("");
  const [procesandoAuth, setProcesandoAuth] = useState(false);

  const [mostrarAlquiler, setMostrarAlquiler] = useState(false);
  const [diasPrestamo, setDiasPrestamo] = useState(1);
  const [procesandoAlquiler, setProcesandoAlquiler] = useState(false);
  const [errorAlquiler, setErrorAlquiler] = useState("");
  const [alquilerExitoso, setAlquilerExitoso] = useState(null);

  /* ==========================================
     CARGAR PELICULAS
     ========================================== */

  useEffect(() => {
    fetch("/api/peliculas")
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("No se pudo cargar el catálogo");
        return respuesta.json();
      })
      .then((datos) => setPeliculas(datos))
      .catch(() => setError("No se pudo conectar con el servidor."))
      .finally(() => setCargando(false));
  }, []);

  /* ==========================================
     VERIFICAR SESION
     ========================================== */

  useEffect(() => {
    if (!token) {
      setUsuario(null);
      setCargandoSesion(false);
      return;
    }

    let activo = true;
    setCargandoSesion(true);

    fetch("/api/auth/yo", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (respuesta) => {
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.error || "Sesión inválida");
        return datos;
      })
      .then((datos) => {
        if (activo) setUsuario(datos.usuario || datos);
      })
      .catch(() => {
        if (activo) {
          localStorage.removeItem("cine_token");
          setToken("");
          setUsuario(null);
        }
      })
      .finally(() => {
        if (activo) setCargandoSesion(false);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  /* ==========================================
     NAVEGACION
     ========================================== */

  useEffect(() => {
    const actualizarPagina = () => {
      const hash = window.location.hash;

      if (hash === "#inicio" || hash === "#peliculas") {
        setPaginaActual(hash.slice(1));
        setMostrarCuenta(false);
        setPeliculaSeleccionada(null);
        setMostrarTrailer(false);
        setMostrarAlquiler(false);
      }
    };

    window.addEventListener("hashchange", actualizarPagina);

    return () => window.removeEventListener("hashchange", actualizarPagina);
  }, []);

  function irInicio() {
    setMostrarCuenta(false);
    setPeliculaSeleccionada(null);
    setMostrarTrailer(false);
    setMostrarAlquiler(false);
    setPaginaActual("inicio");
    window.location.hash = "inicio";
    window.scrollTo(0, 0);
  }

  function irPeliculas() {
    setMostrarCuenta(false);
    setPeliculaSeleccionada(null);
    setMostrarTrailer(false);
    setMostrarAlquiler(false);
    setPaginaActual("peliculas");
    window.location.hash = "peliculas";
    window.scrollTo(0, 0);
  }

  /* ==========================================
     DETALLES Y ACTORES
     ========================================== */

  async function abrirDetalles(pelicula) {
    setPeliculaSeleccionada(pelicula);
    setActores([]);
    setVerTodos(false);
    setMostrarTrailer(false);
    setMostrarAlquiler(false);
    setMostrarCuenta(false);
    setCargandoActores(true);

    window.scrollTo(0, 0);

    try {
      const respuesta = await fetch(
        `/api/peliculas/${pelicula.id_pelicula}/actores`
      );

      if (!respuesta.ok) throw new Error("Error cargando actores");

      setActores(await respuesta.json());
    } catch (error) {
      console.error(error);
      setActores([]);
    } finally {
      setCargandoActores(false);
    }
  }

  function volverCatalogo() {
    setPeliculaSeleccionada(null);
    setMostrarTrailer(false);
    setMostrarAlquiler(false);
    setMostrarCuenta(false);
    setActores([]);
    setPaginaActual("peliculas");
    window.location.hash = "peliculas";
    window.scrollTo(0, 0);
  }

  /* ==========================================
     PANTALLA COMPLETA DEL TRAILER
     ========================================== */

  function verTrailerPantallaCompleta() {
    const contenedor = trailerRef.current;

    if (!contenedor) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch((error) => {
        console.error("No se pudo salir de pantalla completa:", error);
      });
      return;
    }

    if (contenedor.requestFullscreen) {
      contenedor.requestFullscreen().catch((error) => {
        console.error("No se pudo activar pantalla completa:", error);
      });
    }
  }

  /* ==========================================
     AUTENTICACION
     ========================================== */

  function abrirAuth(modo = "login") {
    setModoAuth(modo);
    setMostrarAuth(true);
    setErrorAuth("");
    setNombre("");
    setApellido("");
    setCorreo("");
    setPassword("");
  }

  function cerrarAuth() {
    if (procesandoAuth) return;
    setMostrarAuth(false);
    setErrorAuth("");
  }

  async function enviarAuth(evento) {
    evento.preventDefault();

    if (procesandoAuth) return;

    setErrorAuth("");
    setProcesandoAuth(true);

    try {
      const esRegistro = modoAuth === "registro";
      const ruta = esRegistro ? "/api/auth/registro" : "/api/auth/login";

      const datosEnviar = esRegistro
        ? {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            correo: correo.trim().toLowerCase(),
            password
          }
        : {
            correo: correo.trim().toLowerCase(),
            password
          };

      const respuesta = await fetch(ruta, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosEnviar)
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo completar la operación.");
      }

      if (!datos.token) {
        throw new Error("El servidor no devolvió un token de sesión.");
      }

      localStorage.setItem("cine_token", datos.token);
      setToken(datos.token);
      setMostrarAuth(false);
      setErrorAuth("");
      setPassword("");

      if (esRegistro) {
        try {
          await enviarCorreoBienvenida({
            nombre: datosEnviar.nombre,
            apellido: datosEnviar.apellido,
            correo: datosEnviar.correo
          });

          console.log("Correo de bienvenida enviado correctamente.");
        } catch (errorCorreo) {
          console.error("ERROR AL ENVIAR BIENVENIDA:", errorCorreo);

          alert(
            "Tu cuenta se creó correctamente, pero no se pudo enviar el correo. Revisa la consola del navegador."
          );
        }
      }
    } catch (error) {
      console.error("Error de autenticación:", error);
      setErrorAuth(error.message);
    } finally {
      setProcesandoAuth(false);
    }
  }

  function cerrarSesion() {
    localStorage.removeItem("cine_token");
    setToken("");
    setUsuario(null);
    setMostrarCuenta(false);
    setMostrarAlquiler(false);
    volverCatalogo();
  }

  /* ==========================================
     MI CUENTA E HISTORIAL
     ========================================== */

  async function cargarMisAlquileres() {
    if (!token) return;

    setCargandoMisAlquileres(true);
    setErrorMisAlquileres("");

    try {
      const respuesta = await fetch("/api/mis-alquileres", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudieron cargar tus alquileres.");
      }

      const lista = Array.isArray(datos)
        ? datos
        : Array.isArray(datos.alquileres)
          ? datos.alquileres
          : null;

      if (!lista) {
        throw new Error("El servidor devolvió un formato inesperado.");
      }

      setMisAlquileres(lista);
    } catch (error) {
      setErrorMisAlquileres(error.message);
    } finally {
      setCargandoMisAlquileres(false);
    }
  }

  function abrirCuenta() {
    if (!usuario) {
      abrirAuth("login");
      return;
    }

    setMostrarCuenta(true);
    setPeliculaSeleccionada(null);
    setMostrarTrailer(false);
    cargarMisAlquileres();
    window.scrollTo(0, 0);
  }

  /* ==========================================
     ALQUILERES
     ========================================== */

  function abrirAlquiler() {
    if (cargandoSesion) return;

    if (!usuario || !token) {
      abrirAuth("login");
      return;
    }

    setMostrarAlquiler(true);
    setDiasPrestamo(1);
    setErrorAlquiler("");
    setAlquilerExitoso(null);
  }

  function cerrarAlquiler() {
    if (procesandoAlquiler) return;
    setMostrarAlquiler(false);
    setErrorAlquiler("");
  }

  const tarifa = Number(peliculaSeleccionada?.tarifa_alquiler);
  const tarifaValida = Number.isFinite(tarifa) && tarifa >= 0;
  const total = tarifaValida ? tarifa * diasPrestamo : 0;

  async function confirmarAlquiler(evento) {
    evento.preventDefault();

    if (procesandoAlquiler) return;

    if (!token || !usuario) {
      setErrorAlquiler("Debes iniciar sesión.");
      return;
    }

    if (
      !Number.isInteger(diasPrestamo) ||
      diasPrestamo < 1 ||
      diasPrestamo > 30
    ) {
      setErrorAlquiler("Selecciona entre 1 y 30 días.");
      return;
    }

    if (!tarifaValida) {
      setErrorAlquiler("La película no tiene una tarifa válida.");
      return;
    }

    setProcesandoAlquiler(true);
    setErrorAlquiler("");

    try {
      const respuesta = await fetch("/api/alquileres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id_pelicula: peliculaSeleccionada.id_pelicula,
          dias_prestamo: diasPrestamo
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo registrar el alquiler.");
      }

      setAlquilerExitoso(datos);

      try {
        await enviarCorreoAlquiler({
          nombre: usuario.nombre || "",
          correo: usuario.correo || "",
          pelicula:
            datos.pelicula ||
            datos.titulo ||
            peliculaSeleccionada.titulo,
          id_alquiler: datos.id_alquiler ?? datos.id ?? "",
          dias_prestamo: datos.dias_prestamo ?? diasPrestamo,
          tarifa: tarifa.toFixed(2),
          total: Number(
            datos.costo_total ?? datos.subtotal ?? total
          ).toFixed(2)
        });

        console.log("Correo de confirmación enviado correctamente.");
      } catch (errorCorreo) {
        console.error("No se pudo enviar el correo de alquiler:", errorCorreo);
      }
    } catch (error) {
      setErrorAlquiler(error.message);
    } finally {
      setProcesandoAlquiler(false);
    }
  }

  /* ==========================================
     FILTROS DEL CATALOGO
     ========================================== */

  const peliculasFiltradas = peliculas
    .filter((pelicula) => {
      const titulo = String(pelicula.titulo || "").toLowerCase();
      const coincideBusqueda = titulo.includes(busqueda.trim().toLowerCase());
      const coincideTrailer =
        !soloConTrailer || Boolean(pelicula.trailer_url);

      return coincideBusqueda && coincideTrailer;
    })
    .sort((a, b) => {
      if (ordenPeliculas === "titulo") {
        return a.titulo.localeCompare(b.titulo, "es");
      }

      if (ordenPeliculas === "recientes") {
        return Number(b.anio_estreno) - Number(a.anio_estreno);
      }

      if (ordenPeliculas === "precio-menor") {
        return Number(a.tarifa_alquiler) - Number(b.tarifa_alquiler);
      }

      if (ordenPeliculas === "precio-mayor") {
        return Number(b.tarifa_alquiler) - Number(a.tarifa_alquiler);
      }

      return 0;
    });

  const peliculaDestacada = peliculas[0] || null;

  const peliculasRecientes = [...peliculas]
    .sort(
      (a, b) =>
        Number(b.anio_estreno || 0) - Number(a.anio_estreno || 0)
    )
    .slice(0, 8);

  const peliculasConTrailer = peliculas
    .filter((pelicula) => Boolean(pelicula.trailer_url))
    .slice(0, 8);

  const otrasPeliculas = peliculas.filter(
    (pelicula) =>
      pelicula.id_pelicula !== peliculaDestacada?.id_pelicula
  );

  /* ==========================================
     FILAS DE PELICULAS
     ========================================== */

  function renderFila(titulo, subtitulo, lista, etiqueta) {
    if (!lista.length) return null;

    return (
      <section className="stream-seccion">
        <div className="stream-seccion-cabecera">
          <div>
            <span className="stream-mini-etiqueta">{etiqueta}</span>
            <h2>{titulo}</h2>
            <p>{subtitulo}</p>
          </div>

          <button onClick={irPeliculas} className="stream-ver-todo">
            Ver catálogo <span>→</span>
          </button>
        </div>

        <div className="stream-fila">
          {lista.map((pelicula) => (
            <button
              type="button"
              className="stream-card"
              key={pelicula.id_pelicula}
              onClick={() => abrirDetalles(pelicula)}
            >
              <div className="stream-card-imagen">
                {pelicula.poster_url ? (
                  <img
                    src={pelicula.poster_url}
                    alt={pelicula.titulo}
                    loading="lazy"
                  />
                ) : (
                  <div className="stream-poster-vacio">🎬</div>
                )}

                <span className="stream-card-play">▶</span>

                {pelicula.trailer_url && (
                  <span className="stream-card-insignia">TRÁILER</span>
                )}
              </div>

              <div className="stream-card-texto">
                <h3>{pelicula.titulo}</h3>
                <p>
                  {pelicula.anio_estreno || "Año no disponible"}
                  {pelicula.duracion
                    ? ` · ${pelicula.duracion} min`
                    : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  /* ==========================================
     INTERFAZ PRINCIPAL
     ========================================== */

  return (
    <div className="cine-app">

      {/* HEADER */}

      <header className="cine-header">
        <button
          className="cine-marca"
          onClick={irInicio}
          aria-label="CINE NOCHE - CLUB SAKILA, inicio"
        >
          <span className="cine-marca-icono">▶</span>

          <span className="cine-marca-texto">
            <span>CINE NOCHE</span>
            <small>CLUB SAKILA</small>
          </span>
        </button>

        <nav className="cine-navegacion">
          <button
            className={`cine-nav-link ${
              paginaActual === "inicio" &&
              !mostrarCuenta &&
              !peliculaSeleccionada
                ? "activo"
                : ""
            }`}
            onClick={irInicio}
          >
            Inicio
          </button>

          <button
            className={`cine-nav-link ${
              paginaActual === "peliculas" &&
              !mostrarCuenta &&
              !peliculaSeleccionada
                ? "activo"
                : ""
            }`}
            onClick={irPeliculas}
          >
            Películas
          </button>

          {cargandoSesion ? (
            <span className="cine-sesion-cargando">Verificando...</span>
          ) : usuario ? (
            <>
              <button className="auth-nav-boton" onClick={abrirCuenta}>
                Mi cuenta
              </button>

              <button
                className="auth-nav-boton auth-salir"
                onClick={cerrarSesion}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <button
                className="auth-nav-boton"
                onClick={() => abrirAuth("login")}
              >
                Iniciar sesión
              </button>

              <button
                className="auth-nav-boton auth-registro-nav"
                onClick={() => abrirAuth("registro")}
              >
                Registrarse
              </button>
            </>
          )}
        </nav>
      </header>

      {/* MI CUENTA */}

      {mostrarCuenta && usuario ? (
        <main className="auth-cuenta-pagina">
          <button className="cine-boton" onClick={volverCatalogo}>
            ← Volver al catálogo
          </button>

          <section className="auth-cuenta-tarjeta">
            <div className="auth-avatar">
              {usuario.nombre?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <h2>Mi cuenta</h2>

            <p className="auth-bienvenida">
              Bienvenido a CINE NOCHE - CLUB SAKILA
            </p>

            <div className="auth-dato">
              <strong>Nombre</strong>
              <span>{usuario.nombre} {usuario.apellido}</span>
            </div>

            <div className="auth-dato">
              <strong>Correo electrónico</strong>
              <span>{usuario.correo}</span>
            </div>

            <p className="auth-nota">
              Tu cuenta está vinculada a tu registro de socio.
              No necesitas introducir ningún ID para alquilar.
            </p>

            <div className="mis-alquileres">
              <h3>🎟 Mis alquileres</h3>

              {cargandoMisAlquileres && (
                <p>Cargando tus alquileres...</p>
              )}

              {errorMisAlquileres && (
                <p className="cine-error">{errorMisAlquileres}</p>
              )}

              {!cargandoMisAlquileres &&
                !errorMisAlquileres &&
                misAlquileres.length === 0 && (
                  <p>Todavía no tienes alquileres registrados.</p>
                )}

              {!cargandoMisAlquileres &&
                !errorMisAlquileres &&
                misAlquileres.map((alquiler) => (
                  <div
                    className="auth-dato alquiler-historial-item"
                    key={alquiler.id_detalle ?? alquiler.id_alquiler}
                  >
                    <strong>
                      🎬 {alquiler.pelicula || alquiler.titulo}
                    </strong>

                    <span>
                      Número de alquiler: {alquiler.id_alquiler}
                    </span>

                    <span>
                      Fecha:{" "}
                      {alquiler.fecha_alquiler
                        ? new Date(alquiler.fecha_alquiler).toLocaleDateString(
                            "es-BO",
                            { timeZone: "UTC" }
                          )
                        : "No disponible"}
                    </span>

                    <span>Días: {alquiler.dias_prestamo}</span>

                    <span>
                      Total: Bs.{" "}
                      {Number(
                        alquiler.subtotal ?? alquiler.costo_total ?? 0
                      ).toFixed(2)}
                    </span>

                    <span>
                      Estado: {alquiler.estado || "Sin estado"}
                    </span>
                  </div>
                ))}
            </div>

            <button className="cine-boton" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </section>
        </main>

      ) : peliculaSeleccionada ? (

        <main className="cine-detalle">

          <button
            className="cine-boton cine-volver"
            onClick={volverCatalogo}
          >
            ← Volver al catálogo
          </button>

          
<section className="detalle-principal detalle-cinematografico">
  {/* TRAILER DE FONDO A PANTALLA COMPLETA */}

  {crearUrlTrailerFondo(peliculaSeleccionada.trailer_url) && (
    <div className="detalle-video-fondo">
      <iframe
        src={crearUrlTrailerFondo(peliculaSeleccionada.trailer_url)}
        title={`Tráiler de fondo de ${peliculaSeleccionada.titulo}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )}

  {/* CAPA OSCURA PARA MEJORAR LA VISIBILIDAD */}

  <div className="detalle-video-degradado" />

  {/* CONTENIDO: POSTER A LA IZQUIERDA E INFORMACION A LA DERECHA */}

  <div className="detalle-contenido-layout">

    <div className="detalle-poster">
      {peliculaSeleccionada.poster_url ? (
        <img
          src={peliculaSeleccionada.poster_url}
          alt={`Póster de ${peliculaSeleccionada.titulo}`}
        />
      ) : (
        <div className="detalle-poster-vacio">🎬</div>
      )}
    </div>

    <div className="detalle-informacion">
      <span className="stream-mini-etiqueta">
        CINE NOCHE - CLUB SAKILA ORIGINAL
      </span>

      <h2>{peliculaSeleccionada.titulo}</h2>

      <p className="detalle-metadatos">
        {peliculaSeleccionada.anio_estreno} ·{" "}
        {peliculaSeleccionada.duracion} min ·{" "}
        {peliculaSeleccionada.clasificacion}
      </p>

      <p className="detalle-rating">
        ⭐ {peliculaSeleccionada.rating || "Sin calificación"}
      </p>

      <h3>Sinopsis</h3>

      <p>{peliculaSeleccionada.sinopsis}</p>

      <p>
        <strong>Director:</strong>{" "}
        {peliculaSeleccionada.director}
      </p>

      <p>
        <strong>Precio:</strong> Bs.{" "}
        {peliculaSeleccionada.tarifa_alquiler} por día
      </p>

      <div className="detalle-acciones">
        <button
          className="cine-boton"
          onClick={abrirAlquiler}
          disabled={cargandoSesion}
        >
          🎟 Alquilar película
        </button>

        {peliculaSeleccionada.trailer_url && (
          <button
            className="cine-boton cine-boton-secundario"
            onClick={() => setMostrarTrailer(!mostrarTrailer)}
          >
            {mostrarTrailer ? "✕ Cerrar tráiler" : "▶ Ver tráiler"}
          </button>
        )}
      </div>

      <div className="detalle-aviso-trailer">
        {crearUrlTrailerFondo(peliculaSeleccionada.trailer_url)
          ? "▶ TRÁILER REPRODUCIÉNDOSE · AUDIO DESACTIVADO"
          : "🎬 DESCUBRE ESTA PELÍCULA"}
      </div>
    </div>
  </div>
</section>


          {/* TRAILER OFICIAL CON PANTALLA COMPLETA */}

          {mostrarTrailer && peliculaSeleccionada.trailer_url && (
            <section className="detalle-trailer">
              <div className="trailer-encabezado">
                <div>
                  <span className="stream-mini-etiqueta">
                    CINE NOCHE - CLUB SAKILA
                  </span>

                  <h2>Tráiler oficial</h2>

                  <p>{peliculaSeleccionada.titulo}</p>
                </div>

                <button
                  type="button"
                  className="trailer-pantalla-completa"
                  onClick={verTrailerPantallaCompleta}
                >
                  ⛶ Ver en pantalla completa
                </button>
              </div>

              <div className="trailer-contenedor" ref={trailerRef}>
                <iframe
                  src={crearUrlTrailerOficial(
                    peliculaSeleccionada.trailer_url
                  )}
                  title={`Tráiler de ${peliculaSeleccionada.titulo}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* REPARTO */}

          <section className="detalle-reparto">
            <div className="stream-seccion-cabecera">
              <div>
                <span className="stream-mini-etiqueta">ELENCO</span>
                <h2>Reparto de la película</h2>
              </div>
            </div>

            {cargandoActores && <p>Cargando actores...</p>}

            {!cargandoActores && actores.length === 0 && (
              <p>Todavía no hay actores registrados.</p>
            )}

            <div className="reparto-grid">
              {(verTodos ? actores : actores.slice(0, 12)).map((actor) => (
                <article className="actor-tarjeta" key={actor.id_actor}>
                  {actor.foto ? (
                    <img
                      src={actor.foto}
                      alt={actor.nombre}
                      loading="lazy"
                    />
                  ) : (
                    <div className="actor-sin-foto">👤</div>
                  )}

                  <h3>{actor.nombre}</h3>
                  <p>{actor.personaje || "Reparto"}</p>
                </article>
              ))}
            </div>

            {actores.length > 12 && (
              <button
                className="cine-boton"
                onClick={() => setVerTodos(!verTodos)}
              >
                {verTodos
                  ? "Ver menos"
                  : `Ver todo el reparto (${actores.length})`}
              </button>
            )}
          </section>
        </main>

      ) : (

        <>
          {paginaActual === "inicio" && (
            <main className="stream-inicio">

              {peliculaDestacada && (
                <section
                  className="stream-hero"
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(5,5,7,.98) 0%, rgba(5,5,7,.84) 38%, rgba(5,5,7,.24) 75%, rgba(5,5,7,.55) 100%), linear-gradient(0deg, #09090b 0%, transparent 45%), url("${peliculaDestacada.poster_url || ""}")`
                  }}
                >
                  <div className="stream-hero-contenido">
                    <span className="stream-hero-etiqueta">
                      <span className="stream-punto" />
                      DESTACADO EN CINE NOCHE - CLUB SAKILA
                    </span>

                    <h1>{peliculaDestacada.titulo}</h1>

                    <div className="stream-hero-datos">
                      <span>{peliculaDestacada.anio_estreno}</span>
                      <span>{peliculaDestacada.duracion} min</span>
                      <span>{peliculaDestacada.clasificacion}</span>

                      {peliculaDestacada.rating && (
                        <span>⭐ {peliculaDestacada.rating}</span>
                      )}
                    </div>

                    <p className="stream-hero-sinopsis">
                      {peliculaDestacada.sinopsis ||
                        "Descubre esta película disponible en nuestro catálogo."}
                    </p>

                    <div className="stream-hero-acciones">
                      <button
                        className="stream-boton-principal"
                        onClick={() => abrirDetalles(peliculaDestacada)}
                      >
                        <span>▶</span> Ver película
                      </button>

                      <button
                        className="stream-boton-secundario"
                        onClick={irPeliculas}
                      >
                        Explorar catálogo
                      </button>
                    </div>

                    <div className="stream-hero-precio">
                      Disponible para alquilar · Bs.{" "}
                      {Number(
                        peliculaDestacada.tarifa_alquiler || 0
                      ).toFixed(2)}{" "}
                      por día
                    </div>
                  </div>

                  <div className="stream-hero-indicador">
                    <span>01</span>
                    <div />
                    <span>DESTACADO</span>
                  </div>
                </section>
              )}

              {cargando && (
                <div className="stream-cargando">
                  <span className="stream-spinner" />
                  <p>Preparando tu experiencia cinematográfica...</p>
                </div>
              )}

              {error && <p className="cine-error">{error}</p>}

              {!cargando && !error && peliculas.length > 0 && (
                <>
                  <section className="stream-bienvenida">
                    <div>
                      <span className="stream-mini-etiqueta">
                        BIENVENIDO A CINE NOCHE - CLUB SAKILA
                      </span>

                      <h2>Historias que merecen ser vistas.</h2>

                      <p>
                        Explora el catálogo, conoce a sus protagonistas y
                        disfruta del cine desde casa.
                      </p>
                    </div>

                    {!usuario && (
                      <button
                        className="stream-boton-principal"
                        onClick={() => abrirAuth("registro")}
                      >
                        Crear cuenta <span>→</span>
                      </button>
                    )}
                  </section>

                  {renderFila(
                    "Selección para ti",
                    "Una selección de títulos disponibles en nuestro catálogo.",
                    otrasPeliculas.slice(0, 8),
                    "RECOMENDADOS"
                  )}

                  {renderFila(
                    "Las más recientes",
                    "Descubre las películas ordenadas por año de estreno.",
                    peliculasRecientes,
                    "NOVEDADES"
                  )}

                  {renderFila(
                    "Con tráiler disponible",
                    "Mira un adelanto antes de elegir tu próxima película.",
                    peliculasConTrailer,
                    "MIRA ANTES DE ALQUILAR"
                  )}

                  <section className="stream-final">
                    <div className="stream-final-icono">▶</div>

                    <span className="stream-mini-etiqueta">
                      TU PRÓXIMA HISTORIA COMIENZA AQUÍ
                    </span>

                    <h2>La noche es mejor con una buena película.</h2>

                    <p>
                      Encuentra tu próxima película favorita en CINE NOCHE - CLUB SAKILA.
                    </p>

                    <button
                      className="stream-boton-principal"
                      onClick={irPeliculas}
                    >
                      Explorar todas las películas →
                    </button>
                  </section>
                </>
              )}
            </main>
          )}

          {paginaActual === "peliculas" && (
            <main
              className="cine-contenido cine-catalogo-avanzado"
              id="peliculas"
            >
              <div className="cine-catalogo-encabezado">
                <div>
                  <span className="stream-mini-etiqueta">
                    CATÁLOGO CINE NOCHE - CLUB SAKILA
                  </span>

                  <h2>Explora nuestro catálogo</h2>

                  <p>
                    Encuentra grandes historias, descubre sus protagonistas
                    y alquila tus películas favoritas.
                  </p>
                </div>

                <span className="cine-contador">
                  {peliculasFiltradas.length} películas
                </span>
              </div>

              <div className="cine-herramientas">
                <label className="cine-buscador">
                  <span>⌕</span>

                  <input
                    type="search"
                    placeholder="Buscar películas por título..."
                    value={busqueda}
                    onChange={(evento) => setBusqueda(evento.target.value)}
                  />
                </label>

                <select
                  className="cine-ordenar"
                  value={ordenPeliculas}
                  onChange={(evento) =>
                    setOrdenPeliculas(evento.target.value)
                  }
                  aria-label="Ordenar películas"
                >
                  <option value="destacadas">Destacadas</option>
                  <option value="recientes">Más recientes</option>
                  <option value="titulo">Título A-Z</option>
                  <option value="precio-menor">Menor precio</option>
                  <option value="precio-mayor">Mayor precio</option>
                </select>

                <label className="cine-filtro-trailer">
                  <input
                    type="checkbox"
                    checked={soloConTrailer}
                    onChange={(evento) =>
                      setSoloConTrailer(evento.target.checked)
                    }
                  />

                  Con tráiler
                </label>
              </div>

              {cargando && <p>Cargando películas...</p>}

              {error && <p className="cine-error">{error}</p>}

              {!cargando && !error && peliculasFiltradas.length === 0 && (
                <div className="cine-sin-resultados">
                  <h3>No encontramos películas</h3>
                  <p>Prueba con otro título o cambia los filtros.</p>

                  <button
                    className="cine-boton"
                    onClick={() => {
                      setBusqueda("");
                      setOrdenPeliculas("destacadas");
                      setSoloConTrailer(false);
                    }}
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}

              <div className="cine-grid cine-grid-avanzado">
                {peliculasFiltradas.map((pelicula) => (
                  <article
                    className="cine-tarjeta cine-tarjeta-avanzada"
                    key={pelicula.id_pelicula}
                  >
                    <div className="cine-poster-contenedor">
                      {pelicula.poster_url ? (
                        <img
                          src={pelicula.poster_url}
                          alt={pelicula.titulo}
                          loading="lazy"
                          onError={(evento) => {
                            evento.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="cine-sin-poster">🎬</div>
                      )}

                      {pelicula.trailer_url && (
                        <span className="cine-poster-insignia">
                          ▶ TRÁILER
                        </span>
                      )}
                    </div>

                    <div className="cine-tarjeta-informacion">
                      <h3>{pelicula.titulo}</h3>

                      <div className="cine-tarjeta-datos">
                        <span>{pelicula.anio_estreno || "Sin año"}</span>

                        <span>
                          {pelicula.duracion
                            ? `${pelicula.duracion} min`
                            : "Película"}
                        </span>
                      </div>

                      <p className="cine-tarjeta-precio">
                        Bs.{" "}
                        {Number(pelicula.tarifa_alquiler || 0).toFixed(2)}
                        <small> / día</small>
                      </p>

                      <button
                        className="cine-boton cine-ver-detalles"
                        onClick={() => abrirDetalles(pelicula)}
                      >
                        Ver detalles
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </main>
          )}
        </>
      )}

      {/* MODAL DE INICIO DE SESION Y REGISTRO */}

      {mostrarAuth && (
        <div className="auth-fondo" onClick={cerrarAuth}>
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <button
              className="auth-cerrar"
              type="button"
              onClick={cerrarAuth}
              disabled={procesandoAuth}
              aria-label="Cerrar"
            >
              ✕
            </button>

            <h2 className="auth-logo">▶ CINE NOCHE - CLUB SAKILA</h2>

            <h3 id="auth-titulo">
              {modoAuth === "registro"
                ? "Crear una cuenta"
                : "Iniciar sesión"}
            </h3>

            <p className="auth-descripcion">
              {modoAuth === "registro"
                ? "Regístrate para alquilar tus películas favoritas."
                : "Ingresa a tu cuenta para disfrutar de CINE NOCHE - CLUB SAKILA."}
            </p>

            <form onSubmit={enviarAuth}>
              {modoAuth === "registro" && (
                <>
                  <label htmlFor="auth-nombre">Nombre</label>

                  <input
                    id="auth-nombre"
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    maxLength={100}
                    disabled={procesandoAuth}
                  />

                  <label htmlFor="auth-apellido">Apellido</label>

                  <input
                    id="auth-apellido"
                    type="text"
                    placeholder="Tu apellido"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                    maxLength={100}
                    disabled={procesandoAuth}
                  />
                </>
              )}

              <label htmlFor="auth-correo">Correo electrónico</label>

              <input
                id="auth-correo"
                type="email"
                placeholder="ejemplo@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                disabled={procesandoAuth}
              />

              <label htmlFor="auth-password">Contraseña</label>

              <input
                id="auth-password"
                type="password"
                placeholder="Introduce tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={procesandoAuth}
                autoComplete={
                  modoAuth === "registro"
                    ? "new-password"
                    : "current-password"
                }
              />

              {errorAuth && (
                <p className="cine-error" role="alert">
                  {errorAuth}
                </p>
              )}

              <button
                className="cine-boton auth-enviar"
                type="submit"
                disabled={procesandoAuth}
              >
                {procesandoAuth
                  ? "Procesando..."
                  : modoAuth === "registro"
                    ? "Crear cuenta"
                    : "Iniciar sesión"}
              </button>
            </form>

            <p className="auth-cambiar">
              {modoAuth === "registro"
                ? "¿Ya tienes una cuenta?"
                : "¿Todavía no tienes cuenta?"}

              <button
                type="button"
                onClick={() => {
                  setModoAuth(
                    modoAuth === "registro" ? "login" : "registro"
                  );
                  setErrorAuth("");
                  setPassword("");
                }}
              >
                {modoAuth === "registro"
                  ? "Iniciar sesión"
                  : "Regístrate aquí"}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* MODAL DE ALQUILER */}

      {mostrarAlquiler && peliculaSeleccionada && (
        <div className="alquiler-fondo" onClick={cerrarAlquiler}>
          <div
            className="alquiler-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-alquiler"
            onClick={(evento) => evento.stopPropagation()}
          >
            <button
              className="alquiler-cerrar"
              type="button"
              onClick={cerrarAlquiler}
              disabled={procesandoAlquiler}
              aria-label="Cerrar ventana"
            >
              ✕
            </button>

            {alquilerExitoso ? (
              <div className="alquiler-exito">
                <h2>✅ ¡Alquiler registrado!</h2>

                <p>
                  Tu alquiler de{" "}
                  <strong>
                    {alquilerExitoso.pelicula ||
                      peliculaSeleccionada.titulo}
                  </strong>{" "}
                  se guardó correctamente.
                </p>

                <p>
                  Número de alquiler:{" "}
                  <strong>{alquilerExitoso.id_alquiler}</strong>
                </p>

                <p>Días: {alquilerExitoso.dias_prestamo}</p>

                <h3>
                  Total: Bs.{" "}
                  {Number(
                    alquilerExitoso.costo_total ??
                    alquilerExitoso.subtotal ??
                    total
                  ).toFixed(2)}
                </h3>

                <button className="cine-boton" onClick={cerrarAlquiler}>
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h2 id="titulo-alquiler">🎟 Confirmar alquiler</h2>

                <p>
                  Película:{" "}
                  <strong>{peliculaSeleccionada.titulo}</strong>
                </p>

                <p className="alquiler-aviso">
                  Estás alquilando con la cuenta de{" "}
                  <strong>
                    {usuario?.nombre} {usuario?.apellido}
                  </strong>.
                </p>

                <form onSubmit={confirmarAlquiler}>
                  <label htmlFor="dias-prestamo">
                    Días de alquiler
                  </label>

                  <select
                    id="dias-prestamo"
                    value={diasPrestamo}
                    onChange={(evento) =>
                      setDiasPrestamo(Number(evento.target.value))
                    }
                    disabled={procesandoAlquiler}
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(
                      (dia) => (
                        <option key={dia} value={dia}>
                          {dia} {dia === 1 ? "día" : "días"}
                        </option>
                      )
                    )}
                  </select>

                  <div className="alquiler-resumen">
                    <p>
                      Tarifa por día:{" "}
                      <strong>
                        {tarifaValida
                          ? `Bs. ${tarifa.toFixed(2)}`
                          : "No disponible"}
                      </strong>
                    </p>

                    <p>
                      Duración: <strong>{diasPrestamo} días</strong>
                    </p>

                    <h3>
                      Total:{" "}
                      {tarifaValida
                        ? `Bs. ${total.toFixed(2)}`
                        : "No disponible"}
                    </h3>
                  </div>

                  {errorAlquiler && (
                    <p className="cine-error" role="alert">
                      {errorAlquiler}
                    </p>
                  )}

                  <button
                    className="cine-boton"
                    type="submit"
                    disabled={procesandoAlquiler || !tarifaValida}
                  >
                    {procesandoAlquiler
                      ? "Registrando alquiler..."
                      : "Confirmar alquiler"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}

      <footer className="cine-footer">
        <div className="cine-footer-marca">
          ▶ CINE NOCHE - CLUB SAKILA
        </div>

        <p>Tu cine en casa. Historias para cada noche.</p>

        <span>
          © {new Date().getFullYear()} CINE NOCHE - CLUB SAKILA.
          Todos los derechos reservados.
        </span>
      </footer>
    </div>
  );
}

export default App;
