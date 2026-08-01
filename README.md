# JobPipeline — Tracker de postulaciones (multiusuario)

Web app con login, registro y tracker de postulaciones por usuario. Base para
convertirlo en producto/suscripción más adelante.

## Qué incluye ya
- **Registro / login** con email y contraseña (Supabase Auth).
- **Base de datos** con perfiles, preferencias, ofertas y postulaciones — cada
  usuario solo ve las suyas (Row Level Security activado).
- **Tracker** funcional: filtrar por estado, cambiar estado, link para postular.

## Qué falta para el producto completo (próximos pasos, iremos paso a paso)
- Formulario para que el usuario cargue su CV y preferencias.
- Búsqueda automática de ofertas (vía APIs de portales de empleo).
- Generación de CV/carta adaptada con la API de Claude.
- Stripe para cobrar la suscripción.

## Cómo levantarlo tú mismo

### 1. Crear el proyecto en Supabase (gratis)
1. Ve a https://supabase.com → **New project**.
2. Cuando esté listo, entra a **SQL Editor** → pega el contenido de
   `supabase/schema.sql` → **Run**. Esto crea todas las tablas y permisos.
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

### 2. Configurar variables de entorno
```bash
cp .env.local.example .env.local
```
Pega ahí la URL y la key que copiaste.

### 3. Instalar dependencias y correr en local
```bash
npm install
npm run dev
```
Abre http://localhost:3000 — te debería llevar directo a `/login`.

### 4. Probar el flujo
1. Crea una cuenta en `/signup` (Supabase te manda un correo de confirmación).
2. Confirma el correo, inicia sesión.
3. Verás el tracker vacío — normal, porque `job_postings` está vacío. Podemos
   agregar ofertas de prueba desde el SQL Editor de Supabase mientras armamos
   el módulo de búsqueda automática.

### 5. Publicarlo (cuando esté listo)
El deploy más simple es con **Vercel** (gratis para empezar):
```bash
npx vercel
```
Solo asegúrate de configurar las mismas variables de entorno en el panel de Vercel.

## Estructura del proyecto
```
app/
  login/          → página de inicio de sesión
  signup/         → página de registro
  tracker/        → tracker protegido (requiere login)
  api/
    applications/ → CRUD de postulaciones del usuario
lib/supabase/      → clientes de Supabase (browser y server)
components/         → UI compartida
supabase/schema.sql → estructura completa de la base de datos
middleware.ts       → protege rutas y redirige según sesión
```
