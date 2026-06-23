# Privacy Policy

**Last updated: June 23, 2026**

This Service is operated by **Anna Arndt**, a sole trader (Einzelunternehmen) registered in Berlin, Germany, trading as **House of Steam**. Anna Arndt is the data controller responsible for your personal data under the EU General Data Protection Regulation (GDPR). Full legal and contact details are available in our [Impressum](https://fitsyou.live/impressum).

In this policy, "we", "us", and "our" refer to Anna Arndt (House of Steam), operator of the fitsyou Chrome extension and the website at fitsyou.live (collectively, the "Service").

**Controller contact:**
Anna Arndt (House of Steam)
Grünstraße 18, 12555 Berlin, Germany
Email: admin@fitsyou.live

---

## 1. What We Collect

When you use fitsyou, we collect the following:

- **Your photo** — a single profile photo you upload to enable try-ons. This is stored securely and used only to generate try-on images.
- **Product images** — images extracted from fashion product pages you visit while using the extension.
- **Try-on outputs** — the generated images produced by combining your photo with a product image.
- **Body measurements** — if you provide them, the measurements used to produce a sizing verdict.
- **Product URLs and titles** — the URL and title of fashion items you try on, saved to your profile.
- **Account information** — your email address, used for authentication.
- **Usage data** — number of try-ons used per billing period, subscription tier, and basic session data.
- **Analytics data** — anonymous product-usage events collected via PostHog (see Section 7).

We do not collect or transmit your browsing history. A small fitsyou badge may appear on pages so you can quickly open the extension, but no product data is read or sent anywhere until you actively use a feature (e.g. open the popup on a product page).

---

## 2. Legal Basis for Processing (GDPR Art. 6 & Art. 9)

We process your personal data on the following legal bases:

- **Performance of a contract (Art. 6(1)(b))** — to provide the try-on service you request, manage your account, and process subscriptions.
- **Explicit consent (Art. 6(1)(a) and Art. 9(2)(a))** — your uploaded photo, and any facial features within it, may constitute biometric or special-category data. We process this data **only** on the basis of the explicit consent you give before uploading your photo. You may withdraw this consent at any time by deleting your photo or your account, which stops all further processing of it.
- **Legitimate interests (Art. 6(1)(f))** — to maintain the security and integrity of the Service and to understand product usage through privacy-preserving analytics. We balance these interests against your rights and do not use this basis for advertising or profiling.

---

## 3. How We Use Your Data

We use your data solely to provide the Service:

- Your photo and product images are sent to OpenAI's API to generate try-on images.
- Your body measurements, if provided, are compared against retailer sizing charts to produce a sizing verdict.
- Generated try-on images and product links are saved to your fitsyou profile so you can review them later.
- Your email is used to authenticate your account and, if you subscribe, to manage your billing via our payment processor.

We do not use your data for advertising. We do not sell your data to third parties.

---

## 4. Where Your Data Is Stored

- **Profile photo and try-on images** are stored in Cloudflare R2 (EU region).
- **Account, usage, and measurement data** are stored in Supabase (EU West — Frankfurt, Germany).
- **Payment data** is handled by our payment processor and is not stored by us.

All primary storage is within the European Union. Where any processor transfers data outside the EU (see Section 5), we rely on the safeguards described below.

---

## 5. Third-Party Services & International Transfers

We share data with the following third parties only as necessary to operate the Service. Each acts as a data processor under a Data Processing Agreement:

| Service        | Purpose                       | Data shared                          | Location / Transfer safeguard            |
| -------------- | ----------------------------- | ------------------------------------ | ---------------------------------------- |
| OpenAI         | Try-on image generation       | Your profile photo + product image   | USA — Standard Contractual Clauses / DPA |
| Cloudflare R2  | Image storage                 | Try-on output images, profile photo  | EU region                                |
| Supabase       | Database and authentication   | Account data, usage, measurements    | EU West (Frankfurt, Germany)             |
| [PROCESSOR]    | Payment processing            | Email address, subscription info     | [TO CONFIRM — see note below]            |
| PostHog        | Product analytics             | Anonymous usage events               | [TO CONFIRM — EU Cloud vs US]            |

**Image generation:** Your photo and the product image are sent to OpenAI's API to fulfil your try-on request. Under OpenAI's API terms, data sent via the API is **not** used to train OpenAI's models. OpenAI acts as a data processor under a Data Processing Addendum. See [OpenAI's Privacy Policy](https://openai.com/policies/privacy-policy) and [Data Processing Addendum](https://openai.com/policies/data-processing-addendum).

Because OpenAI processes data in the United States, this involves an international transfer outside the EU. We rely on the EU Standard Contractual Clauses (and OpenAI's DPA) as the safeguard for this transfer, as permitted under GDPR Chapter V.

---

## 6. Data Retention

- Your profile photo and try-on images are retained as long as your account is active.
- If you delete your account, your photo and all try-on images are deleted within 30 days.
- Free-tier try-on images are deleted after 7 days.
- Account and billing records may be retained longer where required by German tax and commercial law (e.g. § 147 AO — retention of invoices for up to 10 years). Such records are kept solely for legal compliance and are not used for any other purpose.

---

## 7. Cookies & Analytics

fitsyou.live uses only essential cookies required for authentication and session management. We do not use tracking or advertising cookies.

We use **PostHog** for privacy-preserving product analytics to understand how fitsyou is used and improve it. Analytics events are collected only with your consent (via the cookie banner) and are not used for advertising or third-party profiling. You can decline analytics at any time using the "Essential only" option in the cookie banner.

---

## 8. Your Rights (GDPR)

If you are located in the European Economic Area, you have the right to:

- Access the personal data we hold about you
- Request correction or deletion of your data
- Object to or restrict processing of your data
- Withdraw consent for processing based on consent (such as your photo) at any time
- Request a copy of your data in a portable format
- Lodge a complaint with a supervisory authority. The competent authority for us is the **Berlin Commissioner for Data Protection and Freedom of Information (Berliner Beauftragte für Datenschutz und Informationsfreiheit)**.

To exercise any of these rights, contact us at admin@fitsyou.live. We will respond within one month as required by GDPR.

---

## 9. Data Security

We protect your data using modern encryption in transit (HTTPS/TLS) and at rest where supported by our storage providers. Access to personal data is restricted to what is necessary to operate the Service.

---

## 10. Children's Privacy

fitsyou is not directed at children under 16. We do not knowingly collect data from anyone under 16. If you believe a child has provided us with personal data, contact us and we will delete it.

---

## 11. Changes to This Policy

We may update this policy as the Service evolves. We will notify you of material changes via email or a notice on fitsyou.live. Continued use of the Service after changes constitutes acceptance.

---

## 12. Trademarks & Retailer Names

While using fitsyou, you may see retailer and brand names, logos, and product titles (e.g. "Zara", "H&M") drawn from the product pages you visit. These are trademarks of their respective owners and are shown solely to identify the products you are trying on or comparing — a form of nominative fair use.

fitsyou is an independent virtual try-on tool. We are not affiliated with, sponsored by, or endorsed by any retailer or brand referenced in the Service.

---

## 13. Limited Use Disclosure (Chrome Web Store)

fitsyou's use of information received from Google APIs adheres to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use), including the Limited Use requirements.

---

## 14. Contact

For any privacy-related questions or requests:

**Data Controller:** Anna Arndt (House of Steam)
**Address:** Grünstraße 18, 12555 Berlin, Germany
**Email:** admin@fitsyou.live
**Website:** https://fitsyou.live

© 2026 fitsyou (House of Steam). All rights reserved.
