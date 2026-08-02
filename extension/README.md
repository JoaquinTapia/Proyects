# extension/

Carpeta reservada para una extensión de navegador que construyas tú mismo, separada
del proyecto Next.js principal (`app/`, `lib/`, `components/`).

**Lo que no vas a encontrar acá, a propósito:** cualquier código que automatice el
llenado o envío de formularios en portales de empleo específicos (LinkedIn, Indeed,
Laborum, Trabajando, etc.), o que reutilice sesiones/cookies de esos sitios para
navegarlos de forma automatizada. Esa es una decisión consciente de este proyecto,
explicada en el README principal.

Si construyes tu propia extensión aquí, algunas ideas de qué SÍ integra bien con
el resto del proyecto sin ese problema:

- Un asistente de rellenado **genérico** (funciona en cualquier formulario HTML
  estándar, no apunta a la estructura interna de un portal específico), que llame
  a tu propio backend (`/api/generate-application/[id]`) para obtener el CV/carta
  ya generados y se los muestre al usuario como sugerencia editable — nunca hace
  submit automático.
- Un botón de "capturar esta oferta" que el usuario presiona manualmente mientras
  navega cualquier portal, y que llama a `POST /api/applications` (ya existe) para
  agregarla a su tracker con el texto que el usuario decide copiar — equivalente a
  lo que ya hace el formulario de "Agregar oferta manual" dentro de la app, solo
  que sin salir de la pestaña donde está navegando.

## Estructura sugerida (cuando la construyas)
```
extension/
  manifest.json
  background.ts
  content.ts
  popup.tsx
  popup.css
  types.ts
```
