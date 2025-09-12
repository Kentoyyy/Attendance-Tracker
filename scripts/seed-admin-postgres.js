/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
	const name = process.env.ADMIN_NAME || "Admin";
	const email = process.env.ADMIN_EMAIL || "admin@example.com";
	const password = process.env.ADMIN_PASSWORD || "admin123";
	const hashed = await bcrypt.hash(password, 10);

	const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
	if (existing) {
		console.log("Admin already exists:", existing.email || existing.name);
		return;
	}

	const admin = await prisma.user.create({
		data: { name, email, password: hashed, role: "ADMIN" },
	});
	console.log("Admin created:", admin);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
