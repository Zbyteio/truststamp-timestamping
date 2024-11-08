import "antd/dist/reset.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AntdProvider from "@/providers/ant";
import { ConfigProvider } from "antd";
import theme from "@/theme/themeConfig";
import SessionWrapper from '../components/SessionWrapper'


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "TrustStamp",
	description: "Secure your intellectual property",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SessionWrapper>
			<html lang="en">
				<body className={inter.className}>
					<AntdProvider>
						<ConfigProvider theme={theme}>{children}</ConfigProvider>
					</AntdProvider>
				</body>
			</html>
		</SessionWrapper>
	);
}
