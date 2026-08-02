"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "./Logo";

const links = [
  { href: "/tracker", label: "Pipeline", icon: "📋" },
  { href: "/agregar-oferta", label: "Agregar oferta manual", icon: "➕" },
  { href: "/onboarding", label: "Editar perfil y búsqueda", icon: "⚙️" },
  { href: "/review", label: "Dejar una reseña", icon: "⭐" },
];

const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 230;

export default function Sidebar({ userLabel }: { userLabel: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        height: "100dvh", background: "#161d19", borderRight: "1px solid #2a352f",
        display: "flex", flexDirection: "column", padding: "24px 12px 20px",
        boxSizing: "border-box", flexShrink: 0,
        transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden", position: "sticky", top: 0,
      }}
    >
      <div style={{ padding: "0 4px", marginBottom: 28, minHeight: 32 }}>
        <Logo size={24} showWordmark={expanded} />
        {expanded && (
          <div style={{
            fontSize: 12, color: "#8ba396", marginTop: 6, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{userLabel}</div>
        )}
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {links.map(link => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} title={link.label} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 10px",
              borderRadius: 8, textDecoration: "none", fontSize: 13.5, whiteSpace: "nowrap",
              background: active ? "#1c2420" : "transparent",
              color: active ? "#e8ede9" : "#8ba396",
              fontWeight: active ? 700 : 400,
              borderLeft: active ? "3px solid #d8a33d" : "3px solid transparent",
              transition: "background 0.15s, color 0.15s",
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{link.icon}</span>
              {expanded && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button onClick={handleLogout} title="Cerrar sesión" style={{
        background: "transparent", border: "1px solid #2a352f", color: "#8ba396",
        borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13,
        marginTop: 12, marginBottom: 4, minHeight: 40, flexShrink: 0,
        whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>🚪</span>
        {expanded && <span>Cerrar sesión</span>}
      </button>
    </div>
  );
}
