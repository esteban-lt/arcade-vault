"use client";

import { useEffect, useState, type FormEvent } from "react";
import { HighlightIcon } from "@/components/highlight-icon";
import { useReveal } from "@/hooks/use-reveal";
import { ABOUT_HIGHLIGHTS } from "@/lib/home";

const DIVIDER_PIXELS_COUNT = 24;
const SHAKE_DURATION_MS = 400;

type ContactFormValues = {
  name: string;
  email: string;
  message: string;
};

const EMPTY_CONTACT_FORM: ContactFormValues = { name: "", email: "", message: "" };

export function AboutPage() {
  const pageRef = useReveal();
  const [formValues, setFormValues] = useState<ContactFormValues>(EMPTY_CONTACT_FORM);
  const [senderName, setSenderName] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!isShaking) return;
    const timeoutId = setTimeout(() => setIsShaking(false), SHAKE_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [isShaking]);

  const updateField = (field: keyof ContactFormValues, value: string) =>
    setFormValues((currentValues) => ({ ...currentValues, [field]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasEmptyField = Object.values(formValues).some((value) => !value.trim());
    if (hasEmptyField) {
      setIsShaking(true);
      return;
    }
    setSenderName(formValues.name.trim());
  };

  const handleSendAnother = () => {
    setSenderName(null);
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
                <button className="btn xl press" type="submit" style={{ width: "100%" }}>
                  ▶&nbsp; ENVIAR MENSAJE
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
