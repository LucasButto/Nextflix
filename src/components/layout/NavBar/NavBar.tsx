"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar menú y perfil cuando cambia la ruta sin useEffect
  const isMenuOpen = menuOpen;
  const isProfileOpen = profileOpen;

  function closeAll() {
    setMenuOpen(false);
    setProfileOpen(false);
  }

  const handleLogout = () => {
    logout();
    closeAll();
    router.push("/");
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__inner">
        <Link href="/" className="navbar__logo" onClick={closeAll}>
          Next<span>flix</span>
        </Link>

        <ul
          className={`navbar__links ${isMenuOpen ? "navbar__links--open" : ""}`}
        >
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={pathname === link.href ? "navbar__link--active" : ""}
                onClick={closeAll}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {isLoggedIn && (
            <li>
              <Link
                href="/tu-lista"
                className={
                  pathname === "/tu-lista" ? "navbar__link--active" : ""
                }
                onClick={closeAll}
              >
                Tu Lista
              </Link>
            </li>
          )}
        </ul>

        <div className="navbar__right">
          <Link
            href="/buscar"
            className="navbar__search-btn"
            aria-label="Buscar"
            onClick={closeAll}
          >
            <SearchRoundedIcon />
          </Link>

          <div className="navbar__profile">
            <button
              className="navbar__avatar"
              onClick={() => setProfileOpen(!isProfileOpen)}
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

            {isProfileOpen && (
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
            className={`navbar__hamburger ${isMenuOpen ? "navbar__hamburger--active" : ""}`}
            onClick={() => setMenuOpen(!isMenuOpen)}
            aria-label="Menú"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  );
}
