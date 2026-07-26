// src/pages/TermsOfServicePage.jsx
//
// Terms of service for the BeThere portfolio demo. The load-bearing sections
// are 2 (this is a demo, not a service), 5 (biometric consent), and 6 (demo
// data is shared and may be wiped) - keep those aligned with reality.
import { Link } from "react-router";
import { usePageTitle } from "@/hooks/usePageTitle";
import LegalPageShell, {
  LegalSection,
  LegalText,
  LegalList,
} from "@/components/legal/LegalPageShell";

const TermsOfServicePage = () => {
  usePageTitle("Terms of Service");

  return (
    <LegalPageShell
      title="Terms of Service"
      lastUpdated="July 26, 2026"
      crossLink={{ to: "/privacy-policy", label: "Privacy Policy" }}
    >
      <LegalSection title="1. Acceptance of terms">
        <LegalText>
          By accessing or using BeThere you agree to these Terms of Service.
          If you do not agree, do not use the demo.
        </LegalText>
      </LegalSection>

      <LegalSection title="2. What BeThere is (and is not)">
        <LegalText>
          BeThere is a portfolio demonstration project: a working showcase of
          a face-liveness attendance system, built and operated by Nurudeen
          Abdul-Majeed to demonstrate engineering work. It is not a commercial
          product, it is not offered as a service to any organization, and no
          real attendance is tracked on it. Everything in the app is test data
          for demonstration purposes.
        </LegalText>
      </LegalSection>

      <LegalSection title="3. Trying the demo">
        <LegalText>
          The demo is explored through shared demo accounts (a demo attendant
          and a demo admin) available from the login page. You may enroll a
          face to try the check-in flow, subject to one strict rule: only your
          own face, with your own consent. Do not enroll another person&apos;s
          face, a photo, a video, or any likeness that is not you, live, in
          front of the camera.
        </LegalText>
        <LegalText>
          After trying the face scan you can, and are encouraged to, remove
          your test data yourself using the demo admin account. How deletion
          and retention work is described in the{" "}
          <Link
            to="/privacy-policy"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          .
        </LegalText>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <LegalText>You agree not to:</LegalText>
        <LegalList
          items={[
            "use the demo for any unlawful purpose;",
            "enroll or attempt to verify anyone's face but your own;",
            "attempt to access, modify, or delete data in ways the app does not offer through its own interface;",
            "disrupt the service, degrade it for other visitors, or subject it to automated load;",
            "upload malicious content or attempt to plant it in the app;",
            "misrepresent the demo as a real attendance service or use records from it as evidence of anything.",
          ]}
        />
        <LegalText>
          Good-faith security research is welcome; if you find a
          vulnerability, please report it by email instead of exploiting it.
        </LegalText>
      </LegalSection>

      <LegalSection title="5. Biometric consent">
        <LegalText>
          Face enrollment never happens silently: the app requires an explicit
          consent step before any capture, and the server refuses enrollments
          that do not carry it. By consenting you confirm the face being
          enrolled is your own. The Privacy Policy, which describes exactly
          how face data is processed, encrypted, and deleted, is part of these
          Terms.
        </LegalText>
      </LegalSection>

      <LegalSection title="6. Demo data is shared and impermanent">
        <LegalText>
          The demo accounts are shared by every visitor. Anything you enter
          (names, events, attendance records) may be viewed, edited, or
          deleted by other visitors, and the developer may reset or wipe the
          demo database at any time without notice. Do not store anything you
          care about in the demo, and do not enter real personal information
          beyond what trying the face scan requires. Your enrolled face
          template itself is never visible to anyone; it exists only encrypted
          on the server.
        </LegalText>
      </LegalSection>

      <LegalSection title="7. Intellectual property">
        <LegalText>
          The BeThere source code is open source under the MIT License on{" "}
          <a
            href="https://github.com/nuru484"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-4"
          >
            GitHub
          </a>
          . The BeThere name, design, and site content belong to the
          developer. You may not present the demo, or a copy of it, as your
          own work or as a live commercial service.
        </LegalText>
      </LegalSection>

      <LegalSection title="8. Disclaimer of warranties">
        <LegalText>
          The demo is provided &quot;as is&quot; and &quot;as
          available&quot;, without warranties of any kind, express or implied,
          including fitness for a particular purpose. It may be changed,
          broken, offline, or wiped at any time.
        </LegalText>
      </LegalSection>

      <LegalSection title="9. Limitation of liability">
        <LegalText>
          To the maximum extent permitted by law, the developer is not liable
          for any indirect, incidental, or consequential damages arising from
          your use of the demo, including loss of data you chose to store in
          it. Your sole remedy for dissatisfaction with the demo is to stop
          using it and, if you wish, have your data deleted as described in
          the Privacy Policy.
        </LegalText>
      </LegalSection>

      <LegalSection title="10. Changes to these terms">
        <LegalText>
          These Terms may be revised at any time; the date at the top reflects
          the latest version. Continued use after a change means you accept
          the revised Terms.
        </LegalText>
      </LegalSection>

      <LegalSection title="11. Governing law">
        <LegalText>
          These Terms are governed by the laws of the Republic of Ghana.
        </LegalText>
      </LegalSection>

      <LegalSection title="12. Contact">
        <LegalText>
          Questions about these Terms:{" "}
          <a
            href="mailto:abdulmajeednurudeen48@gmail.com"
            className="font-medium text-foreground underline underline-offset-4"
          >
            abdulmajeednurudeen48@gmail.com
          </a>
          .
        </LegalText>
      </LegalSection>
    </LegalPageShell>
  );
};

export default TermsOfServicePage;
