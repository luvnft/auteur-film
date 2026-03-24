'use client';

import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { Shield, AlertTriangle, FileText, Mail, Scale, UserX } from 'lucide-react';

const DMCA_AGENT_EMAIL = process.env.NEXT_PUBLIC_DMCA_AGENT_EMAIL || 'dmca@auteur.film';

export default function DMCAPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 bg-[#FF6B6B] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-[var(--font-pixel)] tracking-wider">
              DMCA POLICY
            </h1>
            <div className="h-1 w-20 bg-[#4ECDC4] mt-1" />
          </div>
        </div>
        <p className="text-sm text-[#666] mb-8">Last updated: February 2025</p>

        <div className="prose prose-sm max-w-none space-y-8 text-[#1a1a1a]">
          {/* Introduction */}
          <section className="card-retro-static p-6 bg-white">
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#4ECDC4]" />
              Safe Harbor Compliance
            </h2>
            <p className="text-[#666] leading-relaxed">
              Auteur.film ("Platform") respects the intellectual property rights of others and expects
              users of the Platform to do the same. In accordance with the Digital Millennium Copyright
              Act of 1998 ("DMCA"), we will respond expeditiously to claims of copyright infringement
              committed using the Platform that are reported to our Designated Copyright Agent.
            </p>
          </section>

          {/* DMCA Agent */}
          <section className="card-retro-static p-6 bg-white">
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#FF6B6B]" />
              Designated DMCA Agent
            </h2>
            <p className="text-[#666] leading-relaxed mb-4">
              Our Designated Agent to receive notification of alleged copyright infringement is:
            </p>
            <div className="p-4 bg-[#FFF8F0] border-3 border-[#1a1a1a]">
              <p className="font-bold text-[#1a1a1a]">Auteur.film Copyright Agent</p>
              <p className="text-[#666] mt-2">
                Email:{' '}
                <a href={`mailto:${DMCA_AGENT_EMAIL}`} className="text-[#FF6B6B] hover:underline font-bold">
                  {DMCA_AGENT_EMAIL}
                </a>
              </p>
            </div>
          </section>

          {/* How to Submit a Takedown Notice */}
          <section className="card-retro-static p-6 bg-white">
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#FFE66D]" />
              How to Submit a Takedown Notice
            </h2>
            <p className="text-[#666] leading-relaxed mb-4">
              If you believe that content available on Auteur.film infringes one or more of your
              copyrights, please send a written notification containing the following information
              to our DMCA Agent:
            </p>
            <ol className="list-decimal list-inside text-[#666] space-y-3 ml-4">
              <li>
                <strong className="text-[#1a1a1a]">Identification of the copyrighted work:</strong>{' '}
                A description of the copyrighted work that you claim has been infringed, or if
                multiple copyrighted works are covered by a single notification, a representative
                list of such works.
              </li>
              <li>
                <strong className="text-[#1a1a1a]">Identification of the infringing material:</strong>{' '}
                The URL or other specific location on the Platform where the material you claim is
                infringing is located. Provide enough information for us to locate the material.
              </li>
              <li>
                <strong className="text-[#1a1a1a]">Your contact information:</strong>{' '}
                Your name, mailing address, telephone number, and email address.
              </li>
              <li>
                <strong className="text-[#1a1a1a]">Good faith statement:</strong>{' '}
                A statement that you have a good faith belief that use of the material in the
                manner complained of is not authorized by the copyright owner, its agent, or the law.
              </li>
              <li>
                <strong className="text-[#1a1a1a]">Accuracy statement:</strong>{' '}
                A statement that the information in the notification is accurate, and under penalty
                of perjury, that you are authorized to act on behalf of the owner of an exclusive
                right that is allegedly infringed.
              </li>
              <li>
                <strong className="text-[#1a1a1a]">Physical or electronic signature:</strong>{' '}
                A physical or electronic signature of a person authorized to act on behalf of the
                owner of the copyright that has allegedly been infringed.
              </li>
            </ol>
          </section>

          {/* Counter-Notification */}
          <section className="card-retro-static p-6 bg-white">
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#9B5DE5]" />
              Counter-Notification Procedure
            </h2>
            <p className="text-[#666] leading-relaxed mb-4">
              If you believe that your content was removed or disabled by mistake or
              misidentification, you may file a counter-notification with our DMCA Agent containing
              the following:
            </p>
            <ol className="list-decimal list-inside text-[#666] space-y-3 ml-4">
              <li>
                <strong className="text-[#1a1a1a]">Identification of the material:</strong>{' '}
                Identification of the material that has been removed or to which access has been
                disabled, and the location at which the material appeared before it was removed or
                access to it was disabled.
              </li>
              <li>
                <strong className="text-[#1a1a1a]">Good faith statement:</strong>{' '}
                A statement under penalty of perjury that you have a good faith belief that the
                material was removed or disabled as a result of mistake or misidentification of the
                material to be removed or disabled.
              </li>
              <li>
                <strong className="text-[#1a1a1a]">Consent to jurisdiction:</strong>{' '}
                A statement that you consent to the jurisdiction of the Federal District Court for
                the judicial district in which your address is located, or if your address is
                outside of the United States, for any judicial district in which the service
                provider may be found, and that you will accept service of process from the person
                who provided the original notification or an agent of such person.
              </li>
              <li>
                <strong className="text-[#1a1a1a]">Your contact information:</strong>{' '}
                Your name, address, and telephone number.
              </li>
              <li>
                <strong className="text-[#1a1a1a]">Physical or electronic signature:</strong>{' '}
                Your physical or electronic signature.
              </li>
            </ol>
            <div className="mt-4 p-4 bg-[#FFE66D]/20 border-3 border-[#FFE66D]">
              <p className="text-sm text-[#1a1a1a] font-medium">
                <strong>Note:</strong> Upon receipt of a valid counter-notification, we will forward
                it to the original complaining party. If the original party does not file a court
                action within 10-14 business days, we may restore the removed content.
              </p>
            </div>
          </section>

          {/* Repeat Infringer Policy */}
          <section className="card-retro-static p-6 bg-white border-3 border-[#FF6B6B]">
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
              <UserX className="h-5 w-5 text-[#FF6B6B]" />
              Repeat Infringer Policy
            </h2>
            <p className="text-[#666] leading-relaxed mb-4">
              Auteur.film maintains a strict policy regarding repeat infringers in accordance with
              the DMCA. Our policy operates on a three-strike system:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 bg-[#FFE66D] border-2 border-[#1a1a1a] flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <p className="font-bold text-[#1a1a1a]">First Strike</p>
                  <p className="text-sm text-[#666]">
                    Content is removed and the user receives a formal warning via email.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 bg-[#FF6B6B]/50 border-2 border-[#1a1a1a] flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <p className="font-bold text-[#1a1a1a]">Second Strike</p>
                  <p className="text-sm text-[#666]">
                    Content is removed. User receives a final warning that another violation will
                    result in account termination.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 bg-[#FF6B6B] border-2 border-[#1a1a1a] flex items-center justify-center flex-shrink-0 font-bold text-white">
                  3
                </div>
                <div>
                  <p className="font-bold text-[#1a1a1a]">Third Strike</p>
                  <p className="text-sm text-[#666]">
                    Account is permanently suspended. The user is banned from creating new accounts.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Right of Publicity */}
          <section className="card-retro-static p-6 bg-white">
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#FF6B6B]" />
              Right of Publicity Violations
            </h2>
            <p className="text-[#666] leading-relaxed">
              In addition to copyright claims, we also accept reports regarding unauthorized use of
              a person's name, image, likeness, or other identifying characteristics for commercial
              purposes without consent. If you believe your right of publicity has been violated,
              please contact our DMCA Agent with documentation supporting your claim.
            </p>
          </section>

          {/* Misrepresentation Warning */}
          <section className="card-retro-static p-6 bg-[#FF6B6B]/10 border-3 border-[#FF6B6B]">
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#FF6B6B]" />
              Warning About Misrepresentation
            </h2>
            <p className="text-[#666] leading-relaxed">
              Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents
              that material or activity is infringing, or that material or activity was removed or
              disabled by mistake or misidentification, may be subject to liability for damages,
              including costs and attorneys' fees.
            </p>
          </section>

          {/* Report Button */}
          <section className="card-retro-static p-6 bg-[#4ECDC4]/10 border-3 border-[#4ECDC4]">
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">
              Report Infringing Content
            </h2>
            <p className="text-[#666] leading-relaxed mb-4">
              You can also report potentially infringing content directly through our platform.
              Look for the "Report" button on any content page to submit a report for review.
            </p>
            <p className="text-[#666] leading-relaxed">
              For formal DMCA notices, please email:{' '}
              <a href={`mailto:${DMCA_AGENT_EMAIL}`} className="text-[#FF6B6B] hover:underline font-bold">
                {DMCA_AGENT_EMAIL}
              </a>
            </p>
          </section>

          {/* Contact */}
          <section className="card-retro-static p-6 bg-white">
            <h2 className="text-xl font-bold uppercase tracking-wide mb-3">Contact Us</h2>
            <p className="text-[#666] leading-relaxed">
              If you have questions about this DMCA Policy, please contact us at:{' '}
              <a href={`mailto:${DMCA_AGENT_EMAIL}`} className="text-[#FF6B6B] hover:underline font-bold">
                {DMCA_AGENT_EMAIL}
              </a>
            </p>
          </section>

          {/* Links */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/terms" className="text-[#FF6B6B] hover:underline font-bold text-sm">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-[#FF6B6B] hover:underline font-bold text-sm">
              Privacy Policy
            </Link>
            <Link href="/creator-agreement" className="text-[#FF6B6B] hover:underline font-bold text-sm">
              Creator Agreement
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
