import Link from "next/link";

// There is no root layout above `app/[lang]/layout.jsx`, so this renders its own document.
export default function NotFound() {
	return (
		<html lang="en">
			<body>
				<main>
					<h1>Not found</h1>
					<Link href="/en">English</Link> <Link href="/de">Deutsch</Link>
				</main>
			</body>
		</html>
	);
}
