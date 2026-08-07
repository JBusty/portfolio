import { SignUp } from '@clerk/nextjs';
import styles from '../../jobwatch.module.css';

export default function SignUpPage() {
  return (
    <main id="main-content" tabIndex={-1} className={styles.shell}>
      <div className={`${styles.wrap} ${styles.authPage}`}>
        <span className={styles.groupLabel}>Jobwatch</span>
        <p className={styles.authLead}>
          Free, and the board works without one — an account is what makes your filters
          and your application log survive the tab closing.
        </p>
        <SignUp />
      </div>
    </main>
  );
}
