'use client';

import { Header } from '@/components/layout/Header';
import Link from 'next/link';

export default function CreatorAgreementPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-[var(--font-pixel)] tracking-wider mb-2">
          CREATOR DISTRIBUTION AGREEMENT
        </h1>
        <div className="h-1 w-20 bg-[#9B5DE5] mb-4" />
        <p className="text-sm text-[#666] mb-8">Last updated: February 2025</p>

        <div className="prose prose-sm max-w-none space-y-8 text-[#1a1a1a]">
          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">1. Introduction</h2>
            <p className="text-[#666] leading-relaxed">
              This Creator Distribution Agreement ("Agreement") is entered into between you ("Creator") and
              Auteur.film ("Platform") when you register as a creator and publish content on our platform.
              By publishing content, you agree to be bound by this Agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">2. License Grant</h2>
            <p className="text-[#666] leading-relaxed mb-3">
              You grant Auteur.film a <strong>non-exclusive, worldwide, royalty-free license</strong> to:
            </p>
            <ul className="list-disc list-inside text-[#666] space-y-2 ml-4">
              <li>Host, store, and display your content on the Platform</li>
              <li>Stream and distribute your content to subscribers</li>
              <li>Create promotional materials, thumbnails, and previews</li>
              <li>Transcode and optimize your content for various devices and bandwidths</li>
            </ul>
            <p className="text-[#666] leading-relaxed mt-3">
              This license is limited to operating and promoting the Platform. We will not sublicense your
              content to third-party distributors without your express written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">3. Ownership and Rights</h2>
            <p className="text-[#666] leading-relaxed">
              <strong>You retain full ownership and copyright</strong> of all content you upload. This
              Agreement does not transfer any ownership rights. You are free to distribute your content
              through other platforms and channels simultaneously.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">4. Creator Representations</h2>
            <p className="text-[#666] leading-relaxed mb-3">
              By uploading content, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside text-[#666] space-y-2 ml-4">
              <li>You own or have obtained all necessary rights, licenses, and permissions for the content</li>
              <li>Your content does not infringe any third-party intellectual property rights</li>
              <li>You have obtained all necessary releases from individuals appearing in your content</li>
              <li>Your content complies with all applicable laws and regulations</li>
              <li>Your content does not violate our community guidelines or{' '}
                <Link href="/terms" className="text-[#FF6B6B] hover:underline font-bold">Terms of Service</Link>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">5. Revenue and Compensation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">5.1 Tips</h3>
                <p className="text-[#666] leading-relaxed">
                  Creators receive <strong>99% of all tips</strong> received on their content. The Platform
                  retains 1% as a service fee. Tips are paid directly to your connected wallet in USDC.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">5.2 Creator Rewards Program</h3>
                <p className="text-[#666] leading-relaxed">
                  The Platform may, at its sole discretion, distribute additional rewards to creators based
                  on viewership from paying subscribers. This program is discretionary and subject to change.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">5.3 Future Monetization</h3>
                <p className="text-[#666] leading-relaxed">
                  The Platform reserves the right to implement additional monetization methods in the future
                  (such as advertising). We currently have no plans to do so, but this right is reserved for
                  potential tasteful implementation. We will provide advance notice of any such changes.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">6. Content Guidelines</h2>
            <p className="text-[#666] leading-relaxed mb-3">
              All content must comply with our community standards. Prohibited content includes:
            </p>
            <ul className="list-disc list-inside text-[#666] space-y-2 ml-4">
              <li>Content that infringes copyrights, trademarks, or other intellectual property</li>
              <li>Content depicting illegal activities</li>
              <li>Sexually explicit content involving minors</li>
              <li>Content promoting violence, hate, or discrimination</li>
              <li>Misleading or deceptive content</li>
            </ul>
            <p className="text-[#666] leading-relaxed mt-3">
              We reserve the right to remove content that violates these guidelines without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">7. Term and Termination</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">7.1 Term</h3>
                <p className="text-[#666] leading-relaxed">
                  This Agreement begins when you first publish content and continues until terminated by
                  either party.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">7.2 Termination by Creator</h3>
                <p className="text-[#666] leading-relaxed">
                  You may terminate this Agreement at any time by providing <strong>30 days written notice</strong> to
                  legal@auteur.film. Upon termination, you may request removal of your content from the Platform.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">7.3 Termination by Platform</h3>
                <p className="text-[#666] leading-relaxed">
                  We may terminate this Agreement with <strong>30 days written notice</strong> for convenience,
                  or immediately if you breach this Agreement or our Terms of Service.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">7.4 Effect of Termination</h3>
                <p className="text-[#666] leading-relaxed">
                  Upon termination, we will remove your content from the Platform within a reasonable time.
                  Any tips or revenue earned prior to termination will still be payable to you.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">8. Content Removal</h2>
            <p className="text-[#666] leading-relaxed">
              You may remove your content from the Platform at any time through your dashboard. We may
              also remove content that violates this Agreement, our Terms of Service, or applicable law.
              Removal does not affect any licenses already granted to subscribers who viewed the content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">9. Indemnification</h2>
            <p className="text-[#666] leading-relaxed">
              You agree to indemnify and hold harmless Auteur.film from any claims, damages, or expenses
              arising from: (a) your content; (b) your breach of this Agreement; (c) your violation of
              any third-party rights; or (d) your violation of applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">10. Limitation of Liability</h2>
            <p className="text-[#666] leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUTEUR.FILM'S LIABILITY FOR ANY CLAIMS ARISING FROM
              THIS AGREEMENT SHALL NOT EXCEED THE TOTAL AMOUNT PAID TO YOU BY THE PLATFORM IN THE TWELVE
              MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">11. Modifications</h2>
            <p className="text-[#666] leading-relaxed">
              We may modify this Agreement at any time. We will notify you of material changes via email
              or platform notification at least 30 days before they take effect. Your continued use of
              the Platform after the effective date constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">12. Governing Law</h2>
            <p className="text-[#666] leading-relaxed">
              This Agreement shall be governed by and construed in accordance with the laws of the State
              of Delaware, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">13. Contact</h2>
            <p className="text-[#666] leading-relaxed">
              For questions about this Creator Distribution Agreement, please contact us at{' '}
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
