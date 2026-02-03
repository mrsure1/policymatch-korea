import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolicyMatch Korea - 정부 정책자금 매칭 서비스",
  description: "소상공인과 중소기업을 위한 맞춤형 정부 지원 정책 매칭 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
