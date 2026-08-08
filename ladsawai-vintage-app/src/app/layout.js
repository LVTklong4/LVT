import "./globals.css";

export const metadata = {
  title: "ตลาดนัดลาดสวายวินเทจ - ระบบจัดการการจองและบัญชี",
  description: "Ladsawai Vintage Market Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
