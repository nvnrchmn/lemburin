import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Web-only root HTML document (Expo Router).
 * This file is NOT used on native — it only shapes the static HTML shell that
 * `expo export --platform web` emits, so nothing here can affect the APK.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        <title>Lemburin — Catat Lembur, Hitung Hakmu</title>
        <meta
          name="description"
          content="Catat lembur pribadi dan hitung upah lembur sesuai PP 35/2021. Bandingkan dengan perhitungan perusahaan untuk memastikan tidak ada selisih."
        />
        <meta name="theme-color" content="#0F172A" />

        {/* PWA: manifest + icons. Assets (manifest.json, sw.js, icon-*.png,
            apple-touch-icon.png) di-copy dari pwa/ saat deploy. */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Lemburin" />

        {/* Open Graph — link previews in WhatsApp / Telegram / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Lemburin" />
        <meta property="og:title" content="Lemburin — Catat Lembur, Hitung Hakmu" />
        <meta
          property="og:description"
          content="Catat lembur pribadi dan hitung upah lembur sesuai PP 35/2021. Pastikan tidak ada selisih dengan perhitungan perusahaan."
        />
        <meta property="og:url" content="https://lemburin.logikraf.id/" />
        <meta property="og:locale" content="id_ID" />
        <meta name="twitter:card" content="summary" />

        {/*
          Keeps html/body/#root at full height. react-native-web depends on this;
          without it #root collapses to zero height and the page looks blank.
        */}
        <ScrollViewStyleReset />

        {/* Match the dark app background before React mounts, so there is no
            white flash on load. */}
        <style dangerouslySetInnerHTML={{ __html: bootstrapStyle }} />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(e){console.warn('SW register gagal:',e)})})}})();`,
          }}
        />
      </body>
    </html>
  );
}

const bootstrapStyle = `
html, body, #root { background-color: #0F172A; }
@media (prefers-color-scheme: light) {
  html, body, #root { background-color: #0F172A; }
}
`;
