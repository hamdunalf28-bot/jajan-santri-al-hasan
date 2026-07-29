"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [kodeId, setKodeId] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("kode_id", kodeId)
      .eq("password", password)
      .single();

    if (error || !data) {
      alert("ID atau Password salah!");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));

    if (data.role === "pengurus") {
      router.push("/pengurus");
    } else {
      router.push("/wali");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 to-green-800 p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/logo.png"
            alt="Logo Pesantren"
            width={90}
            height={90}
          />
          <h1 className="text-xl font-bold text-emerald-700 mt-4 text-center">
            SISTEM JAJAN SANTRI
          </h1>
          <p className="text-sm text-gray-500 text-center">
            Pondok Pesantren Al‑Hasan
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Masukkan ID (P-0001 / W-0001)"
            value={kodeId}
            onChange={(e) => setKodeId(e.target.value)}
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />

          <input
            type="password"
            placeholder="Masukkan Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white p-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
          >
            Masuk
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          © 2026 Pondok Pesantren Al‑Hasan
        </p>
      </div>
    </div>
  );
}