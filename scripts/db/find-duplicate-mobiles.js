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
  const results = await mongoose.connection
    .collection("customers")
    .aggregate([
      {
        $group: {
          _id: "$mobile",
          count: { $sum: 1 },
          ids: { $push: "$_id" },
          names: { $push: "$name" },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ])
    .toArray();

  if (!results.length) {
    console.log("No duplicate mobile numbers found.");
  } else {
    console.log(`Found ${results.length} duplicate mobile numbers:`);
    results.forEach((row) => {
      console.log(
        `- ${row._id || "(empty)"}: ${row.count} records`
      );
      row.names.forEach((name, idx) => {
        console.log(`  ${idx + 1}. ${name} (${row.ids[idx]})`);
      });
    });
  }

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
