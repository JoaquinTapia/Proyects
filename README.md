# TalentIA

Plataforma de búsqueda de empleo asistida por IA: rastrea ofertas en múltiples portales, las prioriza según qué tanto calzan con tu perfil (matching semántico por embeddings), y genera un CV adaptado + carta de motivación + análisis ATS para cada postulación — todo en un tracker tipo pipeline, con seguimiento de entrevistas y resultados.

Construido como proyecto personal full-stack para aprender Next.js, Supabase y la integración de LLMs en un producto real.

## Stack técnico

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: API Routes de Next.js
- **Base de datos**: Supabase (Postgres + Auth + Storage), con Row Level Security en todas las tablas
- **IA**: API de Claude (Anthropic) para generación de CV/carta y extracción estructurada de currículums
- **Embeddings**: Voyage AI para matching semántico entre perfil y ofertas
- **Generación de PDF**: `@react-pdf/renderer`, renderizado 100% en servidor
- **Extracción de PDF**: extracción consciente de layout (detecta columnas por coordenadas) + reconstrucción estructurada vía IA

## Funcionalidades

**Autenticación y perfil**
- Registro / login con Supabase Auth
- Onboarding: sube tu CV (PDF), el sistema extrae y reestructura tu experiencia con fidelidad total (sin resumir ni inventar), define tus preferencias de búsqueda (rol, modalidad, salario, seniority, país)

**Búsqueda de ofertas**
- Multi-fuente: Remotive, Arbeitnow, Jobicy, Himalayas, y Adzuna (opcional, con API key)
- Filtro de relevancia por palabras de dominio (descarta ofertas que no tienen que ver con el rol buscado)
- Filtro heurístico de visa/ciudadanía (descarta ofertas que exigen autorización de trabajo que el usuario no tiene)
- Matching semántico vía embeddings (Voyage AI) con fallback a un método por palabras clave si no está configurado

**Generación con IA**
- CV adaptado por oferta: reordena y prioriza tu experiencia real (nunca inventa) optimizado para ATS, en el mismo idioma de la oferta
- Carta de motivación personalizada
- Reporte ATS: puntaje estimado, palabras clave presentes/faltantes, resumen de cambios
- Descarga en PDF con diseño propio

**Tracker**
- Estados: nuevo / revisando / postulado / descartado
- Ordenado por puntaje de match
- Seguimiento por postulación: entrevistas, rechazos, ofertas, notas con fecha
- Agregar ofertas manualmente (útil para las que no cubren las fuentes automáticas, ej. LinkedIn)

**Landing page pública**
- Con sección de reseñas reales dejadas por usuarios logeados

## Decisiones de diseño (y límites conscientes)

- **No hay auto-apply.** El envío de postulaciones siempre lo hace la persona, manualmente. Automatizar el llenado/envío en plataformas como LinkedIn o Indeed viola sus Términos de Servicio (acceso automatizado no autorizado), sin importar si el "clic final" queda en manos del usuario — el riesgo está en el bot navegando la plataforma, no en quién aprieta el botón. El producto se diseñó deliberadamente para dejar todo listo (CV, carta, datos) y que el usuario decida y actúe.
- El matching por embeddings es la fuente de verdad cuando está configurado; el método por palabras clave es un respaldo intencional, no la solución final — es más ruidoso y así se documenta en el propio código.
- El filtro de visa es heurístico (basado en patrones de texto comunes), no infalible.

## Cómo levantarlo

### 1. Crear el proyecto en Supabase (gratis)
1. Ve a [supabase.com](https://supabase.com) → **New project**
2. En **SQL Editor**, corre en orden los scripts de `supabase/` (cada uno agrega una parte del esquema):
   - `schema.sql` (base: perfiles, preferencias, ofertas, postulaciones)
   - `storage_setup.sql` y `tailored_cvs_bucket.sql` (buckets para CVs)
   - `add_match_score.sql`, `add_country.sql`, `add_ats_report.sql`
   - `reviews.sql`
   - `embeddings_and_tracking.sql`
3. En **Project Settings → API**, copia `Project URL` y `anon public key`

### 2. Variables de entorno
Crea `.env.local` en la raíz:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Generación de CV/carta/análisis ATS
ANTHROPIC_API_KEY=sk-ant-...

# Matching semántico (opcional pero recomendado — sin esto usa el método de respaldo)
VOYAGE_API_KEY=...

# Fuente de ofertas adicional (opcional)
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
ADZUNA_COUNTRY=cl
```

### 3. Instalar y correr
```bash
npm install
npm run dev
```
Abre `http://localhost:3000`.

## Estructura del proyecto

```
app/
  (dashboard)/       → rutas protegidas con sidebar: tracker, onboarding, agregar oferta, reseñas
  login/ signup/      → autenticación
  api/                → endpoints: applications, search-jobs, generate-application,
                         cv-upload, cv-download, profile, reviews
lib/
  supabase/           → clientes de Supabase (browser y server)
  matching.ts          → scoring por palabras clave (respaldo) + por embeddings
  embeddings.ts         → integración con Voyage AI
  pdfExtract.ts         → extracción de PDF consciente de layout/columnas
  pdf/tailoredCv.tsx     → generación del CV en PDF
  visaFilter.ts          → heurística de filtro por visa/ciudadanía
  language.ts             → detección de idioma para generar en el idioma correcto
components/            → Sidebar, TrackerBoard, Logo, UI compartida
supabase/               → scripts SQL (schema + migraciones incrementales)
middleware.ts            → protección de rutas por sesión
```

---

Proyecto personal de [Joaquín Tapia](https://github.com/JoaquinTapia) — Data Engineer.
