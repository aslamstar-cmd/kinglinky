// src/Home.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Home({ isLoggedIn, userEmail }) {
  const navigate = useNavigate();

  // shorten form state
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loadingShorten, setLoadingShorten] = useState(false);
  const [error, setError] = useState("");

  // demo stats (if you have real API, replace with fetch)
  const demoStats = {
    totalClicks: 215334664,
    totalUrls: 46197160,
    registeredUsers: 1373840,
    totalPaid: 1181457,
  };

  async function handleShorten(e) {
    e?.preventDefault();
    setError("");
    if (!longUrl) return setError("Please paste a URL.");
    if (!isLoggedIn) {
      // not logged in -> redirect to login
      navigate("/login");
      return;
    }

    try {
      setLoadingShorten(true);
      // Example: call your shorten API
      const res = await axios.post("http://localhost:5000/api/shorten", {
        longUrl,
        email: userEmail || localStorage.getItem("userEmail"),
      });
      if (res?.data?.shortUrl) {
        setShortUrl(res.data.shortUrl);
        setLongUrl("");
      } else {
        setError("Server returned unexpected response.");
      }
    } catch (err) {
      console.error(err);
      setError("Shorten failed. Check server.");
    } finally {
      setLoadingShorten(false);
    }
  }

  // quick helper for number formatting
  const nf = (v) =>
    typeof v === "number" ? v.toLocaleString() : v;

  return (
    <div style={styles.page}>
      {/* NAVBAR */}
      <header style={styles.navWrap}>
        <div style={styles.navInner}>
          <div style={styles.brand} onClick={() => navigate("/")}>
            <span style={{ marginRight: 8 }}>👑</span>
            <span style={styles.brandTitle}>Kinglinky</span>
          </div>

          <nav style={styles.navLinks}>
            <a style={styles.navLink} href="#features">Features</a>
            <a style={styles.navLink} href="#how">How it works</a>
            <a style={styles.navLink} href="#pricing">Pricing</a>
            <button
              onClick={() => (isLoggedIn ? navigate("/dashboard") : navigate("/login"))}
              style={styles.ghostBtn}
            >
              {isLoggedIn ? "Dashboard" : "Sign In"}
            </button>
            {!isLoggedIn && (
              <button onClick={() => navigate("/signup")} style={styles.primaryBtn}>
                Sign Up
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroLeft}>
            <h1 style={styles.heroTitle}>Turn your traffic into profit.</h1>
            <p style={styles.heroSubtitle}>
              Kinglinky — fast, reliable URL shortener + monetization. Shorten links,
              track clicks and earn. Trusted by creators & publishers worldwide.
            </p>

            <div style={styles.heroCtaRow}>
              <button style={styles.primaryBtn} onClick={() => (isLoggedIn ? navigate("/dashboard") : navigate("/signup"))}>
                Get Started
              </button>
              <button style={styles.ghostBtn} onClick={() => navigate("/publisher")}>
                Publisher Info
              </button>
            </div>

            {/* Shorten input inline in hero */}
            <form onSubmit={handleShorten} style={styles.shortForm}>
              <input
                placeholder="Paste your long URL (login required)"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                style={styles.shortInput}
              />
              <button style={styles.shortBtn} type="submit" disabled={loadingShorten}>
                {loadingShorten ? "Shortening..." : "Shorten"}
              </button>
            </form>
            {shortUrl && (
              <div style={styles.shortResult}>
                Shortened:{" "}
                <a href={shortUrl} target="_blank" rel="noreferrer" style={{ color: "#0ea5e9" }}>
                  {shortUrl}
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(shortUrl)}
                  style={styles.copySmall}
                >
                  Copy
                </button>
              </div>
            )}
            {error && <div style={styles.error}>{error}</div>}
          </div>

          <div style={styles.heroRight}>
            <div style={styles.heroCard}>
              <h4 style={{ margin: 0 }}>Total Clicks</h4>
              <div style={styles.statLarge}>{nf(demoStats.totalClicks)}</div>
              <div style={styles.statSmall}>Total URLs: {nf(demoStats.totalUrls)}</div>
            </div>

            <div style={styles.featuresBox}>
              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>💸</div>
                <div>
                  <div style={styles.featureTitle}>Highest Rates</div>
                  <small style={styles.featureSub}>Top CPMs per 1000 views</small>
                </div>
              </div>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>⚡</div>
                <div>
                  <div style={styles.featureTitle}>Instant Payout</div>
                  <small style={styles.featureSub}>Multiple payout options</small>
                </div>
              </div>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>🔗</div>
                <div>
                  <div style={styles.featureTitle}>API & Bots</div>
                  <small style={styles.featureSub}>Shorten links programmatically</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <section style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Clicks</div>
          <div style={styles.statValue}>{nf(demoStats.totalClicks)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Registered Users</div>
          <div style={styles.statValue}>{nf(demoStats.registeredUsers)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Paid</div>
          <div style={styles.statValue}>${nf(demoStats.totalPaid)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total URLs</div>
          <div style={styles.statValue}>{nf(demoStats.totalUrls)}</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={styles.how}>
        <div style={styles.howInner}>
          <div style={styles.howText}>
            <h2>How it works</h2>
            <p>Simple 3-step flow to start earning from your links.</p>

            <ol style={styles.howList}>
              <li><strong>Create account</strong> — Signup and get your referral.</li>
              <li><strong>Shorten link</strong> — Paste long URL and create short one.</li>
              <li><strong>Share & Earn</strong> — Get paid per 1000 views (CPM).</li>
            </ol>
          </div>

          <div style={styles.howGraphic}>
            <div style={styles.boxFeature}>API</div>
            <div style={styles.boxFeature}>Telegram Bot</div>
            <div style={styles.boxFeature}>Dashboard</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div>
            <h3 style={{ margin: 0 }}>Kinglinky</h3>
            <p style={{ marginTop: 6, maxWidth: 320 }}>
              Modern URL shortener with monetization & tracking. Built for creators and publishers.
            </p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <div style={styles.footerLinks}>
              <a href="#how">How it works</a>
              <a href="#features">Features</a>
              <a onClick={() => navigate("/signup")} style={{ cursor: "pointer" }}>Sign Up</a>
              <a onClick={() => navigate("/login")} style={{ cursor: "pointer" }}>Sign In</a>
            </div>
          </div>

          <div>
            <h4>Contact</h4>
            <div>support@kinglinky.example</div>
            <div style={{ marginTop: 8 }}>© {new Date().getFullYear()} Kinglinky</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ----------------- STYLES ----------------- */

const styles = {
  page: {
    minHeight: "100vh",
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    color: "#0b3b36",
    background: "linear-gradient(180deg,#f3fffe 0%, #eafdfb 100%)",
  },
  navWrap: {
    position: "sticky",
    top: 0,
    zIndex: 999,
    backdropFilter: "saturate(120%) blur(6px)",
    borderBottom: "1px solid rgba(3,10,10,0.06)"
  },
  navInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brand: { display: "flex", alignItems: "center", cursor: "pointer" },
  brandTitle: { fontWeight: 800, fontSize: 18, letterSpacing: 0.3 },
  navLinks: { display: "flex", gap: 12, alignItems: "center" },
  navLink: { color: "#045", textDecoration: "none", fontWeight: 600, marginRight: 6 },
  primaryBtn: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700
  },
  ghostBtn: {
    background: "transparent",
    border: "1px solid rgba(3,10,10,0.06)",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer"
  },

  hero: { padding: "48px 0" },
  heroInner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    gap: 24,
    alignItems: "flex-start",
    padding: "0 20px",
    flexWrap: "wrap"
  },
  heroLeft: { flex: "1 1 520px", minWidth: 300 },
  heroRight: { flex: "0 0 360px", minWidth: 300 },

  heroTitle: { fontSize: 36, margin: "8px 0 12px", color: "#044" },
  heroSubtitle: { color: "#145", marginBottom: 18, maxWidth: 560, lineHeight: 1.5 },

  heroCtaRow: { display: "flex", gap: 10, marginBottom: 18 },

  shortForm: { display: "flex", gap: 8, marginTop: 12, maxWidth: 700 },
  shortInput: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(3,10,10,0.06)",
    fontSize: 14
  },
  shortBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#0ea5e9",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer"
  },
  shortResult: { marginTop: 10, display: "flex", gap: 10, alignItems: "center" },
  copySmall: {
    marginLeft: 8,
    padding: "6px 8px",
    borderRadius: 8,
    border: "none",
    background: "#06b6d4",
    color: "#fff",
    cursor: "pointer"
  },
  error: { color: "#c026d3", marginTop: 10 },

  heroCard: {
    background: "#fff",
    padding: 18,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(2,10,6,0.04)",
    marginBottom: 12
  },
  statLarge: { fontSize: 26, fontWeight: 800, marginTop: 8 },
  statSmall: { color: "#4b6", marginTop: 6 },

  featuresBox: {
    background: "#fff",
    padding: 12,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(2,10,6,0.03)"
  },
  featureItem: { display: "flex", gap: 12, alignItems: "center", padding: "8px 6px" },
  featureIcon: {
    width: 46, height: 46, borderRadius: 10, background: "#e8fbff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
  },
  featureTitle: { fontWeight: 700 },
  featureSub: { fontSize: 12, color: "#556" },

  statsRow: {
    maxWidth: 1100,
    margin: "24px auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    padding: "0 20px"
  },
  statCard: {
    background: "#fff",
    padding: 18,
    borderRadius: 12,
    textAlign: "left",
    boxShadow: "0 10px 30px rgba(2,10,6,0.03)"
  },
  statLabel: { color: "#667", fontSize: 13, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: 800 },

  how: { background: "transparent", padding: "32px 0" },
  howInner: { maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" },
  howText: { flex: "1 1 420px" },
  howGraphic: { flex: "0 0 320px", display: "flex", flexDirection: "column", gap: 12 },
  howList: { marginTop: 12, paddingLeft: 18 },
  boxFeature: { background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 8px 26px rgba(2,10,6,0.03)" },

  footer: { marginTop: 36, background: "#f6fbfb", borderTop: "1px solid rgba(3,10,10,0.03)", padding: 28 },
  footerInner: { maxWidth: 1100, margin: "0 auto", display: "flex", gap: 24, justifyContent: "space-between", flexWrap: "wrap" },
  footerLinks: { display: "flex", flexDirection: "column", gap: 8 }
};
