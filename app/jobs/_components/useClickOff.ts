'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Closes an open panel when the next press lands outside it.
 *
 * Listens on `pointerdown` rather than `click`: a click only fires after the
 * button comes back up, which is late enough that the press can also land on
 * whatever is underneath. Closing on the way down keeps the two gestures from
 * being read as one.
 *
 * The trigger is excluded deliberately. Without that, pressing the open button
 * again would close the panel here and immediately reopen it in the button's
 * own handler, and the panel would look stuck open.
 *
 * `onClose` is held in a ref so callers don't have to memoize it to keep the
 * listener from being torn down and rebound on every render.
 */
export function useClickOff(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
) {
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;

    const isOutside = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;
      // A node already detached from the document — a chip removed by the very
      // click being handled — is not "outside", it just no longer exists.
      if (!target.isConnected) return false;
      return !panelRef.current?.contains(target) && !triggerRef.current?.contains(target);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (isOutside(event.target)) close.current();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, panelRef, triggerRef]);
}
