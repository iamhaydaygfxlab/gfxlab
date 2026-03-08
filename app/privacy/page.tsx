export const metadata = {
  title: "Privacy Policy | GFXLab",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ opacity: 0.8, marginBottom: 30 }}>
          Last Updated: March 8, 2026
        </p>

        <p>
          GFXLab (“we”, “our”, or “us”) operates the GFXLab mobile application
          and website. This Privacy Policy explains how we collect, use, and
          protect your information when you use our app and services.
        </p>

        <p>
          By using GFXLab, you agree to the collection and use of information in
          accordance with this policy.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Information We Collect
        </h2>

        <h3 style={{ marginTop: 20, fontSize: 18, fontWeight: 700 }}>
          Account Information
        </h3>
        <p>
          When you sign in to GFXLab using Google Sign-In, we may collect your
          name, email address, and a unique user ID provided by Firebase
          Authentication. This information is used to create and manage your
          account.
        </p>

        <h3 style={{ marginTop: 20, fontSize: 18, fontWeight: 700 }}>
          User Content
        </h3>
        <p>
          When you create designs in GFXLab, we may store saved projects, design
          settings, uploaded images, and related assets. This information is
          stored securely to allow you to access your designs later.
        </p>

        <h3 style={{ marginTop: 20, fontSize: 18, fontWeight: 700 }}>
          Payment Information
        </h3>
        <p>
          If you purchase a Pro subscription or export feature, payments are
          processed through Stripe. We do not store or have access to your full
          credit card details. Payment information is handled securely by
          Stripe.
        </p>

        <h3 style={{ marginTop: 20, fontSize: 18, fontWeight: 700 }}>
          Device Information
        </h3>
        <p>
          We may collect limited technical information such as device type,
          browser type, operating system, and app performance data to improve
          the app experience.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          How We Use Your Information
        </h2>
        <p>We use collected information to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Provide and maintain the GFXLab service</li>
          <li>Save and load user designs</li>
          <li>Process payments for Pro features</li>
          <li>Improve app performance and stability</li>
          <li>Prevent abuse or misuse of the service</li>
        </ul>

        <p>
          We do not sell or rent your personal information to third parties.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Third-Party Services
        </h2>
        <p>GFXLab uses trusted third-party services including:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Firebase (Google) for authentication, database, and storage</li>
          <li>Stripe for payment processing</li>
          <li>Vercel for hosting infrastructure</li>
        </ul>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Data Security
        </h2>
        <p>
          We take reasonable measures to protect your data using secure cloud
          infrastructure. However, no internet transmission or storage system
          can be guaranteed to be completely secure.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Children&apos;s Privacy
        </h2>
        <p>
          GFXLab is not intended for children under the age of 13. We do not
          knowingly collect personal information from children under 13.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Your Rights
        </h2>
        <p>You may request to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Access your stored data</li>
          <li>Delete your account and saved projects</li>
          <li>Request removal of personal information</li>
        </ul>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Changes to This Privacy Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. Updates will be
          posted on this page with the revised date.
        </p>

        <h2 style={{ marginTop: 32, fontSize: 24, fontWeight: 800 }}>
          Contact Us
        </h2>
        <p>If you have questions about this Privacy Policy, contact us at:</p>
        <p style={{ fontWeight: 700 }}>iamhaydaystudios@gmail.com</p>
      </div>
    </main>
  );
}