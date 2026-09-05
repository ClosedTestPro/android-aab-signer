const siteUrl = "https://aab.closedtestpro.com";
const blogGuideUrl = "https://closedtestpro.com/blog/sign-android-aab-online-free";

export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Closed Test Pro",
    url: "https://closedtestpro.com",
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    sameAs: [
      "https://github.com/ClosedTestPro",
      "https://closedtestpro.com",
      "https://play.google.com/store/apps/details?id=com.closedtest.pro.closedtest_pro",
    ],
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#software`,
    name: "Closed Test Pro AAB Signer",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Free online tool to sign Android App Bundle (AAB) files for Google Play Store submission with jarsigner. Open source and powered by GitHub Actions.",
    url: siteUrl,
    image: `${siteUrl}/opengraph-image`,
    author: {
      "@type": "Organization",
      name: "Closed Test Pro",
      url: "https://closedtestpro.com",
    },
    isAccessibleForFree: true,
    featureList: [
      "Sign AAB files online free",
      "No installation or JDK required",
      "Open source AGPL-3.0",
      "Secure jarsigner via GitHub Actions",
      "Keystore deleted after signing",
      "No account required",
      "Production-ready signed App Bundles",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: "Do I have to pay?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. This tool is free. Signing uses free GitHub Actions time on our public repo, and Closed Test Pro does not charge for it.",
        },
      },
      {
        "@type": "Question",
        name: "Will my keystore stay private?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Your keystore is sent over HTTPS, used only to sign this one job, then deleted. The job runs on a temporary GitHub machine that is thrown away after. You can check the public workflow code anytime.",
        },
      },
      {
        "@type": "Question",
        name: "Why does my AAB need a signature?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Google Play will not accept an unsigned App Bundle. You must sign it with your app's private key before you upload it to Play Console.",
        },
      },
      {
        "@type": "Question",
        name: "Which tool creates the signature?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We use jarsigner from the official Java tools, with the SHA256withRSA method. That is a standard way to sign Android App Bundles.",
        },
      },
      {
        "@type": "Question",
        name: "Is this okay for a real Play Store release?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The file you download is a normal signed AAB. You can upload it to production if you used the correct keystore for that app.",
        },
      },
      {
        "@type": "Question",
        name: "How do I create a keystore?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "In Android Studio use Build → Generate Signed Bundle/APK, or use the keytool command. If the app is already on Play, keep using the same upload keystore you used before.",
        },
      },
      {
        "@type": "Question",
        name: "How is this different from signing in Android Studio?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Android Studio is great when you build on your machine. This online AAB signer helps when you already have an unsigned .aab and need jarsigner without installing a local JDK.",
        },
      },
      {
        "@type": "Question",
        name: "What file types does the signer accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Upload an unsigned .aab up to 100 MB, and a keystore as .jks, .keystore, .p12, or .pfx up to 10 MB.",
        },
      },
    ],
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${siteUrl}/#howto`,
    name: "How to sign an Android App Bundle (AAB) online",
    description:
      "Sign an unsigned Android App Bundle for Google Play using Closed Test Pro AAB Signer and jarsigner on GitHub Actions.",
    totalTime: "PT3M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: "0",
    },
    supply: [
      { "@type": "HowToSupply", name: "Unsigned .aab file" },
      { "@type": "HowToSupply", name: "Android upload keystore" },
    ],
    tool: [
      { "@type": "HowToTool", name: "Web browser" },
      { "@type": "HowToTool", name: "Closed Test Pro AAB Signer" },
    ],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Upload your App Bundle",
        text: "Choose your unsigned .aab file in the studio wizard.",
        url: `${siteUrl}/#signer`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Add your upload key",
        text: "Upload the keystore and enter alias, keystore password, and key password.",
        url: `${siteUrl}/#signer`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Run jarsigner",
        text: "Confirm and start the GitHub Actions job that signs the bundle with jarsigner.",
        url: `${siteUrl}/#pipeline`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Download the signed AAB",
        text: "Download the signed App Bundle and upload it to Google Play Console.",
        url: `${siteUrl}/#signer`,
      },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/#webpage`,
    name: "Free AAB Signer — Sign Android App Bundles Online | Closed Test Pro",
    description:
      "Free online AAB signer for Android developers. Sign your Android App Bundle for Google Play with jarsigner. Open source, secure, powered by GitHub Actions.",
    url: siteUrl,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@type": "Thing", name: "Android App Bundle Signing" },
    mainEntity: { "@id": `${siteUrl}/#software` },
    significantLink: [blogGuideUrl, "https://closedtestpro.com/get-12-testers-free"],
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Closed Test Pro AAB Signer",
    url: siteUrl,
    description: "Free online tool to sign Android App Bundles for Google Play",
    publisher: { "@id": `${siteUrl}/#organization` },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Closed Test Pro",
        item: "https://closedtestpro.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "AAB Signer",
        item: siteUrl,
      },
    ],
  };

  return (
    <>
      {[
        organizationSchema,
        softwareAppSchema,
        faqSchema,
        howToSchema,
        webPageSchema,
        webSiteSchema,
        breadcrumbSchema,
      ].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
