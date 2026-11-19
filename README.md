# Club Sakila estilo Netflix

## Pasos en VS Code (Windows)

1. Instala Node.js LTS.
2. Abre esta carpeta en VS Code y abre Terminal > New Terminal.
3. Ejecuta `npm install`.
4. Copia `.env.example` como `.env` y cambia `DB_PASSWORD` por tu contraseña local de PostgreSQL. No compartas este archivo.
5. Confirma que la base se llama exactamente `Club Sakila` y que tiene `public.pelicula` y `public.categoria`.
6. Ejecuta `npm start`.
7. Entra en **http://localhost:3000** (NO uses Live Server 5500).
8. Comprueba **http://localhost:3000/api/estado** y **http://localhost:3000/api/peliculas**.

La aplicación lee películas reales de PostgreSQL. Carrito e historial son demostraciones guardadas en localStorage, NO crean alquileres en PostgreSQL. Para escribir alquileres reales hace falta conocer el esquema completo de `alquiler`, `detalle_alquiler`, `socio` y las reglas de negocio. Los pósteres se muestran si `poster_url` tiene una URL válida; de lo contrario hay una tarjeta de respaldo.
