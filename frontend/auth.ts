import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// Server-side URL — runs inside Docker container, must use service name.
// NEXT_PUBLIC_API_URL is for the browser (http://localhost:8000) and must NOT
// be used here because localhost inside the container is the frontend itself.
const API_URL = process.env.API_URL || "http://backend:8000";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          return {
            id: data.user_id,
            email: data.email,
            name: data.name ?? data.email,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // `user` is only populated on the initial sign-in, not on JWT refreshes.
      if (user && account) {
        if (account.provider === "credentials") {
          // user.id already is the stable UUID returned by the backend /auth/login
          token.id = user.id;
        } else {
          // OAuth providers (Google, etc.) — upsert the user into our DB so we
          // get a stable UUID that stays consistent across re-logins.
          try {
            const res = await fetch(`${API_URL}/auth/oauth-upsert`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                image: user.image,
                provider: account.provider,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              token.id = data.user_id;
            } else {
              // Degraded fallback: use the provider account ID
              token.id = account.providerAccountId;
            }
          } catch {
            token.id = account.providerAccountId;
          }
        }
      }
      return token;
    },

    session({ session, token }) {
      if (token.id && session.user) {
        (session.user as typeof session.user & { id: string }).id = token.id as string;
      }
      return session;
    },
  },
});
