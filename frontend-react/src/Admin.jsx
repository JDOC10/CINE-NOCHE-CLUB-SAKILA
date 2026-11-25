
import { useEffect, useState } from "react";
import "./Admin.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://cine-noche-backend.onrender.com"
).replace(/\/$/, "");

function Admin({ token, onVolver }) {
  const [seccion, setSeccion] = useState("resumen");
  const [peliculas, setPeliculas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarDatos() {
    if (!token) {
      setError("No se encontró una sesión válida.");
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");

    try {
      const [respuestaPeliculas, respuestaUsuarios] =
        await Promise.all([
          fetch(`${API_URL}/api/admin/peliculas`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/api/admin/usuarios`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

      const datosPeliculas = await respuestaPeliculas.json();
      const datosUsuarios = await respuestaUsuarios.json();

      if (!respuestaPeliculas.ok) {
        throw new Error(
          datosPeliculas.error ||
          "No se pudieron cargar las películas."
        );
      }

      if (!respuestaUsuarios.ok) {
        throw new Error(
          datosUsuarios.error ||
          "No se pudieron cargar los usuarios."
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
  }

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
            <strong>No se pudieron cargar todos los datos</strong>
            <p>{error}</p>
            <button onClick={cargarDatos}>
              Intentar nuevamente
            </button>
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
                      Desde aquí puedes consultar las películas
                      y las cuentas registradas en CINE NOCHE.
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
                      <strong>{peliculas.length}</strong>
                      <small>En el catálogo</small>
                    </div>
                  </article>

                  <article className="admin-stat">
                    <div className="admin-stat-icono azul">
                      ♙
                    </div>
                    <div>
                      <span>Usuarios registrados</span>
                      <strong>{usuarios.length}</strong>
                      <small>Cuentas del sistema</small>
                    </div>
                  </article>

                  <article className="admin-stat">
                    <div className="admin-stat-icono verde">
                      ★
                    </div>
                    <div>
                      <span>Administradores</span>
                      <strong>
                        {usuarios.filter(
                          (usuario) => usuario.rol === "admin"
                        ).length}
                      </strong>
                      <small>Con acceso administrativo</small>
                    </div>
                  </article>

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
                      <strong>Ver películas</strong>
                      <small>Consultar el catálogo registrado</small>
                      <b>→</b>
                    </button>

                    <button
                      onClick={() => cambiarSeccion("usuarios")}
                    >
                      <span>♙</span>
                      <strong>Ver usuarios</strong>
                      <small>Consultar las cuentas y sus roles</small>
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
                </div>

                <div className="admin-tabla-contenedor">
                  <table className="admin-tabla">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Película</th>
                        <th>Año</th>
                        <th>Tarifa por día</th>
                      </tr>
                    </thead>

                    <tbody>
                      {peliculas.map((pelicula, indice) => (
                        <tr
                          key={
                            pelicula.id_pelicula ??
                            indice
                          }
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
                            Bs.{" "}
                            {Number(
                              pelicula.tarifa_alquiler || 0
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}

                      {peliculas.length === 0 && (
                        <tr>
                          <td colSpan="4">
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
