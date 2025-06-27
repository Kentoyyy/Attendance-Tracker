import CredentialsProvider from "next-auth/providers/credentials"
import { connectToDatabase } from "@/app/lib/mongodb"
import User from "@/app/models/User"
import bcrypt from "bcryptjs"
import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: {  label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        // Teacher login with PIN only
        if (credentials?.pin && !credentials?.name) {
          await connectToDatabase();
          const allTeachers = await User.find({ role: 'teacher' }).select('+pin +name');
          let matchedUser = null;
          for (const teacher of allTeachers) {
            if (typeof teacher.pin === 'string' && await bcrypt.compare(credentials.pin, teacher.pin)) {
              matchedUser = teacher;
              break;
            }
          }
          if (!matchedUser) {
            return null;
          }
          return {
            id: typeof matchedUser._id === 'object' && matchedUser._id !== null && 'toString' in matchedUser._id
              ? matchedUser._id.toString()
              : String(matchedUser._id),
            name: matchedUser.name,
            role: matchedUser.role,
          };
        }
        // Admin login with password only
        if (credentials?.password && !credentials?.email) {
          await connectToDatabase();
          const allAdmins = await User.find({ role: 'admin' }).select('+password +name');
          let matchedAdmin = null;
          for (const admin of allAdmins) {
            if (typeof admin.password === 'string' && await bcrypt.compare(credentials.password, admin.password)) {
              matchedAdmin = admin;
              break;
            }
          }
          if (!matchedAdmin) {
            return null;
          }
          return {
            id: typeof matchedAdmin._id === 'object' && matchedAdmin._id !== null && 'toString' in matchedAdmin._id
              ? matchedAdmin._id.toString()
              : String(matchedAdmin._id),
            name: matchedAdmin.name,
            role: matchedAdmin.role,
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 