import type { Metadata } from "next";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";

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
			<body>
				<NextTopLoader color="#1677ff" height={3} showSpinner={false} />
				{children}
			</body>
		</html>
	);
}
