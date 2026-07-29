"use client";

export default function FormSantri({
  editMode,
  kodeSantri,
  kodeWali,
  namaSantri,
  namaWali,
  kelas,
  kamar,

  setKodeSantri,
  setNamaSantri,
  setNamaWali,
  setKelas,
  setKamar,

  onGenerateID,
  onSimpan,
  onBatal,
}) {
  const opsiKelas = [
    "I Ibtida",
    "II Ibtida",
    "III Ibtida",
    "I Tsanawi",
    "II Tsanawi",
    "III Tsanawi",
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-emerald-700 mb-5">
        {editMode ? "Edit Data Santri" : "Tambah Data Santri"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold">ID Santri</label>
          <div className="flex gap-2 mt-1">
            <input
              value={kodeSantri}
              onChange={(e) => setKodeSantri(e.target.value)}
              className="border rounded-lg p-3 w-full"
              placeholder="S-0001"
            />
            <button
              type="button"
              onClick={onGenerateID}
              className="bg-blue-600 text-white px-3 rounded-lg"
            >
              Generate
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">ID Wali</label>
          <input
            value={kodeWali}
            disabled
            className="border rounded-lg p-3 w-full bg-gray-100 mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Nama Santri</label>
          <input
            value={namaSantri}
            onChange={(e) => setNamaSantri(e.target.value)}
            className="border rounded-lg p-3 w-full mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Nama Wali</label>
          <input
            value={namaWali}
            onChange={(e) => setNamaWali(e.target.value)}
            className="border rounded-lg p-3 w-full mt-1"
            placeholder={editMode ? "(opsional saat edit)" : "Wajib saat tambah"}
          />
        </div>

        {/* ✅ KELAS DROPDOWN */}
        <div>
          <label className="text-sm font-semibold">Kelas</label>
          <select
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            className="border rounded-lg p-3 w-full mt-1 bg-white"
          >
            <option value="">-- Pilih Kelas --</option>
            {opsiKelas.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">Kamar</label>
          <input
            value={kamar}
            onChange={(e) => setKamar(e.target.value)}
            className="border rounded-lg p-3 w-full mt-1"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onSimpan}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold"
        >
          {editMode ? "Update Data" : "Simpan Data"}
        </button>

        <button
          type="button"
          onClick={onBatal}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl"
        >
          Batal
        </button>
      </div>
    </div>
  );
}