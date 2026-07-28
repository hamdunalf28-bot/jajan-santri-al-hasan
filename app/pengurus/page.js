"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PengurusPage() {
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "pengurus") {
      router.push("/");
    }
  }, []);

  return (
    <div className="min-h-screen bg-green-100 p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-8">
          Dashboard Pengurus
        </h1>

        <div className="grid grid-cols-2 gap-6">
          <Link
            href="/pengurus/data-santri"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg text-center"
          >
            <div className="text-4xl mb-3">👨‍🎓</div>
            <p className="font-semibold">Data Santri</p>
          </Link>

          <Link
            href="/pengurus/topup"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg text-center"
          >
            <div className="text-4xl mb-3">💰</div>
            <p className="font-semibold">Top Up Saldo</p>
          </Link>

          <Link
            href="/pengurus/laporan"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg text-center"
          >
            <div className="text-4xl mb-3">📊</div>
            <p className="font-semibold">Laporan</p>
          </Link>

          <button
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/");
            }}
            className="bg-red-500 text-white p-6 rounded-xl shadow hover:bg-red-600"
          >
            <Link
  href="/pengurus/jajan"
  className="bg-white p-6 rounded-xl shadow hover:shadow-lg text-center"
>
  <div className="text-4xl mb-3">🛒</div>
  <p className="font-semibold">Transaksi Jajan</p>
</Link>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}