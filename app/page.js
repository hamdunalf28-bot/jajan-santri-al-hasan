"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [kodeId, setKodeId] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
  e.preventDefault();

  console.log("ID yang diketik:", kodeId);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("kode_id", kodeId)
    .single();

  console.log("Data dari database:", data);
  console.log("Error:", error);

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
    <div className="min-h-screen flex items-center justify-center bg-green-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold text-center text-green-700 mb-6">
          Login Jajan Santri
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Masukkan ID (P-0001 / W-0001)"
            value={kodeId}
            onChange={(e) => setKodeId(e.target.value)}
            className="w-full border p-3 rounded"
            required
          />

          <input
            type="password"
            placeholder="Masukkan Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded"
            required
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}