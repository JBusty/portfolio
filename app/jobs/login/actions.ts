'use server';

import { redirect } from 'next/navigation';
import { checkPassword, createSession, destroySession } from '@/lib/jobwatch/session';

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');

  if (!checkPassword(password)) {
    // Deliberately says nothing about which part was wrong, and nothing about
    // whether a password is even configured.
    return { error: 'Incorrect password.' };
  }

  await createSession();
  redirect('/jobs');
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect('/jobs/login');
}
