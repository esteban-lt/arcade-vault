"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { useAuth } from "@/components/auth-provider";
import { USERNAME_PATTERN } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const AUTH_ERROR_MESSAGES = {
  emptyFields: "Completa todos los campos.",
  invalidEmail: "Escribe un correo electrónico válido.",
  invalidUsername: "El usuario debe tener de 3 a 20 caracteres: letras, números y _.",
  usernameTaken: "Ese usuario ya está en uso. Elige otro.",
  emailTaken: "Ese correo ya está registrado. Inicia sesión.",
  invalidCredentials: "Correo o contraseña incorrectos.",
  weakPassword: "La contraseña es demasiado débil: usa al menos 6 caracteres.",
  tooManyRequests: "Demasiados intentos. Espera un momento y vuelve a probar.",
  sessionNotStarted: "Cuenta creada, pero no se inició la sesión. Prueba a iniciar sesión.",
  unknown: "No se pudo completar la operación. Inténtalo de nuevo.",
} as const;

// Maps Supabase errors to Spanish messages; the raw error text is never shown to the player.
function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return AUTH_ERROR_MESSAGES.invalidCredentials;
    case "user_already_exists":
    case "email_exists":
      return AUTH_ERROR_MESSAGES.emailTaken;
    case "weak_password":
      return AUTH_ERROR_MESSAGES.weakPassword;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return AUTH_ERROR_MESSAGES.tooManyRequests;
  }
  // The profile trigger fails the sign-up when the username is already taken. The format is
  // validated before submitting, so this database error means the username is in use.
  if (error.message.includes("Database error saving new user")) {
    return AUTH_ERROR_MESSAGES.usernameTaken;
  }
  return AUTH_ERROR_MESSAGES.unknown;
}

export function AuthForm() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
  };

  const validateForm = (): string | null => {
    const hasEmptyField = !email.trim() || !password || (mode === "sign-up" && !username.trim());
    if (hasEmptyField) return AUTH_ERROR_MESSAGES.emptyFields;
    if (!EMAIL_PATTERN.test(email.trim())) return AUTH_ERROR_MESSAGES.invalidEmail;
    if (mode === "sign-up" && !USERNAME_PATTERN.test(username.trim())) {
      return AUTH_ERROR_MESSAGES.invalidUsername;
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const supabase = createClient();
    const trimmedEmail = email.trim();

    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setErrorMessage(getAuthErrorMessage(error));
          setIsSubmitting(false);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: { data: { username: username.trim() } },
        });
        if (error) {
          setErrorMessage(getAuthErrorMessage(error));
          setIsSubmitting(false);
          return;
        }
        if (!data.session) {
          setErrorMessage(AUTH_ERROR_MESSAGES.sessionNotStarted);
          setIsSubmitting(false);
          return;
        }
      }
    } catch {
      setErrorMessage(AUTH_ERROR_MESSAGES.unknown);
      setIsSubmitting(false);
      return;
    }

    // Stays disabled on success so a double click cannot submit twice while navigating.
    router.push("/games");
  };

  const handlePlayAsGuest = async () => {
    await signOut();
    router.push("/games");
  };

  const submitLabel =
    mode === "sign-in"
      ? isSubmitting ? "ENTRANDO…" : "ENTRAR AL VAULT"
      : isSubmitting ? "CREANDO…" : "CREAR Y JUGAR";

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
            onClick={() => changeMode("sign-in")}
            disabled={isSubmitting}
          >
            INICIAR SESIÓN
          </button>
          <button
            type="button"
            className={mode === "sign-up" ? "on" : ""}
            onClick={() => changeMode("sign-up")}
            disabled={isSubmitting}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {mode === "sign-up" && (
            <div className="field slide-in">
              <label htmlFor="auth-username">Usuario</label>
              <input
                id="auth-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="px_kai"
                autoComplete="username"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-email">Correo electrónico</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jugador@vault.gg"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Contraseña</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            />
          </div>

          {errorMessage && (
            <div className="form-error" role="alert" style={{ marginTop: 8 }}>
              {errorMessage}
            </div>
          )}

          <button
            className="btn lg"
            type="submit"
            disabled={isSubmitting}
            style={{ width: "100%", marginTop: 8 }}
          >
            {submitLabel}
          </button>
        </form>

        <button
          type="button"
          className="btn ghost"
          style={{ width: "100%", marginTop: 10 }}
          onClick={handlePlayAsGuest}
          disabled={isSubmitting}
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
