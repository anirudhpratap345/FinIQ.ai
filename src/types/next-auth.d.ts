// Minimal declarations to satisfy TypeScript when `next-auth` types aren't installed.
// This prevents "Cannot find module 'next-auth/react'" errors during type-checking.

declare module "next-auth" {
  export type Session = any;
}

declare module "next-auth/react" {
  import { Session } from "next-auth";
  export function useSession(): { data: Session | null; status: "loading" | "authenticated" | "unauthenticated" };
  export function signIn(provider?: string, options?: any): Promise<void>;
  export function signOut(options?: any): Promise<void>;
  export default {};
}
