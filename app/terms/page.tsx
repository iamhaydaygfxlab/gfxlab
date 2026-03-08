export const metadata = {
  title: "Terms of Service | GFXLab",
};

export default function TermsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b0b",
        color: "white",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          lineHeight: 1.7,
        }}
      >
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 10 }}>
          Terms of Service
        </h1>
        <p style={{ opacity: 0.8, marginBottom: 30 }}>
          Last Updated: March 8, 2026
        </p>

        <p>
          Welcome to GFXLab. These Terms of Service ("Terms") govern your use of
          the GFXLab website, mobile applications, and related services
          (collectively, the "Service"). By accessing or using the Service, you
          agree to be bound by these Terms.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Use of the Service
        </h2>

        <p>
          GFXLab provides tools for creating digital graphics, covers, flyers,
          and other visual content. You agree to use the Service only for lawful
          purposes and in accordance with these Terms.
        </p>

        <ul style={{ paddingLeft: 20 }}>
          <li>You may not use the Service for illegal activities.</li>
          <li>You may not attempt to disrupt or damage the Service.</li>
          <li>
            You may not upload content that infringes on intellectual property
            rights.
          </li>
        </ul>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          User Accounts
        </h2>

        <p>
          Some features require you to sign in using third-party authentication
          providers such as Google. You are responsible for maintaining the
          security of your account and for all activities that occur under your
          account.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          User Content
        </h2>

        <p>
          You retain ownership of any designs, images, or content you create
          using GFXLab. By using the Service, you grant GFXLab permission to
          store and process your content solely for the purpose of providing the
          Service.
        </p>

        <p>
          You are responsible for ensuring that any content you upload or create
          does not violate copyright laws or the rights of others.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Payments and Pro Features
        </h2>

        <p>
          GFXLab may offer paid features or subscriptions ("Pro Features").
          Payments are processed through Stripe or other payment providers.
        </p>

        <ul style={{ paddingLeft: 20 }}>
          <li>All purchases are processed securely by third-party providers.</li>
          <li>
            GFXLab does not store or have access to your full payment details.
          </li>
          <li>
            Pricing and available features may change at any time without prior
            notice.
          </li>
        </ul>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Intellectual Property
        </h2>

        <p>
          The GFXLab platform, including its design, software, and branding, is
          owned by GFXLab and protected by intellectual property laws. You may
          not copy, modify, distribute, or reverse engineer any part of the
          Service without permission.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Termination
        </h2>

        <p>
          We reserve the right to suspend or terminate access to the Service if
          a user violates these Terms or engages in harmful or unlawful
          activities.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Disclaimer
        </h2>

        <p>
          The Service is provided "as is" without warranties of any kind. We do
          not guarantee that the Service will always be available, secure, or
          error-free.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Limitation of Liability
        </h2>

        <p>
          To the maximum extent permitted by law, GFXLab shall not be liable for
          any indirect, incidental, or consequential damages resulting from the
          use of the Service.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Changes to the Terms
        </h2>

        <p>
          We may update these Terms from time to time. Updated terms will be
          posted on this page with the revised date.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Contact
        </h2>

        <p>If you have questions about these Terms, contact us at:</p>

        <p style={{ fontWeight: 700 }}>
          iamhaydaystudios@gmail.com
        </p>
      </div>
    </main>
  );
}