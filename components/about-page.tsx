"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { sendContactMessage } from "@/app/about/actions";
import { HighlightIcon } from "@/components/highlight-icon";
import { useReveal } from "@/hooks/use-reveal";
import { validateContactMessage, type ContactMessageInput } from "@/lib/contact";
import { ABOUT_HIGHLIGHTS } from "@/lib/home";

const DIVIDER_PIXELS_COUNT = 24;
const SHAKE_DURATION_MS = 400;
const SEND_ERROR_MESSAGE =
  "NO PUDIMOS ENVIAR TU MENSAJE. REVISA TU CONEXIÓN E INTÉNTALO DE NUEVO.";

const EMPTY_CONTACT_FORM: ContactMessageInput = { name: "", email: "", message: "", website: "" };

// Visually hidden, kept out of the tab order and screen readers: only bots fill it in.
const HONEYPOT_STYLE = { position: "absolute", left: "-9999px", opacity: 0 } as const;

export function AboutPage() {
  const pageRef = useReveal();
  const [formValues, setFormValues] = useState<ContactMessageInput>(EMPTY_CONTACT_FORM);
  const [senderName, setSenderName] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [hasSendError, setHasSendError] = useState(false);
  const [isSending, startSending] = useTransition();

  useEffect(() => {
    if (!isShaking) return;
    const timeoutId = setTimeout(() => setIsShaking(false), SHAKE_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [isShaking]);

  const updateField = (field: keyof ContactMessageInput, value: string) =>
    setFormValues((currentValues) => ({ ...currentValues, [field]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    if (validateContactMessage(formValues).length > 0) {
      setIsShaking(true);
      return;
    }

    setHasSendError(false);
    startSending(async () => {
      try {
        const result = await sendContactMessage(formValues);
        if (result.status === "success") {
          setSenderName(result.senderName);
        } else if (result.status === "invalid") {
          setIsShaking(true);
        } else {
          setHasSendError(true);
        }
      } catch {
        setHasSendError(true);
      }
    });
  };

  const handleSendAnother = () => {
    setSenderName(null);
    setHasSendError(false);
    setFormValues(EMPTY_CONTACT_FORM);
  };

  return (
    <div ref={pageRef} className="about fade-in">
      {/* ABOUT */}
      <section className="about-hero">
        <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y
          celebrar los arcades que definieron una generación, haciéndolos accesibles para todos, en
          cualquier lugar y sin costo.
        </p>

        <div className="highlight-row">
          {ABOUT_HIGHLIGHTS.map((highlight) => (
            <div key={highlight.icon} className={"highlight " + highlight.accentColor}>
              <HighlightIcon kind={highlight.icon} />
              <div className="hl-text pixel">{highlight.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* divider banner */}
      <div className="about-divider reveal" aria-hidden="true">
        <div className="div-bar"></div>
        <div className="div-pixels">
          {Array.from({ length: DIVIDER_PIXELS_COUNT }).map((_, index) => (
            <span key={index} style={{ animationDelay: index * 80 + "ms" }}></span>
          ))}
        </div>
        <div className="div-bar"></div>
      </div>

      {/* CONTACT */}
      <section className="about-contact reveal">
        <div className="contact-grid">
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-sub">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar?
              Escríbenos.
            </p>
            <div className="contact-tips">
              <div className="tip">
                <span className="tip-led"></span>RESPUESTA EN 24-48H
              </div>
              <div className="tip">
                <span className="tip-led y"></span>SUGERENCIAS BIENVENIDAS
              </div>
              <div className="tip">
                <span className="tip-led m"></span>SIN SPAM, JAMÁS
              </div>
            </div>
          </div>

          <form
            className={"contact-form" + (isShaking ? " shake" : "")}
            onSubmit={handleSubmit}
            noValidate
          >
            {senderName === null ? (
              <>
                <div className="field">
                  <label htmlFor="contact-name">NOMBRE</label>
                  <input
                    id="contact-name"
                    value={formValues.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="px_kai"
                  />
                </div>
                <div className="field">
                  <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={formValues.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="jugador@vault.gg"
                  />
                </div>
                <div className="field">
                  <label htmlFor="contact-message">MENSAJE</label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={formValues.message}
                    onChange={(event) => updateField("message", event.target.value)}
                    placeholder="Cuéntanos qué tienes en mente…"
                  ></textarea>
                </div>
                <div style={HONEYPOT_STYLE} aria-hidden="true">
                  <label htmlFor="contact-website">NO LLENAR ESTE CAMPO</label>
                  <input
                    id="contact-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formValues.website}
                    onChange={(event) => updateField("website", event.target.value)}
                  />
                </div>
                {hasSendError && (
                  <div className="form-error" role="alert">
                    {SEND_ERROR_MESSAGE}
                  </div>
                )}
                <button
                  className="btn xl press"
                  type="submit"
                  style={{ width: "100%" }}
                  disabled={isSending}
                >
                  {isSending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
                </button>
              </>
            ) : (
              <div className="terminal-success">
                <div className="term-bar">
                  <span className="dot r"></span>
                  <span className="dot y"></span>
                  <span className="dot g"></span>
                  <span className="term-title">VAULT-OS // TERMINAL</span>
                </div>
                <div className="term-body">
                  <div className="line">
                    <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
                  </div>
                  <div className="line dim">[OK] Conectando con servidor…</div>
                  <div className="line dim">[OK] Validando contenido…</div>
                  <div className="line dim">[OK] Transmitiendo paquete…</div>
                  <div className="line success">
                    &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS,{" "}
                    {senderName.toUpperCase()}.<span className="caret">_</span>
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <button className="btn ghost" type="button" onClick={handleSendAnother}>
                      ENVIAR OTRO MENSAJE
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
