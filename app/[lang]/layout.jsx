import { notFound } from "next/navigation";

const langs = ["en-us", "de"];

export function generateStaticParams() {
	return langs.map((lang) => ({ lang }));
}

export default async function Layout({ children, params }) {
	const { lang } = await params;

	if (!langs.includes(lang)) notFound();

	return (
		<html lang={lang}>
			<body>{children}</body>
		</html>
	);
}
