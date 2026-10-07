
require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const Organization = require("../models/Organization");
const OrganizationMember = require("../models/OrganizationMember");
const Asset = require("../models/Asset");
const Ticket = require("../models/Ticket");
const Maintenance = require("../models/Maintenance");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Organization.findOne({ organizationId: "LEGACY-001" });
  let organization = existing;

  if (!organization) {
    const admin = await User.findOne({ role: "admin" });
    organization = await Organization.create({
      name: "Legacy InfraCare Organisation",
      organizationId: "LEGACY-001",
      createdBy: admin?._id
    });
  }

  const users = await User.find();
  for (const user of users) {
    await OrganizationMember.updateOne(
      { organization: organization._id, user: user._id },
      {
        $setOnInsert: {
          organization: organization._id,
          user: user._id,
          role: user.role,
          status: "ACTIVE"
        }
      },
      { upsert: true }
    );
  }

  await Asset.updateMany(
    { organization: { $exists: false } },
    { $set: { organization: organization._id } }
  );

  await Ticket.updateMany(
    { organization: { $exists: false } },
    { $set: { organization: organization._id } }
  );

  await Maintenance.updateMany(
    { organization: { $exists: false } },
    { $set: { organization: organization._id } }
  );

  console.log(`Legacy migration complete. Organisation ID: ${organization.organizationId}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
