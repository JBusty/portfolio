import { SignIn } from '@clerk/nextjs';
import styles from '../../jobwatch.module.css';

/**
 * Catch-all segment, not a plain page: Clerk drives its own steps — factor two,
 * password reset, email verification — as sub-paths of this route, and a
 * non-catch-all route 404s the moment the flow moves past its first screen.
 */
export default function SignInPage() {
  return (
    <main id="main-content" tabIndex={-1} className={styles.shell}>
      <div className={`${styles.wrap} ${styles.authPage}`}>
        <span className={styles.groupLabel}>Jobwatch</span>
        <p className={styles.authLead}>
          Sign in to keep your filters, your application log and the postings you have
          dismissed.
        </p>
        {/* Appearance is left alone deliberately. Clerk's own styling is
            coherent, and a half-themed auth form reads worse than an unthemed
            one — the place to spend that effort is the tool behind it. */}
        <SignIn />
      </div>
    </main>
  );
}
