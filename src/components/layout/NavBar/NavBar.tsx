"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, Link } from "@/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import TransitionLink from "@/components/layout/TransitionLink/TransitionLink";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher/LanguageSwitcher";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import "./NavBar.scss";

export default function NavBar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, isGuest, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const NAV_LINKS = [
    { href: "/", label: t("home") },
    { href: "/movies", label: t("movies") },
    { href: "/series", label: t("series") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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
                  href="/my-list"
                  className={
                    pathname === "/my-list" ? "navbar__link--active" : ""
                  }
                  onClick={closeAll}
                >
                  {t("myList")}
                </TransitionLink>
              </li>
            )}
          </ul>

          <div className="navbar__right">
            <LanguageSwitcher />

            <TransitionLink
              href="/search"
              className="navbar__search-btn"
              aria-label={t("search")}
              onClick={closeAll}
            >
              <SearchRoundedIcon />
            </TransitionLink>

            <div className="navbar__profile navbar__profile--desktop">
              <button
                className="navbar__avatar"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label={t("search")}
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
                  {isGuest && (
                    <p className="navbar__guest-label">{t("guest")}</p>
                  )}
                  <button onClick={handleLogout} className="navbar__logout-btn">
                    {t("logout")}
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
        <button
          className="navbar__drawer-close"
          onClick={closeAll}
          aria-label="Cerrar menú"
        >
          <CloseRoundedIcon />
        </button>

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
              {isLoggedIn && user?.displayName ? user.displayName : t("guest")}
            </p>
            {isLoggedIn && user?.email && (
              <p className="navbar__drawer-user-email">{user.email}</p>
            )}
          </div>
        </div>

        {/* Language switcher en drawer */}
        <div style={{ padding: "0 1.5rem 1rem" }}>
          <LanguageSwitcher />
        </div>

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
                href="/my-list"
                className={
                  pathname === "/my-list" ? "navbar__link--active" : ""
                }
                onClick={closeAll}
              >
                {t("myList")}
              </TransitionLink>
            </li>
          )}
        </ul>

        <button className="navbar__drawer-logout" onClick={handleLogout}>
          {t("logout")}
        </button>
      </div>
    </>
  );
}
