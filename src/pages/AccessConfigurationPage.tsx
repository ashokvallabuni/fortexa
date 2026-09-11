import { LockKeyhole } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AccessConfigurationPage() {
  const { signOut } = useAuth();
  return <main className="flex min-h-screen items-center justify-center bg-[#eef7fc] px-6 text-[#102a43]"><div className="w-full max-w-md border border-[#c9e1ef] bg-white p-8 shadow-sm"><LockKeyhole className="size-5 text-[#087ea4]" /><p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-[#087ea4]">Access configuration required</p><h1 className="mt-2 text-xl font-semibold">Your workspace is not configured.</h1><p className="mt-3 text-sm leading-6 text-slate-600">Please contact your FORTEXA administrator to receive an organization role and permissions.</p><button onClick={() => void signOut()} className="mt-6 border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:border-[#087ea4]">Sign out</button></div></main>;
}