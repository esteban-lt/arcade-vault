"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";

type AuthMode = "sign-in" | "sign-up";

const DEFAULT_PLAYER_NAME = "PLAYER1";
const MAXIMUM_PLAYER_NAME_LENGTH = 10;

export function AuthForm() {
  const router = useRouter();
  const { signIn, signOut } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const playerName = (username || DEFAULT_PLAYER_NAME)
      .toUpperCase()
      .slice(0, MAXIMUM_PLAYER_NAME_LENGTH);
    signIn({ name: playerName });
    router.push("/games");
  };

  const handlePlayAsGuest = () => {
    signOut();
    router.push("/games");
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.16em", marginTop: 6 }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "sign-in" ? "on" : ""}
            onClick={() => setMode("sign-in")}
          >
            INICIAR SESIÓN
          </button>
          <button
            type="button"
            className={mode === "sign-up" ? "on" : ""}
            onClick={() => setMode("sign-up")}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="auth-username">Usuario</label>
            <input
              id="auth-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="px_kai"
            />
          </div>
          {mode === "sign-up" && (
            <div className="field slide-in">
              <label htmlFor="auth-email">Correo electrónico</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jugador@vault.gg"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-password">Contraseña</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button className="btn lg" type="submit" style={{ width: "100%", marginTop: 8 }}>
            {mode === "sign-in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
          </button>
        </form>

        <button
          type="button"
          className="btn ghost"
          style={{ width: "100%", marginTop: 10 }}
          onClick={handlePlayAsGuest}
        >
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button">
            ◆&nbsp; GOOGLE
          </button>
          <button className="btn ghost" type="button">
            ▣&nbsp; GITHUB
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
