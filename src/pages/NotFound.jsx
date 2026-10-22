import React from "react";
import { Link } from "react-router-dom";
import { C } from "../theme";
import { GovHeader, GovFooter, A11yWidget, Card, Btn } from "../components/GovShell";

export default function NotFound() {
  return (
    <div className="page-shell" style={{ background: C.paper, fontFamily: "var(--font-sans)" }}>
      <GovHeader compact />
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "clamp(24px, 6vw, 56px) 20px" }}>
        <Card style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: C.navy }}>404</div>
          <p style={{ color: "#6b7785", fontSize: 17 }}>No encontramos esta página.</p>
          <Link to="/" style={{ textDecoration: "none" }}>
            <Btn>Volver al inicio</Btn>
          </Link>
        </Card>
      </main>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
