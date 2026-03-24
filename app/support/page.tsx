export default function SupportPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>GfxLab Support</h1>
      <p style={{ marginBottom: 20 }}>
        Need help with GfxLab? Contact us using the information below.
      </p>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 24 }}>Contact</h2>
      <p>
        Email: <a href="iamhaydaygraphics@gmail.com">iamhaydaygraphics@gmail.com</a>
      </p>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 24 }}>Common Help Topics</h2>
      <ul>
        <li>Trouble exporting a design</li>
        <li>Purchase did not go through</li>
        <li>Music not attaching to export</li>
        <li>App bug or crash</li>
        <li>Account or access questions</li>
      </ul>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 24 }}>When You Contact Support</h2>
      <ul>
        <li>Your device model</li>
        <li>Your iOS version</li>
        <li>A short description of the issue</li>
        <li>A screenshot if possible</li>
      </ul>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 24 }}>Response Time</h2>
      <p>We usually respond within 24–48 business hours.</p>
    </main>
  );
}