# Endless segment prefetch loop for a link to a rewritten url from a root not-found page

A link on a not-found page that renders above a dynamic root layout makes the browser prefetch one segment of the link
target again and again, about 200 requests per second, as long as the page is open. It happens when the link target
is rewritten by the proxy, as with i18n middleware that serves `/en` from an `en-us` segment.

The app has a dynamic root layout, `app/[lang]/layout.jsx`, which calls `notFound()` for unknown values, and a root
`app/not-found.jsx` that renders its own document. Both the page and the not-found page link to `/en` and `/de`.
`proxy.js` rewrites `/en` to `/en-us`; `/de` is served as is.

## Versions

- `next` 16.5.0-canary.52 and 16.4.6, `react` 19.3.1
- Node 26.13.1, pnpm 12.18.0, Linux
- Chromium 158 (Playwright 1.65.0)
- Default config; the same with `cacheComponents` and `partialPrefetching` enabled

## Reproduce

```sh
pnpm install
pnpm build
node repro.mjs
```

`repro.mjs` starts `next start`, opens `/en`, `/de` and `/x`, and counts the RSC requests in the next three seconds.
`/x` renders the not-found page, because `[lang]/layout.jsx` calls `notFound()`.

Or open `/x` with the network panel of the browser devtools open.

## Results

[out.md](./out.md):

| page | RSC requests for `/en` in 3 s |
| --- | --- |
| `/en` | 1 route tree (`/_tree`), 1 page segment |
| `/de` | 1 route tree (`/_tree`), 1 page segment |
| `/x` (not-found) | **609 page segment requests**, no route tree request |

From `/x`, the router does not request the route tree for `/en`: it predicts it from the route it learned from `/x`
([optimistic routing](https://github.com/vercel/next.js/blob/canary/packages/next/src/client/components/segment-cache/optimistic-routes.ts)),
where the url part `x` is the `[lang]` param. The prediction is `[lang]=en`, but the server renders `/en` as `en-us`
(`x-nextjs-rewritten-path: /en-us`). The link to `/de`, which is not rewritten, is prefetched once.

Optimistic routing does handle a prediction that turns out wrong, by marking the pattern so it is not predicted again
(`hasDynamicRewrite`). But that check only runs for responses written with a base tree;
`fetchAndWritePerSegmentPrefetchResponse` passes no prediction to the write ("root-anchored, so there's no prediction
to diverge from"), so a wrong prediction for a per-segment prefetch is never detected.

Open questions:

- Why the route learned from `/x` is used for prediction, but the same route learned from `/de` is not: from `/de`,
  the link to `/en` gets a route tree request.
- How the loop retries without the 10 s rejection backoff.
