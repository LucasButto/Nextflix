# FutureWatch — Migración a Next.js

## 🧩 1. Análisis del Proyecto Original (Vite)

### Estructura original detectada
```
src/
├── App.jsx                              → Componente raíz (routing por estado)
├── App.css                              → Estilos globales mínimos
├── main.jsx                             → Entry point con providers
├── index.css                            → Reset + fuente Montserrat
├── firebase/config.js                   → Firebase init (auth + firestore)
├── contexts/
│   ├── UserContext.jsx                  → Estado de usuario (localStorage)
│   ├── AuthContext.jsx                  → Login Google con Firebase
│   └── StatesContext.jsx                → Estado global (navbar, carousel, width)
├── service/Movies.jsx                   → Llamadas a OMDB + TMDB
├── helpers/mocks/
│   ├── with-result.json                 → Mock hardcodeado (Avengers)
│   └── no-results.json                  → Mock vacío
└── components/
    ├── Login/Login.jsx + .scss          → Pantalla de login
    ├── Home/Home.jsx + .scss            → Página principal
    ├── NavBar/NavBar.jsx + .scss        → Navegación
    ├── CarouselMovies/CarouselMovies.jsx + .scss → Banner carousel
    └── TopList/TopList.jsx + .scss      → Lista top (hardcodeada)
```

### Dependencias originales
- React 18, Vite 5, SWC
- Firebase 10 (auth + firestore)
- MUI Material 5 (Avatar, Menu, MenuItem, Icons)
- React Bootstrap (Carousel)
- Sass

### Lo que sirve ✅
- Firebase config y autenticación Google
- Estructura de contexts (concepto)
- Servicio TMDB (getPopularMovies, getPopularSeries)
- Diseño base del NavBar y Login
- Fuente Montserrat como base tipográfica

### Lo que debe reescribirse 🔄
- **Routing**: De estado `navBar` a rutas reales de Next.js
- **CarouselMovies**: De React Bootstrap a componente custom
- **StatesContext**: Mezcla muchas responsabilidades → separar en hooks
- **NavBar**: De MUI Menu/Avatar a componente custom (elimina MUI)
- **TopList**: Completamente hardcodeado → datos dinámicos de TMDB
- **Servicios**: API key expuesta → variables de entorno

### Lo que se elimina 🗑️
- OMDB API (getMovies con apikey `43c3103b`) → no se usa
- Mock `with-result.json` / `no-results.json` → datos reales
- MUI Material completo → diseño custom más liviano
- React Bootstrap → carousel custom sin dependencia
- `window.innerWidth` en useEffect dependency → hook `useWindowSize`

### Bugs detectados y corregidos
1. **StatesContext**: `useEffect` con `[window.innerWidth]` causa renders infinitos
2. **CarouselMovies.scss**: `object-fit: fill` distorsiona imágenes → `cover`
3. **Provider nesting**: `StatesProvider` envuelve `UserProvider`, pero `AuthProvider` necesita `UserContext` → reordenado
4. **API keys en código fuente**: Movidas a `.env.local`
5. **No hay manejo de errores** en llamadas API → `try/catch` con fallbacks

---

## 🔁 2. Guía de Migración: Vite → Next.js

### Paso 1: Crear el proyecto

```bash
npx create-next-app@14 futurewatch-next --js --no-tailwind --no-src-dir --eslint
# O usar este proyecto directamente:
cd futurewatch-next
npm install
```

### Paso 2: Instalar dependencias

```bash
npm install firebase sass
npm install -D eslint eslint-config-next
```

### Paso 3: Configurar paths y aliases

**jsconfig.json** (ya incluido):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

Reemplaza el alias `@` de Vite (`vite.config.js`) por el de Next.js.

### Paso 4: Variables de entorno

Mover API keys de código a `.env.local`:
- `NEXT_PUBLIC_TMDB_API_KEY`
- `NEXT_PUBLIC_FIREBASE_*`

En Vite se usa `import.meta.env`; en Next.js se usa `process.env`.

### Paso 5: Transformación del código

