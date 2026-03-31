export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fitness Postpartum 🌸",
  description: "Ton programme de remise en forme personnalisé",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}