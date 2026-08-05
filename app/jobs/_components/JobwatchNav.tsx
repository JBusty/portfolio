'use client';

import { useRef, useState } from 'react';
import { logout } from '../login/actions';
import { useClickOff } from './useClickOff';
import styles from '../jobwatch.module.css';

/**
 * The tool's own chrome.
 *
 * /jobs renders without the portfolio's TopBar, which left the page with no
 * identity above the fold and no way out of a session. This is both: a type
 * logo on the left, and on the right the one account there is.
 *
 * The logo is set in type rather than drawn. The tool has no mark and does not
 * need one — the word with the accent stop is already how it signs itself in
 * the hero, and repeating it small is what makes chrome read as chrome.
 */

const USER = { name: 'Joshua Bussey', initials: 'JB' };

type Props = {
  /** So the page can measure this bar and pin the toolbar below it. */
  ref?: React.Ref<HTMLElement>;
  /**
   * Pinned rather than sitting at the top of the page. Only then does it go
   * glass — at rest it is on the hero's own ground and the two read as one dark
   * block, which a blur would break for no gain since there is nothing behind
   * it to see through to.
   */
  stuck?: boolean;
};

export default function JobwatchNav({ ref, stuck = false }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useClickOff(open, () => setOpen(false), menuRef, buttonRef);

  return (
    <nav className={styles.nav} aria-label="Jobwatch" ref={ref} data-stuck={stuck}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <span className={styles.navLogo}>
          Jobwatch<span className={styles.navLogoStop}>.</span>
        </span>

        <div className={styles.navAccount}>
          <button
            type="button"
            ref={buttonRef}
            className={styles.navProfile}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <span className={styles.navAvatar} aria-hidden="true">{USER.initials}</span>
            <span className={styles.navName}>{USER.name}</span>
          </button>

          {open && (
            <div className={styles.navMenu} ref={menuRef} role="menu">
              <p className={styles.navMenuHead}>
                Signed in
                <span>{USER.name}</span>
              </p>
              {/* A server action, so signing out clears the httpOnly cookie on
                  the server — a client-side clear could not touch it. */}
              <form action={logout}>
                <button type="submit" className={styles.navMenuItem} role="menuitem">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
