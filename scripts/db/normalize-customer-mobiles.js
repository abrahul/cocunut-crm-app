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

const normalizeDigits = (value) => {
  if (!value) return "";
  return String(value).replace(/\D/g, "");
};

const main = async () => {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const customers = await mongoose.connection
    .collection("customers")
    .find(
      {},
      {
        projection: {
          _id: 1,
          name: 1,
          mobile: 1,
          alternateMobile: 1,
        },
      }
    )
    .toArray();

  const byNormalized = new Map();
  const updates = [];

  customers.forEach((c) => {
    const normalizedMobile = normalizeDigits(c.mobile);
    const normalizedAlt = normalizeDigits(c.alternateMobile);
    if (normalizedMobile) {
      const list = byNormalized.get(normalizedMobile) || [];
      list.push({ id: c._id, name: c.name, raw: c.mobile });
      byNormalized.set(normalizedMobile, list);
    }

    const needsMobile = c.mobile !== normalizedMobile;
    const needsAlt =
      (c.alternateMobile || "") !== normalizedAlt;
    if (needsMobile || needsAlt) {
      updates.push({
        id: c._id,
        name: c.name,
        mobile: c.mobile,
        alternateMobile: c.alternateMobile,
        normalizedMobile,
        normalizedAlt,
      });
    }
  });

  const collisions = [];
  byNormalized.forEach((list, mobile) => {
    if (list.length > 1) {
      collisions.push({ mobile, list });
    }
  });

  if (collisions.length > 0) {
    console.log(
      `Found ${collisions.length} normalized duplicate mobiles.`
    );
    collisions.forEach((c) => {
      console.log(`- ${c.mobile}: ${c.list.length} records`);
      c.list.forEach((entry, idx) => {
        console.log(
          `  ${idx + 1}. ${entry.name} (${entry.id}) raw="${entry.raw}"`
        );
      });
    });
    console.log(
      "No updates applied. Resolve duplicates first, then rerun."
    );
    await mongoose.disconnect();
    process.exit(2);
  }

  if (updates.length === 0) {
    console.log("All customer mobiles are already normalized.");
    await mongoose.disconnect();
    return;
  }

  const bulk = updates.map((u) => ({
    updateOne: {
      filter: { _id: u.id },
      update: {
        $set: {
          mobile: u.normalizedMobile,
          alternateMobile: u.normalizedAlt || undefined,
        },
      },
    },
  }));

  const result = await mongoose.connection
    .collection("customers")
    .bulkWrite(bulk);

  console.log(`Normalized ${result.modifiedCount} customer records.`);
  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
