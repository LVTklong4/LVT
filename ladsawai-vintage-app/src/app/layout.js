import "./globals.css";

export const metadata = {
  title: "ตลาดนัดลาดสวายวินเทจ - ระบบจัดการการจองและบัญชี",
  description: "Ladsawai Vintage Market Management System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ลาดสวายวินเทจ"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
