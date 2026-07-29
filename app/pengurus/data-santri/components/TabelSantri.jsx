"use client";

export default function TabelSantri({
  data,
  selected,
  setSelected,
  onEdit,
  onDelete,
}) {

  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelected(data.map((s) => s.kode_id));
    } else {
      setSelected([]);
    }
  };

  const toggleOne = (kode) => {
    if (selected.includes(kode)) {
      setSelected(selected.filter((id) => id !== kode));
    } else {
      setSelected([...selected, kode]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-emerald-700">
          Daftar Santri
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Total Data : {data.length}
        </p>
      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-emerald-600 text-white">

            <tr>

              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  onChange={toggleAll}
                  checked={
                    data.length > 0 &&
                    selected.length === data.length
                  }
                />
              </th>

              <th className="p-3 text-left">
                ID
              </th>

              <th className="p-3 text-left">
                Nama Santri
              </th>

              <th className="p-3 text-left">
                Kelas
              </th>

              <th className="p-3 text-left">
                Kamar
              </th>

              <th className="p-3 text-right">
                Saldo
              </th>

              <th className="p-3 text-center">
                Aksi
              </th>

            </tr>

          </thead>

          <tbody>

            {data.map((santri) => (

              <tr
                key={santri.kode_id}
                className="border-b hover:bg-gray-50"
              >

                <td className="text-center">

                  <input
                    type="checkbox"
                    checked={selected.includes(santri.kode_id)}
                    onChange={() => toggleOne(santri.kode_id)}
                  />

                </td>

                <td className="p-3">
                  {santri.kode_id}
                </td>

                <td className="p-3 font-medium">
                  {santri.nama}
                </td>

                <td className="p-3">
                  {santri.kelas}
                </td>

                <td className="p-3">
                  {santri.kamar}
                </td>

                <td className="p-3 text-right">
                  Rp{" "}
                  {Number(santri.saldo).toLocaleString("id-ID")}
                </td>

                <td className="p-3">

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() => onEdit(santri)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded-lg text-xs"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => onDelete(santri.kode_id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs"
                    >
                      Hapus
                    </button>

                  </div>

                </td>

              </tr>

            ))}

            {data.length === 0 && (

              <tr>

                <td
                  colSpan={7}
                  className="text-center p-8 text-gray-400"
                >
                  Belum ada data santri.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

      {selected.length > 0 && (

        <div className="border-t bg-gray-50 p-4 flex justify-between items-center">

          <p className="text-sm font-medium">

            {selected.length} santri dipilih

          </p>

          <button
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
          >
            Hapus Data Terpilih
          </button>

        </div>

      )}

    </div>
  );
}