import AuthenticationProvider from "@/providers/authenticationProvider";

export default function HomeLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AuthenticationProvider> {children}</AuthenticationProvider>;
}