| Vite (antes)                          | Next.js (después)                          |
|---------------------------------------|-------------------------------------------|
| `src/main.jsx` (ReactDOM.createRoot)  | `src/app/layout.js` (providers + layout)  |
| `src/App.jsx` (estado navBar)         | Eliminado → routing por carpetas          |
| `src/App.css`                         | `src/styles/globals.scss`                 |
| `src/index.css`                       | Merged en `globals.scss`                  |
| `index.html` (Bootstrap CDN)         | Eliminado → sin CDN externo              |
| `src/components/Home/Home.jsx`        | `src/app/page.js` (Server Component)     |
| `src/components/Login/Login.jsx`      | `src/components/auth/LoginGate/`          |
| `src/components/NavBar/NavBar.jsx`    | `src/components/layout/NavBar/` (Link)    |
| `src/contexts/StatesContext.jsx`      | Eliminado → hooks individuales            |
| `src/contexts/UserContext.jsx`        | Fusionado en `AuthContext.jsx`            |
| `src/service/Movies.jsx`             | `src/services/movies.js` + `series.js`    |
| CSS imports (`./Home.scss`)           | SCSS por componente (`./Home.scss` BEM)   |
| React Bootstrap `<Carousel>`         | `src/components/shared/Carousel/`         |
| MUI `<Avatar>`, `<Menu>`             | Componentes HTML/CSS custom               |

### Paso 6: Routing

| Ruta de la app       | Archivo Next.js                    | Antes                 |
|----------------------|------------------------------------|-----------------------|
| `/`                  | `src/app/page.js`                  | `navBar === "Home"`   |
| `/peliculas`         | `src/app/peliculas/page.js`        | `navBar === "Movies"` |
| `/series`            | `src/app/series/page.js`           | `navBar === "Series"` |
| `/tu-lista`          | `src/app/tu-lista/page.js`         | `navBar === "WatchList"` |
| `/pelicula/[id]`     | `src/app/pelicula/[id]/page.js`    | No existía            |
| `/serie/[id]`        | `src/app/serie/[id]/page.js`       | No existía            |
| `/actor/[id]`        | `src/app/actor/[id]/page.js`       | No existía            |
| `/buscar`            | `src/app/buscar/page.js`           | No existía            |

---

## 📁 Estructura Final del Proyecto

```
futurewatch-next/
├── .env.local                    ← Variables de entorno (API keys)
├── .gitignore
├── jsconfig.json                 ← Alias @/ → src/
├── next.config.js                ← Config de imágenes remotas + env
├── package.json
│
├── public/
│   ├── no-poster.svg             ← Placeholder para posters
│   └── no-avatar.svg             ← Placeholder para actores
│
└── src/
    ├── app/                      ← RUTAS (App Router)
    │   ├── layout.js             ← Layout raíz + Providers
    │   ├── page.js               ← HOME (Server Component)
    │   ├── loading.js            ← Loading global
    │   ├── not-found.js          ← 404 custom
    │   ├── peliculas/page.js     ← PELÍCULAS por género
    │   ├── series/page.js        ← SERIES por género
    │   ├── tu-lista/
    │   │   ├── page.js           ← TU LISTA (Client)
    │   │   └── watchlist.module.scss
    │   ├── buscar/
    │   │   ├── page.js           ← BÚSQUEDA (Client)
    │   │   └── search.module.scss
    │   ├── pelicula/[id]/page.js ← DETALLE PELÍCULA
    │   ├── serie/[id]/page.js    ← DETALLE SERIE
    │   └── actor/[id]/
    │       ├── page.js           ← PÁGINA ACTOR
    │       └── actor.module.scss
    │
    ├── components/
    │   ├── auth/
    │   │   └── LoginGate/        ← Login + Gate de autenticación
    │   ├── home/
    │   │   └── HeroBanner/       ← Banner hero con slideshow
    │   ├── layout/
    │   │   └── NavBar/           ← Navegación principal
    │   ├── series/
    │   │   └── SeasonEpisodes/   ← Selector de temporadas/episodios
    │   └── shared/
    │       ├── Carousel/         ← Carrusel horizontal reutilizable
    │       ├── MediaCard/        ← Card para películas/series
    │       └── WatchlistButton/  ← Botón "Agregar a mi lista"
    │
    ├── contexts/
    │   ├── AuthContext.jsx       ← Auth Firebase + guest mode
    │   └── WatchlistContext.jsx  ← Watchlist con Firestore + localStorage
    │
    ├── hooks/
    │   └── useFetch.js           ← useFetch, useDebounce, useWindowSize
    │
    ├── services/
    │   ├── tmdb.js               ← Config base, cache, helpers de imágenes
    │   ├── movies.js             ← Endpoints de películas
    │   ├── series.js             ← Endpoints de series
    │   ├── actors.js             ← Endpoints de actores
    │   └── search.js             ← Búsqueda multi
    │
    ├── firebase/
    │   └── config.js             ← Firebase init
    │
    └── styles/
        ├── _variables.scss       ← Variables, mixins, breakpoints
        ├── globals.scss          ← Reset + estilos globales
        └── detail.module.scss    ← Estilos compartidos de detalle
```

