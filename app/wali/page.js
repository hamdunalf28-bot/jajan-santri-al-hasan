"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function WaliPage() {
  const router = useRouter();
  const [santri, setSantri] = useState(null);
  const [transaksi, setTransaksi] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "wali") {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      const { data: santriData } = await supabase
        .from("santri")
        .select("*")
        .eq("wali_kode", user.kode_id)
        .single();

      setSantri(santriData);

      if (santriData) {
        const { data: transaksiData } = await supabase
          .from("transaksi")
          .select("*")
          .eq("kode_santri", santriData.kode_id)
          .order("created_at", { ascending: false });

        setTransaksi(transaksiData || []);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen p-10 bg-green-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-green-700 mb-6">
          Dashboard Wali Santri
        </h1>

        {santri ? (
          <>
            <div className="mb-6">
              <p><b>Nama Anak:</b> {santri.nama}</p>
              <p><b>ID Santri:</b> {santri.kode_id}</p>
              <p className="text-xl font-bold mt-2">
                Saldo: Rp {santri.saldo}
              </p>
            </div>

            <h2 className="text-lg font-semibold mb-3">
              Riwayat Transaksi
            </h2>

            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-green-200">
                  <th className="border p-2">Tanggal</th>
                  <th className="border p-2">Jenis</th>
                  <th className="border p-2">Nominal</th>
                  <th className="border p-2">Saldo Setelah</th>
                </tr>
              </thead>
              <tbody>
                {transaksi.map((t) => (
                  <tr key={t.id}>
                    <td className="border p-2">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="border p-2">
                      {t.jenis === "topup" ? "Top Up" : "Jajan"}
                    </td>
                    <td className="border p-2">
                      Rp {t.jumlah}
                    </td>
                    <td className="border p-2">
                      Rp {t.saldo_setelah}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p>Data tidak ditemukan</p>
        )}

        <button
          onClick={() => {
            localStorage.removeItem("user");
            router.push("/");
          }}
          className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}