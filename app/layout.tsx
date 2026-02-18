import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "易千工作台",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html>
			<body>{children}</body>
		</html>
	);
}
