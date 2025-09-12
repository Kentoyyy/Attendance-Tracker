

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) throw new Error("Please define the MONGODB_URI environment variable");

let cached = (global as any).mongoose || { conn: null, promise: null };

let warned = false;
export async function connectToDatabase() {
	if (!warned) {
		warned = true;
		console.warn("connectToDatabase() called but MongoDB is deprecated. Using PostgreSQL/Prisma.");
	}
	return Promise.resolve();
}
export default connectToDatabase;