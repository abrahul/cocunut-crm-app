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

const pickNewest = (records) => {
  return records
    .slice()
    .sort((a, b) => {
      const aTime = a.updatedAt || a.createdAt || a._id;
      const bTime = b.updatedAt || b.createdAt || b._id;
      return aTime > bTime ? -1 : aTime < bTime ? 1 : 0;
    })[0];
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
          createdAt: 1,
          updatedAt: 1,
        },
      }
    )
    .toArray();

  const groups = new Map();
  customers.forEach((c) => {
    const normalized = normalizeDigits(c.mobile);
    if (!normalized) return;
    const list = groups.get(normalized) || [];
    list.push(c);
    groups.set(normalized, list);
  });

  const duplicates = [];
  groups.forEach((list, mobile) => {
    if (list.length > 1) duplicates.push({ mobile, list });
  });

  if (!duplicates.length) {
    console.log("No duplicate mobiles to merge.");
    await mongoose.disconnect();
    return;
  }

  let totalTasksReassigned = 0;
  let totalCustomersDeleted = 0;

  for (const group of duplicates) {
    const keep = pickNewest(group.list);
    const remove = group.list.filter((c) => String(c._id) !== String(keep._id));
    const removeIds = remove.map((c) => c._id);

    if (!removeIds.length) continue;

    const taskUpdate = await mongoose.connection
      .collection("tasks")
      .updateMany(
        { customer: { $in: removeIds } },
        { $set: { customer: keep._id } }
      );

    const deleteResult = await mongoose.connection
      .collection("customers")
      .deleteMany({ _id: { $in: removeIds } });

    totalTasksReassigned += taskUpdate.modifiedCount || 0;
    totalCustomersDeleted += deleteResult.deletedCount || 0;

    console.log(
      `Merged mobile ${group.mobile}: kept ${keep.name} (${keep._id}), removed ${removeIds.length}`
    );
  }

  console.log(
    `Done. Reassigned ${totalTasksReassigned} tasks, deleted ${totalCustomersDeleted} customers.`
  );

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
