"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { authStyles as s } from "@/components/authStyles";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/tracker");
    router.refresh();
  }

  return (
    <div style={s.wrap}>
      <form onSubmit={handleLogin} style={s.card}>
        <div style={s.eyebrow}>jobpipeline / acceso</div>
        <h1 style={s.h1}>Inicia sesión</h1>
        <input style={s.input} type="email" placeholder="tu@correo.com" value={email}
          onChange={e => setEmail(e.target.value)} required />
        <input style={s.input} type="password" placeholder="Contraseña" value={password}
          onChange={e => setPassword(e.target.value)} required />
        {error && <div style={s.error}>{error}</div>}
        <button style={s.button} disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</button>
        <p style={s.sub}>¿No tienes cuenta? <Link href="/signup" style={s.link}>Regístrate</Link></p>
      </form>
    </div>
  );
}
