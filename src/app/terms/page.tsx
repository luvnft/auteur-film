'use client';

import { Header } from '@/components/layout/Header';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-[var(--font-pixel)] tracking-wider mb-2">
          TERMS OF SERVICE
        </h1>
        <div className="h-1 w-20 bg-[#FF6B6B] mb-4" />
        <p className="text-sm text-[#666] mb-8">Last updated: February 2025</p>

        <div className="prose prose-sm max-w-none space-y-8 text-[#1a1a1a]">
          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">1. Acceptance of Terms</h2>
            <p className="text-[#666] leading-relaxed">
              By accessing or using Auteur.film ("Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use the Service. We may modify these terms at any time,
              and your continued use constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">2. Description of Service</h2>
            <p className="text-[#666] leading-relaxed">
              Auteur.film is a streaming platform that enables creators to publish and distribute video content,
              and allows subscribers to access, view, and engage with that content. The Service includes features
              such as content viewing, tipping, commenting, and leaderboard participation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">3. Eligibility</h2>
            <p className="text-[#666] leading-relaxed">
              You must be at least 18 years old to use the Service. By using the Service, you represent and
              warrant that you meet this age requirement and have the legal capacity to enter into these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">4. Account Registration</h2>
            <p className="text-[#666] leading-relaxed">
              To access certain features, you must connect a cryptocurrency wallet. You are responsible for
              maintaining the security of your wallet and any credentials associated with your account. You
              agree to notify us immediately of any unauthorized access or use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">5. Subscriptions and Payments</h2>
            <p className="text-[#666] leading-relaxed mb-3">
              Subscriber access requires a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc list-inside text-[#666] space-y-2 ml-4">
              <li>Pay the applicable subscription fee</li>
              <li>Automatic renewal unless cancelled before the renewal date</li>
              <li>No refunds for partial subscription periods</li>
            </ul>
            <p className="text-[#666] leading-relaxed mt-3">
              All payments are processed in USDC on the Base network. You are responsible for any network
              transaction fees.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">6. Creator Obligations and Content Ownership</h2>
            <p className="text-[#666] leading-relaxed mb-3">
              Creators who publish content must agree to the{' '}
              <Link href="/creator-agreement" className="text-[#FF6B6B] hover:underline font-bold">
                Creator Distribution Agreement
              </Link>
              . By uploading content to Auteur.film, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside text-[#666] space-y-2 ml-4">
              <li><strong>You own all rights</strong> to the content you upload, or have obtained all necessary licenses, permissions, and consents</li>
              <li><strong>Your content does not infringe</strong> any third-party intellectual property rights, including copyrights, trademarks, patents, trade secrets, or rights of publicity</li>
              <li><strong>You have obtained consent</strong> from any individuals whose name, image, likeness, or voice appears in your content</li>
              <li><strong>You will not upload</strong> content that contains copyrighted music, video clips, or other materials without proper authorization</li>
            </ul>
            <div className="mt-4 p-4 bg-[#FFE66D]/20 border-3 border-[#FFE66D]">
              <p className="text-sm font-bold text-[#1a1a1a]">
                IMPORTANT: All intellectual property liability for uploaded content rests solely with the uploader, not Auteur.film. You agree to indemnify and hold harmless Auteur.film from any claims arising from your uploaded content.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">7. Prohibited Content and Conduct</h2>
            <p className="text-[#666] leading-relaxed mb-3">
              You agree not to upload, post, or transmit any content that:
            </p>
            <ul className="list-disc list-inside text-[#666] space-y-2 ml-4">
              <li>Infringes any third-party intellectual property rights</li>
              <li>Is unlawful, harmful, threatening, abusive, or harassing</li>
              <li>Contains sexually explicit material involving minors</li>
              <li>Promotes violence, discrimination, or illegal activities</li>
              <li>Contains malware, viruses, or other harmful code</li>
              <li>Violates any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">8. Intellectual Property</h2>
            <p className="text-[#666] leading-relaxed">
              The Service and its original content (excluding user-submitted content) are owned by Auteur.film
              and are protected by copyright, trademark, and other intellectual property laws. User-submitted
              content remains the property of the respective creators, subject to the licenses granted in these
              terms and the Creator Distribution Agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">9. DMCA and Copyright Policy</h2>
            <p className="text-[#666] leading-relaxed mb-3">
              We respect intellectual property rights and comply with the Digital Millennium Copyright Act (DMCA).
              For complete details, see our{' '}
              <Link href="/dmca" className="text-[#FF6B6B] hover:underline font-bold">
                DMCA Policy
              </Link>
              .
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">Repeat Infringer Policy</h3>
                <p className="text-[#666] leading-relaxed">
                  We maintain a strict three-strike policy for repeat infringers:
                </p>
                <ul className="list-disc list-inside text-[#666] space-y-2 ml-4 mt-2">
                  <li><strong>First Strike:</strong> Content removed, formal warning issued</li>
                  <li><strong>Second Strike:</strong> Content removed, final warning issued</li>
                  <li><strong>Third Strike:</strong> Account permanently suspended</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">Consequences of Infringement</h3>
                <p className="text-[#666] leading-relaxed">
                  Users who upload infringing content acknowledge that such content may be removed without notice,
                  their account may be terminated, and they may be held personally liable for any damages arising
                  from such infringement. Auteur.film acts only as a hosting platform and assumes no liability for
                  user-uploaded content.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">Filing a DMCA Notice</h3>
                <p className="text-[#666] leading-relaxed">
                  If you believe content on our platform infringes your copyright, please contact our DMCA Agent with:
                </p>
                <ul className="list-disc list-inside text-[#666] space-y-2 ml-4 mt-2">
                  <li>Identification of the copyrighted work</li>
                  <li>Identification of the allegedly infringing material</li>
                  <li>Your contact information</li>
                  <li>A statement of good faith belief</li>
                  <li>A statement of accuracy under penalty of perjury</li>
                  <li>Your physical or electronic signature</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">10. Disclaimer of Warranties</h2>
            <p className="text-[#666] leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
              OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">11. Limitation of Liability</h2>
            <p className="text-[#666] leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUTEUR.FILM SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
              WHETHER INCURRED DIRECTLY OR INDIRECTLY.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">12. Indemnification</h2>
            <p className="text-[#666] leading-relaxed">
              You agree to indemnify and hold harmless Auteur.film and its officers, directors, employees,
              and agents from any claims, damages, losses, or expenses arising from your use of the Service
              or violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">13. Termination</h2>
            <p className="text-[#666] leading-relaxed">
              We may terminate or suspend your account and access to the Service immediately, without prior
              notice, for conduct that we believe violates these terms or is harmful to other users, us, or
              third parties, or for any other reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">14. Governing Law</h2>
            <p className="text-[#666] leading-relaxed">
              These terms shall be governed by and construed in accordance with the laws of the State of
              Delaware, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">15. Contact</h2>
            <p className="text-[#666] leading-relaxed">
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@auteur.film" className="text-[#FF6B6B] hover:underline font-bold">
                legal@auteur.film
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
