import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "Idea Portal",
  description: "Submit ideas, vote, and track the roadmap.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
