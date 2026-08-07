'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import type { AccountState, SaveStatus } from './useAccountState';
import styles from '../jobwatch.module.css';

/**
 * The tool's own chrome.
 *
 * Jobwatch renders without the portfolio's TopBar, which left the page with no
 * identity above the fold and no way out of a session. This is both: a type
 * logo on the left, and on the right whatever the account situation is.
 *
 * The logo is set in type rather than drawn. The tool has no mark and does not
 * need one — the word with the accent stop is already how it signs itself in
 * the hero, and repeating it small is what makes chrome read as chrome.
 *
 * The right-hand side used to be a hardcoded name and a sign-out button, on the
 * reasonable grounds that there was exactly one person. It is now three states,
 * and the anonymous one is the interesting one: it has to say what is being
 * lost without nagging, because browsing without an account is a supported way
 * to use this and not a mistake to correct.
 */

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
  /** Reported only while signed in; there is nothing to save otherwise. */
  saveStatus?: SaveStatus;
  /**
   * What the server said about this session, which is not the same question as
   * whether Clerk has one. The gap between them is a real state rather than a
   * hypothetical: an account whose email is still unconfirmed is signed in and
   * stores nothing, because a verified address is what lets `resolveUser` claim
   * rows. Chrome reading only Clerk would show an avatar over a session quietly
   * saving nowhere.
   *
   * Four values, and the reason is `loading`: see `AccountState`.
   */
  account?: AccountState;
};

/**
 * Only failure gets a word.
 *
 * A "saved" tick that appears on every keystroke is a tell that the app is
 * anxious about its own persistence, and it trains you to ignore the one
 * message that matters. Saving is silent because it works; this is here for
 * when it does not.
 */
const SAVE_LABEL: Partial<Record<SaveStatus, string>> = {
  error: 'Not saved — reconnecting',
};

export default function JobwatchNav({
  ref, stuck = false, saveStatus = 'idle', account = 'loading',
}: Props) {
  const { isLoaded, isSignedIn } = useUser();

  /**
   * The only combination that means "confirm your email": Clerk has a session,
   * the server has answered, and its answer was that nobody is signed in.
   *
   * Both halves have to have finished speaking. Testing `!persisting` instead
   * matched three states rather than one — still loading, offline, and actually
   * unverified — so the warning fired on every page load and again whenever the
   * network hiccuped, and told the user to go and re-verify an address that was
   * fine. Narrow it to the case it describes and it becomes worth reading.
   */
  const unverified = isLoaded && isSignedIn && account === 'anonymous';

  const note = unverified
    ? 'Confirm your email to start saving'
    : account === 'offline'
      ? SAVE_LABEL.error
      : SAVE_LABEL[saveStatus];

  return (
    <nav className={styles.nav} aria-label="Jobwatch" ref={ref} data-stuck={stuck}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <span className={styles.navLogo}>
          Jobwatch<span className={styles.navLogoStop}>.</span>
        </span>

        <div className={styles.navAccount}>
          {note && (
            <span className={styles.navNote} role="status" aria-live="polite">
              {note}
            </span>
          )}

          {/* Nothing until Clerk has answered. The two states render different
              controls at different widths, so guessing and correcting would
              shift the whole bar under the pointer a beat after paint. */}
          {isLoaded && (isSignedIn ? (
            // Clerk's own control: avatar, account management and sign-out,
            // with the session handling that goes with them. Rebuilding that
            // menu in the house style would be a lot of surface to own for a
            // component that is already correct — so the menu is theirs and
            // only the trigger is dressed to match the bar. See `.navUser`.
            <span className={styles.navUser}>
              <UserButton
                showName
                appearance={{ elements: { avatarBox: { width: 26, height: 26 } } }}
              />
            </span>
          ) : (
            <>
              {/* Says what an account is for rather than demanding one. The
                  board behind this works signed out, so a wall here would be a
                  lie about the product as much as a nuisance. */}
              <span className={styles.navAnon}>Not saving</span>
              <Link href="/jobs/sign-in" className={styles.navLink}>Sign in</Link>
              <Link href="/jobs/sign-up" className={styles.navCta}>Create account</Link>
            </>
          ))}
        </div>
      </div>
    </nav>
  );
}
