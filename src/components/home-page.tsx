"use client";

import Link from "next/link";
import { FeatureIcon } from "@/components/feature-icon";
import { HomeSilhouettes } from "@/components/home-silhouettes";
import { useReveal } from "@/hooks/use-reveal";
import { GAMES, findGameById } from "@/lib/games";
import {
  HOME_FEATURES,
  HOME_STATS,
  PRICING_FAQ,
  PRICING_INCLUDED_BENEFITS,
  RECENT_SCORES,
  TOP_PLAYERS_TODAY,
} from "@/lib/home";

const PREVIEW_GAMES_COUNT = 6;
const TOP_RANK_CLASS_NAMES = ["top1", "top2", "top3"];
const REVEAL_STAGGER_MS = 80;

export function HomePage() {
  const pageRef = useReveal();
  const previewGames = GAMES.slice(0, PREVIEW_GAMES_COUNT);

  return (
    <div ref={pageRef} className="home fade-in">
      {/* HERO */}
      <section className="home-hero">
        <HomeSilhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERTA UNA MONEDA<span className="blink">_</span>
          </div>
          <h1 className="home-title">
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className="home-sub">
            Juega los mejores clásicos directamente en tu navegador.
            <br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className="home-ctas">
            <Link href="/games" className="btn xl pulse">
              ▶&nbsp; EXPLORAR JUEGOS
            </Link>
            <Link href="/auth" className="btn xl magenta">
              ✦&nbsp; CREAR CUENTA
            </Link>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true">
          <span>DESLIZA</span>
          <span className="arrow">▼</span>
        </div>
      </section>

      {/* WHY */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-magenta">{"// 01"}</div>
          <h2 className="section-title">¿POR QUÉ ARCADE VAULT?</h2>
          <div className="section-rule"></div>
        </div>
        <div className="feature-grid">
          {HOME_FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={"feature-card " + feature.accentColor}
              style={{ transitionDelay: index * REVEAL_STAGGER_MS + "ms" }}
            >
              <FeatureIcon kind={feature.icon} />
              <div className="ft-title pixel">{feature.title}</div>
              <div className="ft-desc">{feature.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GAMES PREVIEW */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-cyan">{"// 02"}</div>
          <h2 className="section-title">JUEGOS DISPONIBLES AHORA</h2>
          <div className="section-rule"></div>
        </div>
        <div className="mini-rail">
          {previewGames.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`} className="mini-card block">
              <div className="mini-cover">
                <div className={"cover-bg " + game.coverClassName}></div>
              </div>
              <div className="mini-meta">
                <div className="mini-title">{game.title}</div>
                <div className="mini-cat">{game.category}</div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/games" className="btn lg">
            VER TODOS LOS JUEGOS →
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="home-stats reveal">
        <div className="stats-inner">
          {HOME_STATS.map((stat, index) => (
            <div
              key={stat.unit}
              className="stat-block"
              style={{ transitionDelay: index * 90 + "ms" }}
            >
              <div className="stat-n neon-yellow">{stat.value}</div>
              <div className="stat-u pixel">{stat.unit}</div>
              <div className="stat-s">{stat.caption}</div>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT ACTIVITY / LEADERBOARD */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-yellow">{"// 03"}</div>
          <h2 className="section-title">ACTIVIDAD EN VIVO</h2>
          <div className="section-rule"></div>
        </div>
        <div className="activity-grid">
          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
            </div>
            <div className="ticker">
              {RECENT_SCORES.map((recentScore, index) => (
                <div
                  key={recentScore.playerName}
                  className="tick-row"
                  style={{ animationDelay: index * 60 + "ms" }}
                >
                  <span className={"tk-p neon-" + recentScore.accentColor}>
                    {recentScore.playerName}
                  </span>
                  <span className="tk-mid">▸ {findGameById(recentScore.gameId)?.title}</span>
                  <span className="tk-s">+{recentScore.score.toLocaleString("es-ES")}</span>
                  <span className="tk-t">{recentScore.timeAgoLabel}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel neon-magenta">▸ TOP JUGADORES · HOY</div>
              <Link href="/hall-of-fame" className="lb-link">
                VER SALÓN →
              </Link>
            </div>
            <div className="top-list">
              {TOP_PLAYERS_TODAY.map((player, index) => (
                <div
                  key={player.playerName}
                  className={"top-row" + (TOP_RANK_CLASS_NAMES[index] ? " " + TOP_RANK_CLASS_NAMES[index] : "")}
                >
                  <span className="tp-rk">#{String(player.rank).padStart(2, "0")}</span>
                  <span className="tp-bar">
                    <span className="tp-fill" style={{ width: 100 - index * 16 + "%" }}></span>
                  </span>
                  <span className="tp-p">{player.playerName}</span>
                  <span className="tp-s">{player.score.toLocaleString("es-ES")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-green">{"// 04"}</div>
          <h2 className="section-title">PRECIOS</h2>
          <div className="section-rule"></div>
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="pc-label pixel">PLAN ÚNICO</div>
            <div className="pc-name pixel">JUGADOR VAULT</div>
            <div className="pc-amount">
              <span className="pc-amount-n">$0</span>
              <span className="pc-amount-u">/ SIEMPRE</span>
            </div>
            <div className="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
            <ul className="pc-list">
              {PRICING_INCLUDED_BENEFITS.map((benefit) => (
                <li key={benefit}>✔ {benefit}</li>
              ))}
            </ul>
            <Link href="/auth" className="btn xl pulse" style={{ width: "100%" }}>
              EMPEZAR GRATIS →
            </Link>
            <div className="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
            <div className="pc-stamp pixel">
              FREE
              <br />
              PLAY
            </div>
          </div>

          <div className="pricing-faq">
            {PRICING_FAQ.map((item) => (
              <div key={item.question} className="faq-item">
                <div className="faq-q pixel">{item.question}</div>
                <div className="faq-a">{item.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="home-final reveal">
        <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
        <Link href="/games" className="btn xl pulse final-cta">
          INSERTAR MONEDA →
        </Link>
        <div className="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
      </section>
    </div>
  );
}
