
import { useEffect, useState } from "react";
import "./Admin.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://cine-noche-backend.onrender.com"
).replace(/\/$/, "");

const formularioInicial = {
  titulo: "",
  sinopsis: "",
  anio_estreno: "",
  clasificacion: "",
  duracion: "",
  tarifa_alquiler: "",
  rating: "",
  director: "",
  poster_url: "",
  trailer_url: ""
};

function Admin({ token, onVolver }) {
  const [seccion, setSeccion] = useState("resumen");
  const [peliculas, setPeliculas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);

  async function cargarDatos() {
    if (!token) {
      setError("No se encontró una sesión válida.");
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");

    try {
      const opciones = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const [
        respuestaPeliculas,
        respuestaUsuarios,
        respuestaEstadisticas
      ] = await Promise.all([
        fetch(`${API_URL}/api/admin/peliculas`, opciones),
        fetch(`${API_URL}/api/admin/usuarios`, opciones),
        fetch(`${API_URL}/api/admin/estadisticas`, opciones)
      ]);

      const datosPeliculas = await respuestaPeliculas.json();
      const datosUsuarios = await respuestaUsuarios.json();
      const datosEstadisticas = await respuestaEstadisticas.json();

      if (!respuestaPeliculas.ok) {
        throw new Error(
          datosPeliculas.error || "No se pudieron cargar las películas."
        );
      }

      if (!respuestaUsuarios.ok) {
        throw new Error(
          datosUsuarios.error || "No se pudieron cargar los usuarios."
        );
      }

      if (!respuestaEstadisticas.ok) {
        throw new Error(
          datosEstadisticas.error || "No se pudieron cargar las estadísticas."
        );
      }

      setPeliculas(
        Array.isArray(datosPeliculas)
          ? datosPeliculas
          : datosPeliculas.peliculas || []
      );

      setUsuarios(
        Array.isArray(datosUsuarios)
          ? datosUsuarios
          : datosUsuarios.usuarios || []
      );

      setEstadisticas(datosEstadisticas);

    } catch (error) {
      console.error("Error cargando administración:", error);
      setError(error.message);

    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, [token]);

  function cambiarSeccion(nuevaSeccion) {
    setSeccion(nuevaSeccion);
    setMensaje("");
    setError("");
  }

  function actualizarFormulario(evento) {
    const { name, value } = evento.target;

    setFormulario(actual => ({
      ...actual,
      [name]: value
    }));
  }

  async function agregarPelicula(evento) {
    evento.preventDefault();

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const datos = {
        ...formulario,
        anio_estreno: formulario.anio_estreno || null,
        duracion: formulario.duracion || null,
        rating: formulario.rating || null,
        tarifa_alquiler: formulario.tarifa_alquiler
      };

      const respuesta = await fetch(
        `${API_URL}/api/admin/peliculas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(datos)
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "No se pudo agregar la película."
        );
      }

      setFormulario(formularioInicial);
      setMostrarFormulario(false);
      setMensaje("Película agregada correctamente.");

      await cargarDatos();

    } catch (error) {
      setError(error.message);

    } finally {
      setGuardando(false);
    }
  }

  async function eliminarPelicula(id, titulo) {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas eliminar "${titulo}"?`
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    try {
      const respuesta = await fetch(
        `${API_URL}/api/admin/peliculas/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "No se pudo eliminar la película."
        );
      }

      setMensaje(`La película "${titulo}" fue eliminada.`);

      await cargarDatos();

    } catch (error) {
      setError(error.message);
    }
  }

  const totalPeliculas = Number(
    estadisticas?.general?.total_peliculas || 0
  );

  const totalUsuarios = Number(
    estadisticas?.general?.total_usuarios || 0
  );

  const totalAlquileres = Number(
    estadisticas?.general?.total_alquileres || 0
  );

  const ingresos = Number(
    estadisticas?.general?.ingresos_totales || 0
  );

  const masAlquilada = estadisticas?.mas_alquilada;
  const menosAlquilada = estadisticas?.menos_alquilada;

  const ranking = estadisticas?.ranking || [];

  const administradores = usuarios.filter(
    usuario => usuario.rol === "admin"
  ).length;

  const estiloFormulario = {
    background: "#151521",
    padding: "22px",
    borderRadius: "14px",
    border: "1px solid #343044",
    marginBottom: "24px"
  };

  const estiloCampo = {
    width: "100%",
    padding: "12px",
    background: "#0e0e18",
    color: "#ffffff",
    border: "1px solid #393449",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box"
  };

  const estiloEtiqueta = {
    display: "block",
    marginBottom: "7px",
    color: "#d6d0e5",
    fontSize: "13px"
  };

  return (
    <div className="admin-layout">

      <aside className="admin-sidebar">

        <div className="admin-marca">
          <div className="admin-marca-icono">▶</div>
          <div>
            <strong>CINE NOCHE</strong>
            <span>CLUB SAKILA</span>
          </div>
        </div>

        <div className="admin-menu-titulo">
          ADMINISTRACIÓN
        </div>

        <nav className="admin-menu">

          <button
            className={seccion === "resumen" ? "activo" : ""}
            onClick={() => cambiarSeccion("resumen")}
          >
            <span>▦</span>
            Resumen
          </button>

          <button
            className={seccion === "peliculas" ? "activo" : ""}
            onClick={() => cambiarSeccion("peliculas")}
          >
            <span>🎬</span>
            Películas
          </button>

          <button
            className={seccion === "usuarios" ? "activo" : ""}
            onClick={() => cambiarSeccion("usuarios")}
          >
            <span>♙</span>
            Usuarios
          </button>

        </nav>

        <div className="admin-sidebar-inferior">
          <div className="admin-estado">
            <span></span>
            Sesión de administrador
          </div>

          <button
            className="admin-volver"
            onClick={onVolver}
          >
            ← Volver al catálogo
          </button>
        </div>

      </aside>

      <main className="admin-contenido">

        <header className="admin-header">
          <div>
            <span>GESTIÓN DEL SISTEMA</span>
            <h1>
              {seccion === "resumen"
                ? "Panel de administración"
                : seccion === "peliculas"
                  ? "Administración de películas"
                  : "Administración de usuarios"}
            </h1>
          </div>

          <button
            className="admin-actualizar"
            onClick={cargarDatos}
            disabled={cargando}
          >
            ↻ Actualizar datos
          </button>
        </header>

        {error && (
          <div className="admin-error">
            <strong>Atención</strong>
            <p>{error}</p>
            <button onClick={cargarDatos}>
              Intentar nuevamente
            </button>
          </div>
        )}

        {mensaje && (
          <div
            style={{
              padding: "13px 16px",
              background: "#123c2c",
              color: "#a7f3d0",
              borderRadius: "9px",
              marginBottom: "20px"
            }}
          >
            {mensaje}
          </div>
        )}

        {cargando ? (
          <div className="admin-cargando">
            <div className="admin-spinner"></div>
            <p>Cargando información del sistema...</p>
          </div>
        ) : (
          <>

            {seccion === "resumen" && (
              <section className="admin-seccion">

                <div className="admin-bienvenida">
                  <div>
                    <span>BIENVENIDO AL SISTEMA</span>
                    <h2>Controla tu plataforma cinematográfica.</h2>
                    <p>
                      Consulta las ventas, alquileres,
                      películas y usuarios de CINE NOCHE.
                    </p>
                  </div>

                  <div className="admin-bienvenida-icono">
                    ▶
                  </div>
                </div>

                <div className="admin-estadisticas">

                  <article className="admin-stat">
                    <div className="admin-stat-icono violeta">
                      🎬
                    </div>
                    <div>
                      <span>Películas registradas</span>
                      <strong>{totalPeliculas}</strong>
                      <small>En el catálogo</small>
                    </div>
                  </article>

                  <article className="admin-stat">
                    <div className="admin-stat-icono azul">
                      ♙
                    </div>
                    <div>
                      <span>Usuarios registrados</span>
                      <strong>{totalUsuarios}</strong>
                      <small>Cuentas del sistema</small>
                    </div>
                  </article>

                  <article className="admin-stat">
                    <div className="admin-stat-icono verde">
                      🎟
                    </div>
                    <div>
                      <span>Total de alquileres</span>
                      <strong>{totalAlquileres}</strong>
                      <small>Alquileres registrados</small>
                    </div>
                  </article>

                  <article className="admin-stat">
                    <div className="admin-stat-icono violeta">
                      Bs.
                    </div>
                    <div>
                      <span>Ingresos acumulados</span>
                      <strong>
                        Bs. {ingresos.toFixed(2)}
                      </strong>
                      <small>Por alquileres registrados</small>
                    </div>
                  </article>

                </div>

                <div className="admin-panel-inferior">

                  <div className="admin-panel-titulo">
                    <div>
                      <span>RENDIMIENTO DE LA TIENDA</span>
                      <h2>Estadísticas de películas</h2>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                      gap: "18px",
                      marginTop: "20px"
                    }}
                  >

                    <article style={estiloFormulario}>
                      <span style={{ color: "#a78bfa" }}>
                        ★ PELÍCULA MÁS ALQUILADA
                      </span>

                      <h2 style={{ color: "#ffffff" }}>
                        {masAlquilada?.titulo || "Sin datos"}
                      </h2>

                      <p style={{ color: "#c4bdd3" }}>
                        {masAlquilada
                          ? `${masAlquilada.total_alquileres} alquileres`
                          : "Todavía no hay películas"}
                      </p>
                    </article>

                    <article style={estiloFormulario}>
                      <span style={{ color: "#60a5fa" }}>
                        ↓ PELÍCULA MENOS ALQUILADA
                      </span>

                      <h2 style={{ color: "#ffffff" }}>
                        {menosAlquilada?.titulo || "Sin datos"}
                      </h2>

                      <p style={{ color: "#c4bdd3" }}>
                        {menosAlquilada
                          ? `${menosAlquilada.total_alquileres} alquileres`
                          : "Todavía no hay películas"}
                      </p>
                    </article>

                    <article style={estiloFormulario}>
                      <span style={{ color: "#34d399" }}>
                        ♙ ADMINISTRADORES
                      </span>

                      <h2 style={{ color: "#ffffff" }}>
                        {administradores}
                      </h2>

                      <p style={{ color: "#c4bdd3" }}>
                        Con acceso administrativo
                      </p>
                    </article>

                  </div>

                </div>

                <div className="admin-panel-inferior">

                  <div className="admin-panel-titulo">
                    <div>
                      <span>TOP DE PELÍCULAS</span>
                      <h2>Ranking de alquileres</h2>
                    </div>
                  </div>

                  <div className="admin-tabla-contenedor">
                    <table className="admin-tabla">
                      <thead>
                        <tr>
                          <th>Posición</th>
                          <th>Película</th>
                          <th>Alquileres</th>
                          <th>Ingresos</th>
                        </tr>
                      </thead>

                      <tbody>
                        {ranking.map((pelicula, indice) => (
                          <tr key={pelicula.id_pelicula}>
                            <td>#{indice + 1}</td>

                            <td className="admin-nombre-tabla">
                              {pelicula.titulo}
                            </td>

                            <td>
                              {pelicula.total_alquileres}
                            </td>

                            <td>
                              Bs. {Number(pelicula.ingresos || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}

                        {ranking.length === 0 && (
                          <tr>
                            <td colSpan="4">
                              No hay películas registradas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

                <div className="admin-panel-inferior">

                  <div className="admin-panel-titulo">
                    <div>
                      <span>GESTIÓN GENERAL</span>
                      <h2>Accesos rápidos</h2>
                    </div>
                  </div>

                  <div className="admin-accesos">

                    <button
                      onClick={() => cambiarSeccion("peliculas")}
                    >
                      <span>🎬</span>
                      <strong>Administrar películas</strong>
                      <small>Agregar y eliminar películas</small>
                      <b>→</b>
                    </button>

                    <button
                      onClick={() => cambiarSeccion("usuarios")}
                    >
                      <span>♙</span>
                      <strong>Ver usuarios</strong>
                      <small>Consultar las cuentas registradas</small>
                      <b>→</b>
                    </button>

                  </div>
                </div>

              </section>
            )}

            {seccion === "peliculas" && (
              <section className="admin-seccion">

                <div className="admin-panel-titulo">
                  <div>
                    <span>CATÁLOGO</span>
                    <h2>Películas registradas</h2>
                    <p>
                      Total: {peliculas.length} películas
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(!mostrarFormulario);
                      setFormulario(formularioInicial);
                      setError("");
                      setMensaje("");
                    }}
                    style={{
                      background: "#7544d8",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 18px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    {mostrarFormulario
                      ? "✕ Cerrar formulario"
                      : "+ Agregar película"}
                  </button>
                </div>

                {mostrarFormulario && (
                  <form
                    onSubmit={agregarPelicula}
                    style={estiloFormulario}
                  >

                    <h2 style={{ color: "#ffffff" }}>
                      Registrar nueva película
                    </h2>

                    <p style={{ color: "#aaa" }}>
                      Completa los datos de la película que deseas agregar.
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                        gap: "16px",
                        marginTop: "20px"
                      }}
                    >

                      <div>
                        <label style={estiloEtiqueta}>Título *</label>
                        <input
                          style={estiloCampo}
                          name="titulo"
                          value={formulario.titulo}
                          onChange={actualizarFormulario}
                          maxLength="255"
                          required
                        />
                      </div>

                      <div>
                        <label style={estiloEtiqueta}>Director</label>
                        <input
                          style={estiloCampo}
                          name="director"
                          value={formulario.director}
                          onChange={actualizarFormulario}
                        />
                      </div>

                      <div>
                        <label style={estiloEtiqueta}>Año de estreno</label>
                        <input
                          style={estiloCampo}
                          type="number"
                          name="anio_estreno"
                          value={formulario.anio_estreno}
                          onChange={actualizarFormulario}
                          min="1888"
                          max="2100"
                        />
                      </div>

                      <div>
                        <label style={estiloEtiqueta}>Duración en minutos</label>
                        <input
                          style={estiloCampo}
                          type="number"
                          name="duracion"
                          value={formulario.duracion}
                          onChange={actualizarFormulario}
                          min="1"
                          max="600"
                        />
                      </div>

                      <div>
                        <label style={estiloEtiqueta}>Clasificación</label>
                        <input
                          style={estiloCampo}
                          name="clasificacion"
                          value={formulario.clasificacion}
                          onChange={actualizarFormulario}
                          placeholder="Ej. PG-13"
                        />
                      </div>

                      <div>
                        <label style={estiloEtiqueta}>Rating (0 a 10)</label>
                        <input
                          style={estiloCampo}
                          type="number"
                          name="rating"
                          value={formulario.rating}
                          onChange={actualizarFormulario}
                          min="0"
                          max="10"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <label style={estiloEtiqueta}>Tarifa por día (Bs.) *</label>
                        <input
                          style={estiloCampo}
                          type="number"
                          name="tarifa_alquiler"
                          value={formulario.tarifa_alquiler}
                          onChange={actualizarFormulario}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div>
                        <label style={estiloEtiqueta}>URL del póster</label>
                        <input
                          style={estiloCampo}
                          type="url"
                          name="poster_url"
                          value={formulario.poster_url}
                          onChange={actualizarFormulario}
                          placeholder="https://..."
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={estiloEtiqueta}>URL del tráiler</label>
                        <input
                          style={estiloCampo}
                          type="url"
                          name="trailer_url"
                          value={formulario.trailer_url}
                          onChange={actualizarFormulario}
                          placeholder="https://..."
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={estiloEtiqueta}>Sinopsis</label>
                        <textarea
                          style={{
                            ...estiloCampo,
                            minHeight: "110px",
                            resize: "vertical"
                          }}
                          name="sinopsis"
                          value={formulario.sinopsis}
                          onChange={actualizarFormulario}
                          placeholder="Descripción de la película..."
                        />
                      </div>

                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "22px",
                        flexWrap: "wrap"
                      }}
                    >

                      <button
                        type="submit"
                        disabled={guardando}
                        style={{
                          background: "#7544d8",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px 22px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        {guardando
                          ? "Guardando..."
                          : "Guardar película"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMostrarFormulario(false);
                          setFormulario(formularioInicial);
                        }}
                        style={{
                          background: "#333344",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px 22px",
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                      >
                        Cancelar
                      </button>

                    </div>

                  </form>
                )}

                <div className="admin-tabla-contenedor">
                  <table className="admin-tabla">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Película</th>
                        <th>Año</th>
                        <th>Tarifa por día</th>
                        <th>Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {peliculas.map((pelicula, indice) => (
                        <tr
                          key={pelicula.id_pelicula ?? indice}
                        >
                          <td>
                            #{pelicula.id_pelicula ?? "—"}
                          </td>

                          <td className="admin-nombre-tabla">
                            {pelicula.titulo || "Sin título"}
                          </td>

                          <td>
                            {pelicula.anio_estreno || "—"}
                          </td>

                          <td>
                            Bs. {Number(
                              pelicula.tarifa_alquiler || 0
                            ).toFixed(2)}
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() => eliminarPelicula(
                                pelicula.id_pelicula,
                                pelicula.titulo
                              )}
                              style={{
                                background: "#a52d42",
                                color: "#ffffff",
                                border: "none",
                                padding: "8px 12px",
                                borderRadius: "7px",
                                cursor: "pointer"
                              }}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}

                      {peliculas.length === 0 && (
                        <tr>
                          <td colSpan="5">
                            No hay películas registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </section>
            )}

            {seccion === "usuarios" && (
              <section className="admin-seccion">

                <div className="admin-panel-titulo">
                  <div>
                    <span>CUENTAS</span>
                    <h2>Usuarios registrados</h2>
                    <p>
                      Total: {usuarios.length} cuentas
                    </p>
                  </div>
                </div>

                <div className="admin-tabla-contenedor">
                  <table className="admin-tabla">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre completo</th>
                        <th>Correo electrónico</th>
                        <th>Rol</th>
                      </tr>
                    </thead>

                    <tbody>
                      {usuarios.map((usuario, indice) => (
                        <tr
                          key={usuario.id_socio ?? indice}
                        >
                          <td>
                            #{usuario.id_socio ?? "—"}
                          </td>

                          <td className="admin-nombre-tabla">
                            {usuario.nombre || ""}{" "}
                            {usuario.apellido || ""}
                          </td>

                          <td>{usuario.correo || "—"}</td>

                          <td>
                            <span
                              className={
                                usuario.rol === "admin"
                                  ? "admin-rol administrador"
                                  : "admin-rol cliente"
                              }
                            >
                              {usuario.rol || "Sin rol"}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {usuarios.length === 0 && (
                        <tr>
                          <td colSpan="4">
                            No hay usuarios registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </section>
            )}

          </>
        )}

        <footer className="admin-footer">
          CINE NOCHE - CLUB SAKILA · Panel de administración
        </footer>

      </main>
    </div>
  );
}

export default Admin;
