export default function manifest() {
  return {
    name: "Jajan Santri - Pondok Pesantren Al-Hasan",
    short_name: "Jajan Santri",
    description: "Aplikasi saldo & transaksi jajan santri untuk pengurus dan wali santri.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#047857",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}