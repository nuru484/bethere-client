// src/pages/PrivacyPolicyPage.jsx
//
// The privacy policy for the BeThere portfolio demo. Every claim in here
// mirrors what the server actually does (encryption, retention windows,
// deletion paths) - if those change, this document must change with them.
import PropTypes from "prop-types";
import { Link } from "react-router";
import { usePageTitle } from "@/hooks/usePageTitle";
import LegalPageShell, {
  LegalSection,
  LegalText,
  LegalList,
} from "@/components/legal/LegalPageShell";

const Strong = ({ children }) => (
  <strong className="font-semibold text-foreground">{children}</strong>
);
Strong.propTypes = { children: PropTypes.node.isRequired };

const PrivacyPolicyPage = () => {
  usePageTitle("Privacy Policy");

  return (
    <LegalPageShell
      title="Privacy Policy"
      lastUpdated="July 26, 2026"
      crossLink={{ to: "/terms-of-service", label: "Terms of Service" }}
    >
      <LegalSection title="1. Introduction">
        <LegalText>
          BeThere is a portfolio demonstration project built by Nurudeen
          Abdul-Majeed to showcase a face-liveness attendance system. It is not
          a commercial product or a service offered to organizations. Because
          trying it can involve your face, this policy explains, precisely and
          honestly, what data the demo handles, what happens to it, and how to
          remove it.
        </LegalText>
        <LegalText>
          By using the demo you agree to the practices described here. If you
          are not comfortable with any of it, simply explore the parts of the
          demo that do not involve enrolling your face, or do not use it.
        </LegalText>
      </LegalSection>

      <LegalSection title="2. Who runs this project">
        <LegalText>
          This project is built and operated by a single developer:
        </LegalText>
        <LegalList
          items={[
            <>
              <Strong>Developer:</Strong> Nurudeen Abdul-Majeed
            </>,
            <>
              <Strong>Portfolio:</Strong>{" "}
              <a
                href="https://manuru.dev"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline underline-offset-4"
              >
                manuru.dev
              </a>
            </>,
            <>
              <Strong>Email:</Strong>{" "}
              <a
                href="mailto:abdulmajeednurudeen48@gmail.com"
                className="font-medium text-foreground underline underline-offset-4"
              >
                abdulmajeednurudeen48@gmail.com
              </a>
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. What trying the demo looks like">
        <LegalText>
          Visitors explore BeThere through shared, one-click demo accounts: a
          demo attendant (the regular user role) and a demo admin. There is no
          public sign-up. If you choose to try the face-scan flow on the demo
          attendant account, you will be asked for explicit consent before any
          camera capture starts, and you can remove everything you created
          afterwards (see section 7).
        </LegalText>
        <LegalText>
          Because the demo accounts are shared, anything you type into the app
          (names, event details, attendance records) can be seen and deleted by
          other visitors using the same demo accounts. Please do not enter real
          personal information beyond what the face-scan flow itself needs.
        </LegalText>
      </LegalSection>

      <LegalSection title="4. Information the demo collects">
        <LegalText>
          <Strong>4.1 Face data.</Strong> If you consent to the face scan, your
          browser captures a short burst of camera frames while you follow the
          on-screen actions. The server uses those frames to verify liveness
          and to derive a compact numeric face template. The template is stored
          encrypted (AES-256-GCM, with rotating keys and ciphertexts bound to
          the owning account). The raw frames of a successful enrollment or
          check-in are processed in memory and are not stored anywhere.
        </LegalText>
        <LegalText>
          <Strong>4.2 Flagged attempts.</Strong> The one exception to the
          no-stored-frames rule: if a check-in attempt is flagged as suspicious
          by the anomaly checks, its frames are kept as review evidence in
          access-controlled storage, reachable only through short-lived signed
          links, and are deleted automatically after 30 days.
        </LegalText>
        <LegalText>
          <Strong>4.3 Account and attendance data.</Strong> Demo accounts carry
          a name and email address. Checking in or out of a demo event creates
          an attendance record (event, timestamps, PRESENT or LATE status).
        </LegalText>
        <LegalText>
          <Strong>4.4 Security and operations data.</Strong> The server keeps
          audit logs of security-relevant actions for 180 days and uses
          rate-limiting counters and single-use liveness challenges that are
          swept continuously once expired. There is no analytics or tracking of
          any kind.
        </LegalText>
      </LegalSection>

      <LegalSection title="5. On-device face guidance">
        <LegalText>
          During capture, a face-landmark model (MediaPipe FaceLandmarker) runs
          locally in your browser purely to guide you through the requested
          actions. Its output never leaves your device; the server re-verifies
          everything independently from the uploaded frames and trusts nothing
          the on-device guide says.
        </LegalText>
      </LegalSection>

      <LegalSection title="6. How your data is used">
        <LegalText>
          Data collected by the demo is used for exactly one purpose: making
          the demo work (verifying that a live, consenting person is present
          and recording that attendance). It is never sold, shared, rented,
          used for advertising, used to train models, or used for anything
          else. The face template is never shown to anyone, including the
          developer and demo admins; it exists only as ciphertext that the
          server decrypts in memory at match time.
        </LegalText>
      </LegalSection>

      <LegalSection title="7. Deleting your data">
        <LegalText>
          You are encouraged to clean up after trying the demo, and the app is
          built so you can do it yourself:
        </LegalText>
        <LegalList
          items={[
            <>
              Sign in with the <Strong>demo admin</Strong> account and reset
              the face scan you enrolled (or delete the test records you
              created). Deleting a face scan destroys the encrypted template
              immediately, and deleting an account destroys its biometric data
              in the same transaction.
            </>,
            <>
              Or email{" "}
              <a
                href="mailto:abdulmajeednurudeen48@gmail.com"
                className="font-medium text-foreground underline underline-offset-4"
              >
                abdulmajeednurudeen48@gmail.com
              </a>{" "}
              and I will delete it for you.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="8. If you do not delete it: automatic retention limits">
        <LegalText>
          Nothing in the demo is kept forever. If you leave your test data
          behind, these limits apply automatically:
        </LegalText>
        <LegalList
          items={[
            <>
              <Strong>Face templates:</Strong> encrypted at rest at all times,
              and purged automatically after 365 days without a check-in (the
              consent record is cleared with them, so re-enrollment requires
              fresh consent).
            </>,
            <>
              <Strong>Flagged-attempt frames:</Strong> deleted after 30 days.
            </>,
            <>
              <Strong>Audit logs:</Strong> deleted after 180 days.
            </>,
            <>
              <Strong>Expired tokens, codes, and liveness challenges:</Strong>{" "}
              swept continuously by a scheduled cleanup job.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Security">
        <LegalText>
          The demo is built to production security standards: face templates
          are encrypted with AES-256-GCM under rotatable keys and bound to
          their owning account so a copied ciphertext is useless, all liveness
          and identity verification happens server-side from raw pixels,
          sessions use httpOnly cookies that page JavaScript cannot read, and
          sensitive endpoints are rate-limited. That said, no online system is
          completely secure, and this one is a demo run by one person. Do not
          submit anything to it that you would consider sensitive beyond what
          trying the face scan requires.
        </LegalText>
      </LegalSection>

      <LegalSection title="10. Infrastructure providers">
        <LegalText>
          The demo runs on ordinary cloud infrastructure: a frontend host, an
          API host, a managed PostgreSQL database, a Redis instance for
          background jobs, and Cloudinary for image storage (event covers and
          the flagged-attempt evidence described above). These providers
          process data only to host the application; no third party receives
          your data for its own purposes.
        </LegalText>
      </LegalSection>

      <LegalSection title="11. Cookies">
        <LegalText>
          The app sets only strictly necessary cookies: httpOnly access and
          refresh tokens that keep you signed in. Your theme preference is
          stored in your own browser&apos;s local storage. There are no analytics,
          advertising, or cross-site tracking cookies.
        </LegalText>
      </LegalSection>

      <LegalSection title="12. Children">
        <LegalText>
          The demo is not directed at anyone under 18, and no data is
          knowingly collected from minors.
        </LegalText>
      </LegalSection>

      <LegalSection title="13. Changes to this policy">
        <LegalText>
          If the demo&apos;s data practices change, this document will be updated
          with a new date at the top. Continued use after a change means you
          accept the updated policy.
        </LegalText>
      </LegalSection>

      <LegalSection title="14. Contact">
        <LegalText>
          Questions, deletion requests, or security reports:{" "}
          <a
            href="mailto:abdulmajeednurudeen48@gmail.com"
            className="font-medium text-foreground underline underline-offset-4"
          >
            abdulmajeednurudeen48@gmail.com
          </a>
          . See also the{" "}
          <Link
            to="/terms-of-service"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Terms of Service
          </Link>
          .
        </LegalText>
      </LegalSection>
    </LegalPageShell>
  );
};

export default PrivacyPolicyPage;
