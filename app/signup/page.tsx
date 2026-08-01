"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { authStyles as s } from "@/components/authStyles";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div style={s.wrap}>
        <div style={s.card}>
          <div style={s.eyebrow}>jobpipeline / registro</div>
          <h1 style={s.h1}>Revisa tu correo</h1>
          <p style={s.sub}>Te enviamos un link de confirmación a <b>{email}</b>. Ábrelo para activar tu cuenta.</p>
          <Link href="/login" style={s.link}>Volver a inicio de sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <form onSubmit={handleSignup} style={s.card}>
        <div style={s.eyebrow}>jobpipeline / registro</div>
        <h1 style={s.h1}>Crea tu cuenta</h1>
        <input style={s.input} type="text" placeholder="Nombre completo" value={fullName}
          onChange={e => setFullName(e.target.value)} required />
        <input style={s.input} type="email" placeholder="tu@correo.com" value={email}
          onChange={e => setEmail(e.target.value)} required />
        <input style={s.input} type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password}
          onChange={e => setPassword(e.target.value)} required minLength={6} />
        {error && <div style={s.error}>{error}</div>}
        <button style={s.button} disabled={loading}>{loading ? "Creando…" : "Crear cuenta"}</button>
        <p style={s.sub}>¿Ya tienes cuenta? <Link href="/login" style={s.link}>Inicia sesión</Link></p>
      </form>
    </div>
  );
}
