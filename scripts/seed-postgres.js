// Seed initial data into PostgreSQL via Prisma
/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
	const grade2 = await prisma.grade.upsert({
		where: { name: "Grade 2" },
		update: {},
		create: { name: "Grade 2", levelNumber: 2 },
	});

	await prisma.section.upsert({
		where: { gradeId_name: { gradeId: grade2.id, name: "Section A" } },
		update: {},
		create: { name: "Section A", gradeId: grade2.id },
	});

	const grade3 = await prisma.grade.upsert({
		where: { name: "Grade 3" },
		update: {},
		create: { name: "Grade 3", levelNumber: 3 },
	});

	await prisma.section.upsert({
		where: { gradeId_name: { gradeId: grade3.id, name: "Section A" } },
		update: {},
		create: { name: "Section A", gradeId: grade3.id },
	});

	console.log("Seed complete: Grades and Sections added.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
