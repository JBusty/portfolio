'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';
import styles from '../jobwatch.module.css';

const INITIAL: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, INITIAL);

  return (
    // The root layout's skip-link targets this id; without it the link is a
    // dead jump on this route.
    <main id="main-content" tabIndex={-1} className={styles.shell}>
      <div className={`${styles.wrap} ${styles.login}`}>
        <span className={styles.groupLabel}>Jobwatch</span>
        <p className={styles.fieldHint}>A private tool. One password, no accounts.</p>

        <form action={formAction} className={styles.loginForm}>
          <input
            className={styles.input}
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="password"
            aria-label="Password"
            aria-invalid={state.error != null}
            autoFocus
            required
          />
          <button type="submit" className={styles.toggle} disabled={pending}>
            {pending ? 'Checking…' : 'Enter'}
          </button>
        </form>

        {/* aria-live so the failure is announced, not just repainted. */}
        <p className={styles.loginError} role="status" aria-live="polite">
          {state.error ?? ''}
        </p>
      </div>
    </main>
  );
}
