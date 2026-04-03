const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const loadEnvLocal = () => {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

const main = async () => {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const customers = mongoose.connection.collection("customers");
  const tasks = mongoose.connection.collection("tasks");

  console.log("Creating customer indexes...");
  await customers.createIndex({ mobile: 1 }, { unique: true });
  await customers.createIndex({ isArchived: 1, createdAt: -1 });
  await customers.createIndex({ name: 1 });
  await customers.createIndex({ alternateMobile: 1 });
  await customers.createIndex({ location: 1 });
  await customers.createIndex({ serviceDate: 1 });

  console.log("Creating task indexes...");
  await tasks.createIndex({ customer: 1, createdAt: -1 });
  await tasks.createIndex({ customer: 1, completedDate: -1, createdAt: -1 });
  await tasks.createIndex({ status: 1, completedDate: -1 });
  await tasks.createIndex({ taskType: 1, staff: 1, location: 1 });
  await tasks.createIndex({ taskType: 1, serviceDate: 1 });
  await tasks.createIndex({
    staff: 1,
    status: 1,
    taskType: 1,
    staffHidden: 1,
    createdAt: -1,
  });
  await tasks.createIndex({ location: 1, createdAt: -1 });
  await tasks.createIndex({ status: 1, createdAt: -1 });
  await tasks.createIndex({ completedDate: -1 });
  await tasks.createIndex({ serviceDate: 1 });

  console.log("Indexes created successfully.");
  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
