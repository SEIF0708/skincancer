import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkinAI XAI - Clinical Skin Cancer Detection Dashboard",
  description: "Enterprise Explainable AI (XAI) Cutaneous Oncology Decision Support Workbench",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full bg-slate-50 text-slate-900 font-sans selection:bg-[#0F52BA]/20 selection:text-[#0F52BA]">
        {children}
      </body>
    </html>
  );
}
