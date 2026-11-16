import { NextResponse } from "next/server";

// Like i18n middleware with locale prefixes: `/en` is served by the `en-us` segment. `/de` is served as is.
export default function proxy(request) {
	const url = request.nextUrl.clone();
	url.pathname = url.pathname.replace(/^\/en(?=\/|$)/, "/en-us");
	return NextResponse.rewrite(url);
}

export const config = { matcher: ["/en", "/en/:path*"] };
