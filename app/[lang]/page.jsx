import Link from "next/link";

export default async function Page({ params }) {
	const { lang } = await params;

	return (
		<main>
			<h1>Page {lang}</h1>
			<Link href="/en">English</Link> <Link href="/de">Deutsch</Link>
		</main>
	);
}
