export default function NotFound() {
  return (
    <main className="public-page" id="main">
      <section className="public-section-sm public-shell">
        <span className="mpc-eyebrow">404 / Not found</span>
        <h1>That route is not available.</h1>
        <p>The page may have moved or the address may be incomplete.</p>
        <a className="mpc-button mpc-button-primary" href="/">
          Return to Partner Command
        </a>
      </section>
    </main>
  );
}
