
import { useEffect, useState } from "react";
import "./App.css";
import "./Auth.css";
import "./CineAvanzado.css";

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
      const ruta =
        modoAuth === "registro"
          ? "/api/auth/registro"
          : "/api/auth/login";

      const datosEnviar =
        modoAuth === "registro"
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
    } catch (error) {
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

      if (!lista) throw new Error("El servidor devolvió un formato inesperado.");
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
    if (!Number.isInteger(diasPrestamo) || diasPrestamo < 1 || diasPrestamo > 30) {
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
    } catch (error) {
      setErrorAlquiler(error.message);
    } finally {
      setProcesandoAlquiler(false);
    }
  }

  const peliculasFiltradas = peliculas
    .filter((pelicula) => {
      const titulo = String(pelicula.titulo || "").toLowerCase();
      const coincideBusqueda = titulo.includes(busqueda.trim().toLowerCase());
      const coincideTrailer = !soloConTrailer || Boolean(pelicula.trailer_url);
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

  return (
    <div className="cine-app">
      <header className="cine-header">
        <h1 onClick={irInicio} style={{ cursor: "pointer" }}>
          ▶ CINE NOCHE
        </h1>

        <nav>
          <button
            type="button"
            className={`cine-nav-link ${
              paginaActual === "inicio" && !mostrarCuenta && !peliculaSeleccionada
                ? "activo"
                : ""
            }`}
            onClick={irInicio}
          >
            ⌂ Inicio
          </button>

          <button
            type="button"
            className={`cine-nav-link ${
              paginaActual === "peliculas" && !mostrarCuenta && !peliculaSeleccionada
                ? "activo"
                : ""
            }`}
            onClick={irPeliculas}
          >
            🎬 Películas
          </button>

          {cargandoSesion ? (
            <span>Verificando sesión...</span>
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
            <p className="auth-bienvenida">Bienvenido a CINE NOCHE</p>

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

              {cargandoMisAlquileres && <p>Cargando tus alquileres...</p>}
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
                    className="auth-dato"
                    key={alquiler.id_detalle ?? alquiler.id_alquiler}
                    style={{ marginBottom: "12px" }}
                  >
                    <strong>🎬 {alquiler.pelicula || alquiler.titulo}</strong>
                    <span>Número de alquiler: {alquiler.id_alquiler}</span>
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
                    <span>Estado: {alquiler.estado || "Sin estado"}</span>
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
          <button className="cine-boton" onClick={volverCatalogo}>
            ← Volver al catálogo
          </button>

          <div className="detalle-principal">
            {peliculaSeleccionada.poster_url ? (
              <img
                className="detalle-poster"
                src={peliculaSeleccionada.poster_url}
                alt={peliculaSeleccionada.titulo}
              />
            ) : (
              <div className="cine-sin-poster">🎬</div>
            )}

            <div className="detalle-informacion">
              <h2>{peliculaSeleccionada.titulo}</h2>
              <p>
                {peliculaSeleccionada.anio_estreno} ·{" "}
                {peliculaSeleccionada.duracion} min ·{" "}
                {peliculaSeleccionada.clasificacion}
              </p>
              <p>⭐ {peliculaSeleccionada.rating || "Sin calificación"}</p>
              <h3>Sinopsis</h3>
              <p>{peliculaSeleccionada.sinopsis}</p>
              <p>
                <strong>Director:</strong> {peliculaSeleccionada.director}
              </p>
              <p>
                <strong>Precio:</strong> Bs.{" "}
                {peliculaSeleccionada.tarifa_alquiler} por día
              </p>

              <button
                className="cine-boton"
                type="button"
                onClick={abrirAlquiler}
                disabled={cargandoSesion}
              >
                🎟 Alquilar película
              </button>

              {peliculaSeleccionada.trailer_url && (
                <button
                  className="cine-boton"
                  type="button"
                  onClick={() => setMostrarTrailer(!mostrarTrailer)}
                  style={{ marginLeft: "12px" }}
                >
                  {mostrarTrailer ? "✖ Cerrar tráiler" : "▶ Ver tráiler"}
                </button>
              )}
            </div>
          </div>

          {mostrarTrailer && peliculaSeleccionada.trailer_url && (
            <section className="detalle-trailer">
              <h2>Tráiler oficial</h2>
              <div className="trailer-contenedor">
                <iframe
                  src={peliculaSeleccionada.trailer_url}
                  title={`Tráiler de ${peliculaSeleccionada.titulo}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          <section className="detalle-reparto">
            <h2>Reparto de la película</h2>
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
            <>
              <section className="cine-hero" id="inicio">
                <h2>Bienvenido a CINE NOCHE</h2>
                <p>
                  Descubre tus películas favoritas y alquílalas fácilmente.
                </p>

                {!usuario && !cargandoSesion && (
                  <button
                    className="cine-boton"
                    onClick={() => abrirAuth("registro")}
                    style={{ marginRight: "12px" }}
                  >
                    Crear mi cuenta
                  </button>
                )}

                <button className="cine-boton" onClick={irPeliculas}>
                  Explorar películas
                </button>
              </section>

              <section className="cine-inicio-carrusel">
                <div className="cine-inicio-carrusel-titulo">
                  <span className="cine-etiqueta">TU CINE EN CASA</span>
                  <h2>Películas para disfrutar</h2>
                  <p>
                    Descubre nuestras películas con un recorrido automático.
                  </p>
                </div>

                {cargando && <p>Cargando películas...</p>}
                {error && <p className="cine-error">{error}</p>}

                {!cargando && peliculas.length > 0 && (
                  <div className="cine-carrusel-ventana">
                    <div className="cine-carrusel-pista">
                      {[...peliculas, ...peliculas].map((pelicula, indice) => (
                        <button
                          type="button"
                          className="cine-carrusel-item"
                          key={`${pelicula.id_pelicula}-${indice}`}
                          onClick={() => abrirDetalles(pelicula)}
                          aria-label={`Ver detalles de ${pelicula.titulo}`}
                        >
                          {pelicula.poster_url ? (
                            <img
                              src={pelicula.poster_url}
                              alt={pelicula.titulo}
                              loading="lazy"
                            />
                          ) : (
                            <div className="cine-carrusel-sin-poster">🎬</div>
                          )}

                          <div className="cine-carrusel-info">
                            <h3>{pelicula.titulo}</h3>
                            <span>{pelicula.anio_estreno}</span>
                            <strong>Ver detalles →</strong>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="cine-boton cine-carrusel-explorar"
                  onClick={irPeliculas}
                >
                  Explorar catálogo completo
                </button>
              </section>
            </>
          )}

          {paginaActual === "peliculas" && (
            <main
              className="cine-contenido cine-catalogo-avanzado"
              id="peliculas"
            >
              <div className="cine-catalogo-encabezado">
                <div>
                  <span className="cine-etiqueta">TU CINE EN CASA</span>
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
                  onChange={(evento) => setOrdenPeliculas(evento.target.value)}
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
                          ▶ Tráiler
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
                        Bs. {Number(pelicula.tarifa_alquiler || 0).toFixed(2)}
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

            <h2 className="auth-logo">▶ CINE NOCHE</h2>
            <h3 id="auth-titulo">
              {modoAuth === "registro"
                ? "Crear una cuenta"
                : "Iniciar sesión"}
            </h3>
            <p className="auth-descripcion">
              {modoAuth === "registro"
                ? "Regístrate para alquilar tus películas favoritas."
                : "Ingresa a tu cuenta para disfrutar de CINE NOCHE."}
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
                  {Number(alquilerExitoso.costo_total).toFixed(2)}
                </h3>
                <button
                  className="cine-boton"
                  type="button"
                  onClick={cerrarAlquiler}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h2 id="titulo-alquiler">🎟 Confirmar alquiler</h2>
                <p>
                  Película: <strong>{peliculaSeleccionada.titulo}</strong>
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

      <footer className="cine-footer">
        CINE NOCHE — Club Sakila
      </footer>
    </div>
  );
}

export default App;
