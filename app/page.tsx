export default function Home() {
  return (
    <main className="av-hero fade-in">
      <h1 className="flicker">Arcade Vault</h1>
      <p className="sub">
        Insert coin <span className="blink">_</span>
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button type="button" className="btn lg pulse">
          Jugar
        </button>
        <button type="button" className="btn lg magenta">
          Salón de la fama
        </button>
        <button type="button" className="btn lg ghost">
          Ingresar
        </button>
      </div>
    </main>
  );
}
