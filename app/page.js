"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function LoginPage() {
  const [kodeId, setKodeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("kode_id", kodeId.trim())
      .eq("password", password)
      .single();

    setLoading(false);

    if (error || !data) {
      alert("ID atau Password salah!");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));
    if (data.role === "pengurus") router.push("/pengurus");
    else router.push("/wali");
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Top bar like banking */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo Pesantren"
                width={34}
                height={34}
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </div>
            <div>
              <div className="text-white font-bold leading-tight">
                Sistem Jajan Santri
              </div>
              <div className="text-emerald-100 text-sm">
                Pondok Pesantren Al Hasan Thousand
              </div>
            </div>
          </div>

          <div className="hidden md:block text-emerald-100 text-sm">
            Akses aman • Data tersimpan • Mudah digunakan
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: banking-style info panel */}
        <div className="order-2 lg:order-1">
          <div className="bg-white rounded-3xl shadow-lg border p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Selamat datang
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Login untuk mengelola saldo & transaksi harian dengan rapi.
                </p>
              </div>

              {/* small “bank card” ornament */}
              <div className="hidden md:block">
                <div className="w-44 h-28 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white p-4 shadow-xl">
                  <div className="text-xs opacity-90">Saldo Santri</div>
                  <div className="text-lg font-bold mt-1">Rp •••••</div>
                  <div className="mt-6 text-[10px] opacity-90">
                    Jajan Santri System
                  </div>
                </div>
              </div>
            </div>

            {/* Catatan / info boxes (dipertahankan) */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-emerald-50 p-4">
                <div className="font-bold text-emerald-900 text-sm mb-1">
                  Untuk Pengurus
                </div>
                <div className="text-sm text-emerald-900/80">
                  Kelola data santri, top up, transaksi jajan, dan laporan.
                </div>
              </div>

              <div className="rounded-2xl border bg-sky-50 p-4">
                <div className="font-bold text-sky-900 text-sm mb-1">
                  Untuk Wali Santri
                </div>
                <div className="text-sm text-sky-900/80">
                  Cek saldo dan riwayat transaksi anak dengan mudah.
                </div>
              </div>
            </div>

            {/* Security notes like bank */}
            <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
              <div className="font-bold text-gray-900 text-sm mb-2">
                Catatan Keamanan
              </div>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>Jangan berikan password kepada orang lain.</li>
                <li>Gunakan ID sesuai peran: Pengurus (P-xxxx), Wali (W-xxxx).</li>
                <li>Jika lupa password, hubungi pengurus untuk reset.</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            © 2026 Pondok Pesantren Al Hasan Thousand
          </p>
        </div>

        {/* Right: bank login form */}
        <div className="order-1 lg:order-2">
          <div className="bg-white rounded-3xl shadow-xl border p-7 md:p-9">
            <div className="mb-6">
              <div className="text-xs font-semibold text-emerald-700">
                Secure Access
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
                Masuk Akun
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Masukkan ID dan password Anda untuk melanjutkan.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  ID
                </label>
                <input
                  value={kodeId}
                  onChange={(e) => setKodeId(e.target.value)}
                  placeholder="Contoh: P-0001 / W-0001"
                  className="mt-1 w-full border rounded-2xl p-3 focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-600 transition"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full border rounded-2xl p-3 focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-600 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="px-4 rounded-2xl border bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold transition"
                  >
                    {showPass ? "Sembunyikan" : "Lihat"}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white p-3 rounded-2xl font-semibold transition active:scale-[0.99]"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            {/* “Bank style” helper */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border bg-white p-4">
                <div className="text-xs font-bold text-gray-900 mb-1">
                  Contoh ID
                </div>
                <div className="text-sm text-gray-600">
                  Pengurus: <b>P-0001</b>
                  <br />
                  Wali: <b>W-0001</b>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <div className="text-xs font-bold text-gray-900 mb-1">
                  Bantuan
                </div>
                <div className="text-sm text-gray-600">
                  Jika gagal login, cek huruf besar/kecil pada ID.
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-6">
              © 2026 Pondok Pesantren Al Hasan Thousand
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}