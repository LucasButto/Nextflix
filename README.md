# 🎬 Nextflix

Una plataforma de descubrimiento de películas y series inspirada en Netflix, construida con Next.js 16, React 19 y la API de TMDB.

![Nextflix](public/Logo.png)

>[!NOTE]
> Puedes visualizar una version de este proyecto en [Nextflix-Web](https://nextflix-web.vercel.app/).

---

## 📋 Tabla de contenidos

- [Características](#-características)
- [Stack tecnológico](#-stack-tecnológico)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Páginas y rutas](#-páginas-y-rutas)
- [Configuración del entorno](#-configuración-del-entorno)
- [Instalación y uso](#-instalación-y-uso)
- [Internacionalización](#-internacionalización)
- [Autenticación](#-autenticación)
- [Watchlist y Ya vistas](#-watchlist-y-ya-vistas)
- [Open Graph / SEO](#-open-graph--seo)
- [Arquitectura de servicios](#-arquitectura-de-servicios)

---

## ✨ Características

### Contenido
- **Hero Banner** rotativo con las películas y series más populares del día
- **Carruseles** por categoría: Top 10, Populares, Mejor valoradas, En cartelera, por género
- **Páginas de detalle** para películas y series con:
  - Poster, backdrop, título, tagline, sinopsis
  - Clasificación de contenido (ATP, TV-MA, R, +16, etc.)
  - Rating, año, duración/temporadas, géneros
  - Estado de la serie (En emisión / Finalizada / Cancelada)
  - Próximo episodio o próximo estreno (con resaltado especial si es hoy)
  - Dónde ver (plataformas de streaming disponibles por región)
  - Trailer de YouTube integrado con click-to-play
  - Reparto (top 20 actores con foto y personaje)
  - Recomendaciones y colecciones relacionadas
- **Página de actor** con biografía, datos, filmografía de películas y series
- **Buscador** en tiempo real con debounce de películas, series y actores — ordenado por relevancia de TMDB

### Cuenta y listas
- Login con Google (Firebase Auth)
- Modo invitado con watchlist local en `localStorage`
- **Tu Lista** — guardá películas y series para ver después (sincronizado en Firestore)
- **Ya vistas** — marcá contenido como visto

### UX / UI
- Diseño oscuro estilo Netflix con colores de marca
- Skeleton loading en todas las páginas (sin spinners)
- View Transitions API para navegación fluida entre páginas
- Skeleton con animación shimmer
- Scroll to top automático en cambio de ruta
- Badge de tipo (Película / Serie) en páginas de detalle
- Filtro de script no-latino (excluye contenido con posters en coreano, árabe, etc.)
- Imágenes con fade-in progresivo

### Internacionalización
- Soporte para **Español latino (es-MX)** e **Inglés (en-US)**
- Switcher de idioma tipo toggle en la navbar
- Todos los textos de la API de TMDB se obtienen en el idioma activo
- URLs localizadas: `/` para español (default), `/en/` para inglés

### SEO y Open Graph
- Open Graph images dinámicas para películas y series (backdrop + poster + info)
- OG image estática para home y listados
- `generateMetadata` con `openGraph` y `twitter` en todas las páginas de detalle
- `metadataBase` configurable por variable de entorno

### Seguridad
- Middleware de autenticación (`proxy.ts`) protege `/my-list` para usuarios no logueados
- Cookie `nextflix_auth` como señal de sesión para el middleware (Edge-compatible)
- Firestore como fuente de verdad para datos del usuario

---

## 🛠 Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| UI | React 19 |
| Lenguaje | TypeScript 5 |
| Estilos | SCSS + BEM |
| Iconos | Material UI Icons v7 |
| Auth | Firebase Authentication (Google) |
| Base de datos | Firebase Firestore |
| API de contenido | TMDB (The Movie Database) |
| i18n | next-intl 4 |
| OG Images | @vercel/og (ImageResponse) |

---

## 🗂 Estructura del proyecto

```
nextflix/
├── messages/               # Traducciones
│   ├── es.json             # Español latino
│   └── en.json             # Inglés
├── public/                 # Assets estáticos
│   ├── Logo.png / Logo.svg
│   ├── no-poster.svg
│   └── no-avatar.svg
└── src/
    ├── app/
    │   └── [locale]/       # Todas las rutas bajo el locale
    │       ├── layout.tsx  # Layout principal con providers
    │       ├── page.tsx    # Home
    │       ├── opengraph-image.tsx
    │       ├── movies/
    │       │   ├── page.tsx
    │       │   └── [id]/
    │       │       ├── page.tsx
    │       │       └── opengraph-image.tsx
    │       ├── series/
    │       │   ├── page.tsx
    │       │   └── [id]/
    │       │       ├── page.tsx
    │       │       └── opengraph-image.tsx
    │       ├── actor/[id]/
    │       ├── search/
    │       ├── my-list/
    │       └── not-found.tsx
    ├── components/
    │   ├── auth/LoginGate/         # Pantalla de login
    │   ├── home/HeroBanner/        # Slider hero rotativo
    │   ├── layout/
    │   │   ├── NavBar/             # Navegación principal
    │   │   ├── LanguageSwitcher/   # Toggle ES/EN
    │   │   ├── TransitionLink/     # Links con View Transitions
    │   │   └── ScrollToTop/
    │   ├── series/SeasonEpisodes/  # Selector de temporadas/episodios
    │   └── shared/
    │       ├── Carousel/           # Carrusel horizontal scrolleable
    │       ├── CastCarousel/
    │       ├── FadeImage/          # Next/Image con fade-in
    │       ├── MediaCard/          # Card de película/serie
    │       ├── TrailerPlayer/      # YouTube embed con thumbnail
    │       ├── WatchlistButton/
    │       └── WatchedButton/
    ├── contexts/
    │   ├── AuthContext.tsx         # Sesión y cookie de auth
    │   ├── WatchlistContext.tsx    # Lista para ver (Firestore + localStorage)
    │   └── WatchedContext.tsx      # Contenido ya visto
    ├── firebase/config.ts          # Inicialización Firebase
    ├── i18n/
    │   ├── routing.ts              # Configuración de locales
    │   └── request.ts              # next-intl server config
    ├── navigation.ts               # Link/router/pathname locale-aware
    ├── proxy.ts                    # Middleware: auth guard + intl routing
    ├── services/
    │   ├── tmdb.ts                 # tmdbFetch + tipos base + géneros
    │   ├── tmdb-client.ts          # tmdbFetch para client components
    │   ├── movies.ts               # Funciones de películas
    │   ├── series.ts               # Funciones de series
    │   ├── actors.ts               # Funciones de actores
    │   └── search.ts               # Búsqueda multi
    ├── styles/
    │   ├── _variables.scss         # Colores, tipografía, mixins
    │   ├── _skeletons.scss         # Skeletons de carga
    │   ├── globals.scss
    │   ├── detail.scss             # Estilos compartidos de detalle
    │   └── pages/
    │       ├── actor/
    │       ├── search/
    │       └── my-list/
    ├── types/tmdb.ts               # Todos los tipos de TMDB
    └── utils/
        ├── dates.ts                # Formateo y comparación de fechas
        ├── format.ts               # Runtime, episodios, etc.
        └── media.ts                # getProviders, getCertification, getTrailerKey, etc.
```

---

## 📄 Páginas y rutas

| Ruta | Descripción |
|---|---|
| `/` | Home con hero banner y carruseles |
| `/movies` | Listado de películas por género |
| `/movies/[id]` | Detalle de película |
| `/series` | Listado de series por género |
| `/series/[id]` | Detalle de serie con episodios |
| `/actor/[id]` | Perfil y filmografía de actor |
| `/search` | Búsqueda de películas, series y actores |
| `/my-list` | Watchlist personal (requiere login) |
| `/en/*` | Versión en inglés de cualquier ruta |

---

## ⚙️ Configuración del entorno

Creá un archivo `.env.local` en la raíz con las siguientes variables:

```env
# TMDB API
NEXT_PUBLIC_TMDB_API_KEY=tu_api_key_de_tmdb

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# URL pública (para metadataBase y OG images en producción)
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

### Obtener claves

- **TMDB API Key**: registrate en [themoviedb.org](https://www.themoviedb.org/settings/api) → Configuración → API
- **Firebase**: creá un proyecto en [console.firebase.google.com](https://console.firebase.google.com), habilitá Authentication (Google) y Firestore

### Reglas de Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /watchlists/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /watched/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 🚀 Instalación y uso

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/nextflix.git
cd nextflix

# Instalar dependencias
npm install

# Desarrollo (usa webpack por compatibilidad con next-intl)
npm run dev

# Build de producción
npm run build

# Servidor de producción
npm start
```

> **Nota**: El servidor de desarrollo con Turbopack no es compatible con next-intl en esta versión. Usá `--webpack` (ya configurado en el script `dev`).

---

## 🌍 Internacionalización

El proyecto usa **next-intl 4** con la configuración `localePrefix: "as-needed"`:

- **`/`** → Español latino (locale por defecto, sin prefijo en la URL)
- **`/en/`** → Inglés americano

El switcher de idioma en la navbar alterna entre los dos idiomas manteniendo la ruta actual.

La API de TMDB se consulta en el idioma activo:
- Español → `es-MX`
- Inglés → `en-US`

Los archivos de traducción están en `messages/es.json` y `messages/en.json` con los namespaces: `nav`, `home`, `movies`, `series`, `detail`, `watchlist`, `myList`, `search`, `actor`, `login`, `hero`, `carousel`, `trailer`, `notFound`.

---

## 🔐 Autenticación

El sistema de auth tiene tres estados:

| Estado | Acceso | Lista |
|---|---|---|
| Sin sesión | Solo lectura | — |
| Invitado | Completo | `localStorage` |
| Logueado (Google) | Completo + `/my-list` | Firestore |

El middleware (`proxy.ts`) protege la ruta `/my-list` verificando la cookie `nextflix_auth`. Esta cookie se setea al loguear con Google y se elimina al cerrar sesión.

---

## 📋 Watchlist y Ya vistas

Ambas listas se sincronizan automáticamente con Firestore para usuarios logueados y con `localStorage` para invitados. La estructura en Firestore:

```
watchlists/{uid}/
  items: [{ id, media_type, title, poster_path, vote_average, added_at }]

watched/{uid}/
  items: [{ id, media_type, title, poster_path, vote_average, added_at }]
```

---

## 🖼 Open Graph / SEO

Se generan imágenes OG dinámicas para cada película y serie usando `ImageResponse` de Next.js:

- **`/movies/[id]/opengraph-image`** — backdrop + poster + título + rating + año + tagline + clasificación + plataformas de streaming + logo
- **`/series/[id]/opengraph-image`** — igual que películas + temporadas
- **`/opengraph-image`** — imagen estática de la plataforma (localizada ES/EN)

Para producción, configurá `NEXT_PUBLIC_SITE_URL` para que los meta tags usen la URL correcta.

---

## 🔧 Arquitectura de servicios

### `tmdb.ts` (server-side)

- `tmdbFetch<T>(endpoint, params, languageOverride?)` — fetch genérico con caché en memoria (10 min TTL), detección automática de locale via next-intl
- `filterLatinScript(items)` — filtra contenido con scripts no-latinos para mejorar la calidad de los posters
- Constantes de géneros para películas (`MOVIE_GENRE_IDS`) y series (`TV_GENRE_IDS`)

### `tmdb-client.ts` (client-side)

- `tmdbClientFetch<T>(endpoint, locale, params)` — versión sin `next-intl/server` para usar en client components, recibe el locale explícitamente

### Servicios de películas (`movies.ts`)

`getTrendingMovies` · `getPopularMovies` · `getTopRatedMovies` · `getNowPlayingMovies` · `getUpcomingMovies` · `getTop100Movies` · `getMoviesByGenre` · `getMovieDetails` · `getCollectionDetails` · `getMovieGenreList`

### Servicios de series (`series.ts`)

`getTrendingSeries` · `getPopularSeries` · `getTopRatedSeries` · `getAiringTodaySeries` · `getOnTheAirSeries` · `getTop100Series` · `getSeriesByGenre` · `getSeriesDetails` · `getSeasonDetails` · `getTVGenreList`

### Utilidades (`utils/`)

- **`dates.ts`**: `formatDate` · `formatSpanishDate` · `isUpcoming` · `isToday` · `extractYear` · `calculateAge`
- **`format.ts`**: `formatRuntime` · `formatEpCode`
- **`media.ts`**: `getProviders` · `getTrailerKey` · `getCertification` · `getSeriesStatusInfo` · `getSeriesYearDisplay`

---

## 📝 Licencia

Proyecto personal de uso educativo. Los datos de películas y series son provistos por [TMDB](https://www.themoviedb.org/).

> This product uses the TMDB API but is not endorsed or certified by TMDB.
