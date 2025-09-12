import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"
import prisma from "@/app/lib/prisma"
import bcrypt from "bcryptjs"

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
				// Teacher login with PIN only (hashed validation)
				if (credentials?.pin && !credentials?.name) {
					const teacher = await prisma.user.findFirst({
						where: { role: "TEACHER" },
						select: { id: true, name: true, role: true, pin: true },
					});
					if (!teacher || !teacher.pin) return null;
					const ok = await bcrypt.compare(credentials.pin, teacher.pin);
					if (!ok) return null;
					return { id: teacher.id, name: teacher.name, role: "teacher" } as any;
				}
				// Admin login with password only
				if (credentials?.password && !credentials?.email && !credentials?.pin) {
					console.log('Admin login attempt with password:', credentials.password);
					const admin = await prisma.user.findFirst({
						where: { role: "ADMIN" },
						select: { id: true, name: true, role: true, password: true },
					});
					console.log('Found admin:', admin ? { id: admin.id, name: admin.name, role: admin.role } : 'No admin found');
					if (!admin || !admin.password) {
						console.log('No admin or no password found');
						return null;
					}
					const ok = await bcrypt.compare(credentials.password, admin.password);
					console.log('Password comparison result:', ok);
					if (!ok) return null;
					return { id: admin.id, name: admin.name, role: "admin" } as any;
				}
				return null;
			}
		})
	],
	callbacks: {
		async jwt({ token, user }: any) {
			if (user) {
				token.id = user.id;
				token.role = (user.role || "").toString().toLowerCase();
			}
			return token;
		},
		async session({ session, token }: any) {
			if (session.user) {
				session.user.id = token.id;
				session.user.role = (token.role || "").toString().toLowerCase();
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