# 🎬 CINE NOCHE - CLUB SAKILA

**Sistema web de alquiler y consulta de películas**, desarrollado con React, Node.js, Express y PostgreSQL.

CINE NOCHE - CLUB SAKILA es una aplicación web que permite consultar un catálogo de películas, visualizar información de cada título, gestionar cuentas de usuario y administrar el contenido de la plataforma mediante un panel de administración.

## 🌐 Acceso al proyecto

- **Aplicación web:** https://cine-noche-frontend.onrender.com
- **API / Backend:** https://cine-noche-backend.onrender.com
- **Repositorio de GitHub:** https://github.com/JDOC10/CINE-NOCHE-CLUB-SAKILA

## 🛠️ Tecnologías utilizadas

### Frontend
- React
- JavaScript
- HTML5
- CSS3
- Vite

### Backend
- Node.js
- Express
- JavaScript
- API REST

### Base de datos
- PostgreSQL
- pgAdmin 4

### Servicios externos
- TMDB API: consulta de información, imágenes y contenido relacionado con películas.
- EmailJS: envío de correos electrónicos desde la aplicación.
- Render: alojamiento y despliegue del frontend y backend.

```

## ✨ Funcionalidades principales

- Catálogo de películas conectado a PostgreSQL.
- Consulta de información y detalles de películas.
- Registro e inicio de sesión de usuarios.
- Autenticación mediante tokens.
- Gestión de cuentas y roles de usuario.
- Panel de administración protegido.
- Consulta de estadísticas generales de la plataforma.
- Consulta de películas más y menos alquiladas.
- Gestión administrativa de películas.
- Visualización de imágenes y contenido de películas mediante TMDB.
- Envío de correos electrónicos mediante EmailJS.

## 💻 Instalación y ejecución local

### 1. Requisitos previos

Instalar los siguientes programas:

- [Node.js](https://nodejs.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [pgAdmin 4](https://www.pgadmin.org/)

### 2. Descargar el repositorio

Abrir una terminal y ejecutar:

```bash
git clone https://github.com/JDOC10/CINE-NOCHE-CLUB-SAKILA.git
```

Ingresar a la carpeta:

```bash
cd CINE-NOCHE-CLUB-SAKILA
```

Abrir el proyecto en Visual Studio Code:

```bash
code .
```

### 3. Configurar el Backend

Desde la terminal principal del proyecto ejecutar:

```bash
npm install
```

Crear el archivo `.env` a partir de `.env.example` y configurar las variables necesarias para la conexión a PostgreSQL y los servicios externos.

**Importante:** cada integrante debe configurar sus propias credenciales y claves privadas. No se debe compartir ni subir el archivo `.env` a GitHub.

Iniciar el servidor:

```bash
npm start
```

El backend se ejecutará localmente en:

```text
http://localhost:3000
```

Para comprobar la conexión:

```text
http://localhost:3000/api/estado
```

### 4. Configurar el Frontend

Abrir una segunda terminal en Visual Studio Code y ejecutar:

```bash
cd frontend-react
npm install
```

Crear el archivo `.env` dentro de `frontend-react` con la siguiente configuración para trabajar con el backend local:

```env
VITE_API_URL=http://localhost:3000
```

Iniciar React:

```bash
npm run dev
```

Vite mostrará la dirección local de la aplicación en la terminal. Abrir esa dirección en el navegador.

## 🔐 Seguridad y configuración

- Las contraseñas y claves privadas no deben publicarse en GitHub.
- El archivo `.env` debe mantenerse privado.
- El acceso al panel de administración está protegido mediante autenticación y verificación del rol.
- Cada integrante debe utilizar su propia cuenta de usuario.
- No se debe compartir el token de sesión ni las credenciales personales.

## ☁️ Despliegue

El proyecto cuenta con dos servicios desplegados en Render:

| Servicio | Dirección |
|---|---|
| Frontend | https://cine-noche-frontend.onrender.com |
| Backend | https://cine-noche-backend.onrender.com |

El frontend se comunica con el backend mediante la variable `VITE_API_URL`.

## 👥 Colaboración

Para colaborar en el proyecto:

1. Clonar el repositorio.
2. Crear una rama propia para los cambios.
3. Realizar las modificaciones correspondientes.
4. Probar los cambios localmente.
5. Subir los cambios a GitHub mediante commits y pull requests.

## 📌 Información del proyecto

**Nombre:** CINE NOCHE - CLUB SAKILA

**Repositorio:** JDOC10/CINE-NOCHE-CLUB-SAKILA

**Desarrollado como proyecto académico.**

---

*Proyecto desarrollado con React, Node.js, Express y PostgreSQL.*