---

## 🚀 Cómo Ejecutar

```bash
cd futurewatch-next
npm install
npm run dev
```

Abrir `http://localhost:3000`

### Build de producción
```bash
npm run build
npm start
```

---

## 🎨 Cambios de Diseño (estilo Netflix)

| Elemento              | Antes                                | Después                                    |
|-----------------------|--------------------------------------|--------------------------------------------|
| Tipografía            | Solo Montserrat                      | Bebas Neue (títulos) + DM Sans (cuerpo)    |
| Color primario        | `#ad65e0` (claro)                    | `#a855f7` (vibrante, con glow effect)      |
| Fondo                 | `#121212`                            | `#0a0a0a` (más oscuro, más contraste)      |
| Navbar                | Gradient simple                      | Glass effect con blur + scroll detection    |
| Cards                 | Básicas sin hover                    | Scale + shadow + glow en hover             |
| Carousel              | React Bootstrap                      | Custom con flechas glass, scroll suave     |
| Hero banner           | Carousel simple                      | Fullscreen con gradient overlay + autoplay  |
| Top 10                | Hardcodeado                          | Números stroke con glow purple             |
| Loading               | Ninguno                              | Shimmer skeletons + spinners               |
| Transiciones          | Mínimas                              | fadeInUp, slideInRight, scale en hover     |

---

## 📡 API (TMDB) — Endpoints Utilizados

| Servicio          | Endpoint                                    | Uso                          |
|-------------------|---------------------------------------------|------------------------------|
| `movies.js`       | `/trending/movie/{day\|week}`               | Top 10, Hero                 |
| `movies.js`       | `/movie/popular`                            | Carousel popular             |
| `movies.js`       | `/movie/top_rated`                          | Mejor valoradas              |
| `movies.js`       | `/movie/now_playing`                        | En cartelera                 |
| `movies.js`       | `/discover/movie?with_genres=X`             | Películas por género         |
| `movies.js`       | `/movie/{id}?append_to_response=...`        | Detalle completo             |
| `series.js`       | `/trending/tv/{day\|week}`                  | Top 10 series, Hero          |
| `series.js`       | `/tv/popular`                               | Series populares             |
| `series.js`       | `/discover/tv?with_genres=X`                | Series por género            |
| `series.js`       | `/tv/{id}?append_to_response=...`           | Detalle completo             |
| `series.js`       | `/tv/{id}/season/{n}`                       | Episodios de temporada       |
| `actors.js`       | `/person/{id}?append_to_response=...`       | Detalle actor + filmografía  |
| `search.js`       | `/search/multi`                             | Búsqueda global              |

Todos los endpoints pasan por `tmdbFetch()` en `tmdb.js` que:
- Agrega `api_key` y `language=es-ES` automáticamente
- Cachea respuestas por 10 minutos en memoria
- Usa `next: { revalidate: 600 }` para ISR de Next.js

---

## 🧠 13. Sugerencias Adicionales

1. **Server Actions para watchlist**: Usar Server Actions de Next.js para operaciones de Firestore más seguras
2. **Middleware de auth**: Proteger rutas como `/tu-lista` con middleware de Next.js
3. **Infinite scroll**: Agregar paginación infinita en las páginas de género
4. **Trailers**: Integrar reproductor de YouTube para los trailers (ya viene en `append_to_response=videos`)
5. **PWA**: Agregar manifest.json y service worker para instalación nativa
6. **Internacionalización**: Soporte multi-idioma con `next-intl`
7. **OG Images**: Generar imágenes de Open Graph dinámicas para compartir en redes
8. **Analytics**: Integrar Firebase Analytics o Vercel Analytics
9. **Dark/Light mode**: Toggle de tema con CSS variables
10. **Testing**: Agregar tests con Jest + React Testing Library
11. **Rate limiting**: Implementar rate limiting en las llamadas a TMDB para evitar bloqueos
12. **Skeleton loading**: Agregar componentes skeleton específicos por sección
