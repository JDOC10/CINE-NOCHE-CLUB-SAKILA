
import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const TEMPLATE_BIENVENIDA = import.meta.env.VITE_EMAILJS_TEMPLATE_BIENVENIDA;
const TEMPLATE_ALQUILER = import.meta.env.VITE_EMAILJS_TEMPLATE_ALQUILER;

export function enviarCorreoBienvenida({ nombre, apellido, correo }) {
  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_BIENVENIDA,
    {
      nombre,
      apellido,
      correo,
    },
    {
      publicKey: PUBLIC_KEY,
    }
  );
}

export function enviarCorreoAlquiler({
  nombre,
  correo,
  pelicula,
  id_alquiler,
  dias_prestamo,
  tarifa,
  total,
}) {
  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ALQUILER,
    {
      nombre,
      correo,
      pelicula,
      id_alquiler,
      dias_prestamo,
      tarifa,
      total,
    },
    {
      publicKey: PUBLIC_KEY,
    }
  );
}
