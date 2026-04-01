"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import TransitionLink from "@/components/layout/TransitionLink/TransitionLink";
import { useRouter } from "next/navigation";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import "./NavBar.scss";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/peliculas", label: "Películas" },
  { href: "/series", label: "Series" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, isGuest, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Cerrar al presionar Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function closeAll() {
    setMenuOpen(false);
    setProfileOpen(false);
  }

  const handleLogout = () => {
    logout();
    closeAll();
    if (!document.startViewTransition) {
      router.push("/");
      return;
    }
    document.startViewTransition(() => router.push("/"));
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <div className="navbar__inner">
          <TransitionLink href="/" className="navbar__logo" onClick={closeAll}>
            Next<span>flix</span>
          </TransitionLink>

          {/* Links desktop */}
          <ul className="navbar__links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <TransitionLink
                  href={link.href}
                  className={
                    pathname === link.href ? "navbar__link--active" : ""
                  }
                  onClick={closeAll}
                >
                  {link.label}
                </TransitionLink>
              </li>
            ))}
            {isLoggedIn && (
              <li>
                <TransitionLink
                  href="/tu-lista"
                  className={
                    pathname === "/tu-lista" ? "navbar__link--active" : ""
                  }
                  onClick={closeAll}
                >
                  Tu Lista
                </TransitionLink>
              </li>
            )}
          </ul>

          <div className="navbar__right">
            <TransitionLink
              href="/buscar"
              className="navbar__search-btn"
              aria-label="Buscar"
              onClick={closeAll}
            >
              <SearchRoundedIcon />
            </TransitionLink>

            <div className="navbar__profile navbar__profile--desktop">
              <button
                className="navbar__avatar"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="Perfil"
              >
                {isLoggedIn && user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Avatar"
                    width={36}
                    height={36}
                    className="navbar__avatar-img"
                  />
                ) : (
                  <span className="navbar__avatar-letter">
                    {isLoggedIn && user?.displayName
                      ? user.displayName[0].toUpperCase()
                      : "G"}
                  </span>
                )}
              </button>

              {profileOpen && (
                <div className="navbar__dropdown">
                  {isLoggedIn && user && (
                    <div className="navbar__user-info">
                      <p className="navbar__user-name">{user.displayName}</p>
                      <p className="navbar__user-email">{user.email}</p>
                    </div>
                  )}
                  {isGuest && <p className="navbar__guest-label">Invitado</p>}
                  <button onClick={handleLogout} className="navbar__logout-btn">
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            <button
              className={`navbar__hamburger ${menuOpen ? "navbar__hamburger--active" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay oscuro */}
      <div
        className={`navbar__overlay ${menuOpen ? "navbar__overlay--visible" : ""}`}
        onClick={closeAll}
        aria-hidden="true"
      />

      {/* Drawer mobile */}
      <div
        ref={drawerRef}
        className={`navbar__drawer ${menuOpen ? "navbar__drawer--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        {/* Botón cerrar */}
        <button
          className="navbar__drawer-close"
          onClick={closeAll}
          aria-label="Cerrar menú"
        >
          <CloseRoundedIcon />
        </button>

        {/* Perfil de usuario */}
        <div className="navbar__drawer-user">
          <div className="navbar__drawer-avatar">
            {isLoggedIn && user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt="Avatar"
                width={56}
                height={56}
                className="navbar__drawer-avatar-img"
              />
            ) : (
              <span className="navbar__drawer-avatar-letter">
                {isLoggedIn && user?.displayName
                  ? user.displayName[0].toUpperCase()
                  : "G"}
              </span>
            )}
          </div>
          <div className="navbar__drawer-user-info">
            <p className="navbar__drawer-user-name">
              {isLoggedIn && user?.displayName ? user.displayName : "Invitado"}
            </p>
            {isLoggedIn && user?.email && (
              <p className="navbar__drawer-user-email">{user.email}</p>
            )}
          </div>
        </div>

        {/* Links de navegación */}
        <ul className="navbar__drawer-links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <TransitionLink
                href={link.href}
                className={pathname === link.href ? "navbar__link--active" : ""}
                onClick={closeAll}
              >
                {link.label}
              </TransitionLink>
            </li>
          ))}
          {isLoggedIn && (
            <li>
              <TransitionLink
                href="/tu-lista"
                className={
                  pathname === "/tu-lista" ? "navbar__link--active" : ""
                }
                onClick={closeAll}
              >
                Tu Lista
              </TransitionLink>
            </li>
          )}
        </ul>

        {/* Botón cerrar sesión al fondo */}
        <button className="navbar__drawer-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </>
  );
}
