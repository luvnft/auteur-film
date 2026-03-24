'use client';

import { Header } from '@/components/layout/Header';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-[var(--font-pixel)] tracking-wider mb-2">
          PRIVACY POLICY
        </h1>
        <div className="h-1 w-20 bg-[#4ECDC4] mb-4" />
        <p className="text-sm text-[#666] mb-8">Last updated: February 2025</p>

        <div className="prose prose-sm max-w-none space-y-8 text-[#1a1a1a]">
          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">1. Introduction</h2>
            <p className="text-[#666] leading-relaxed">
              Auteur.film ("we," "our," or "us") respects your privacy and is committed to protecting
              your personal data. This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">2.1 Information You Provide</h3>
                <ul className="list-disc list-inside text-[#666] space-y-2 ml-4">
                  <li>Wallet address when you connect your cryptocurrency wallet</li>
                  <li>Email address (if provided for notifications)</li>
                  <li>Profile information (display name, avatar, bio, username)</li>
                  <li>Content you upload (videos, thumbnails, descriptions)</li>
                  <li>Comments, tips, and other interactions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">2.2 Information Collected Automatically</h3>
                <ul className="list-disc list-inside text-[#666] space-y-2 ml-4">
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and approximate location</li>
                  <li>Usage data (pages visited, content viewed, watch time)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">2.3 Blockchain Data</h3>
                <p className="text-[#666] leading-relaxed">
                  Transactions on the blockchain (tips, subscriptions) are publicly visible. Your wallet
                  address and transaction history on the Base network are inherently public information.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">3. How We Use Your Information</h2>
            <p className="text-[#666] leading-relaxed mb-3">We use your information to:</p>
            <ul className="list-disc list-inside text-[#666] space-y-2 ml-4">
              <li>Provide and maintain the Service</li>
              <li>Process transactions and payments</li>
              <li>Personalize your experience and content recommendations</li>
              <li>Communicate with you about updates, features, and support</li>
              <li>Calculate and display leaderboard rankings</li>
              <li>Detect and prevent fraud, abuse, and security issues</li>
              <li>Comply with legal obligations</li>
              <li>Analyze usage patterns to improve the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">4. Information Sharing</h2>
            <p className="text-[#666] leading-relaxed mb-3">We may share your information with:</p>
            <ul className="list-disc list-inside text-[#666] space-y-2 ml-4">
              <li><strong>Service Providers:</strong> Third parties that help us operate the platform (hosting, analytics, payment processing)</li>
              <li><strong>Other Users:</strong> Your public profile, content, and interactions are visible to other users</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="text-[#666] leading-relaxed mt-3">
              We do not sell your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">5. Data Storage and Security</h2>
            <p className="text-[#666] leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal
              data against unauthorized access, alteration, disclosure, or destruction. However, no
              method of transmission over the Internet is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">6. Data Retention</h2>
            <p className="text-[#666] leading-relaxed">
              We retain your personal data for as long as your account is active or as needed to provide
              you services. We may retain certain information as required by law or for legitimate
              business purposes. You may request deletion of your data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">7. Your Rights</h2>
            <p className="text-[#666] leading-relaxed mb-3">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-[#666] space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
            </ul>
            <p className="text-[#666] leading-relaxed mt-3">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@auteur.film" className="text-[#FF6B6B] hover:underline font-bold">
                privacy@auteur.film
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">8. Cookies</h2>
            <p className="text-[#666] leading-relaxed">
              We use cookies and similar technologies to enhance your experience, analyze usage, and
              provide personalized content. You can control cookies through your browser settings,
              but disabling cookies may affect the functionality of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">9. Third-Party Services</h2>
            <p className="text-[#666] leading-relaxed">
              Our Service may contain links to third-party websites or integrate with third-party
              services (such as wallet providers and payment processors). We are not responsible for
              the privacy practices of these third parties. We encourage you to review their privacy
              policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">10. Children's Privacy</h2>
            <p className="text-[#666] leading-relaxed">
              The Service is not intended for individuals under 18 years of age. We do not knowingly
              collect personal information from children. If we learn that we have collected personal
              information from a child, we will take steps to delete that information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">11. International Transfers</h2>
            <p className="text-[#666] leading-relaxed">
              Your information may be transferred to and processed in countries other than your own.
              These countries may have different data protection laws. By using the Service, you
              consent to such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">12. Changes to This Policy</h2>
            <p className="text-[#666] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by posting the new policy on this page and updating the "Last updated" date.
              Your continued use of the Service after changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">13. Contact Us</h2>
            <p className="text-[#666] leading-relaxed">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-3 p-4 bg-white border-3 border-[#1a1a1a]">
              <p className="text-[#666]">
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@auteur.film" className="text-[#FF6B6B] hover:underline font-bold">
                  privacy@auteur.film
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
