import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Pledge - Admin",
  description: "NAMLEF Family Pledge Gaza Relief - Admin Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: "10px", fontSize: "14px" },
            success: { iconTheme: { primary: "#0B6B3A", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
