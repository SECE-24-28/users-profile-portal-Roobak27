"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation {
          register(name: "${name}", email: "${email}", password: "${password}")
        }`,
      }),
    });

    const json = await res.json();
    if (json.errors) { setError(json.errors[0].message); return; }

    localStorage.setItem("token", json.data.register);
    router.push("/students");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "320px" }}>
        <h1>Register</h1>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Register</button>
        </form>

        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </div>
  );
}
