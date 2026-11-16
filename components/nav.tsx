"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

const HALL_OF_FAME_PATH = "/hall-of-fame";
const AUTH_PATH = "/auth";

function isLibraryPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/games");
}

export function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const activeClassName = (isActive: boolean) => (isActive ? "active" : undefined);

  const isLibraryActive = isLibraryPath(pathname);
  const isHallOfFameActive = pathname === HALL_OF_FAME_PATH;
  const isAuthActive = pathname === AUTH_PATH;

  const handleSignOut = () => {
    closeMobileMenu();
    signOut();
  };

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo">
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={activeClassName(isLibraryActive)}>
            Biblioteca
          </Link>
          <Link href={HALL_OF_FAME_PATH} className={activeClassName(isHallOfFameActive)}>
            Salón de la Fama
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button
            type="button"
            className="btn ghost auth-btn"
            onClick={handleSignOut}
            title="Cerrar sesión"
            aria-label={`Cerrar sesión de ${user.name}`}
          >
            {user.name} ▾
          </button>
        ) : (
          <Link href={AUTH_PATH} className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}
        <button
          type="button"
          className="btn ghost hamburger"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (isMobileMenuOpen ? " open" : "")}
        onClick={closeMobileMenu}
      ></div>
      <aside className={"av-mobile-panel" + (isMobileMenuOpen ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link href="/" className={activeClassName(isLibraryActive)} onClick={closeMobileMenu}>
          Biblioteca
        </Link>
        <Link
          href={HALL_OF_FAME_PATH}
          className={activeClassName(isHallOfFameActive)}
          onClick={closeMobileMenu}
        >
          Salón de la Fama
        </Link>
        {user ? (
          <Link href="/" onClick={handleSignOut}>
            Cerrar sesión
          </Link>
        ) : (
          <Link href={AUTH_PATH} className={activeClassName(isAuthActive)} onClick={closeMobileMenu}>
            Iniciar Sesión
          </Link>
        )}
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
