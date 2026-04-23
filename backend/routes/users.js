const express = require("express");
const { ClerkExpressRequireAuth, createClerkClient } = require("@clerk/clerk-sdk-node");
const prisma = require("../lib/prisma");

const router = express.Router();

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

router.use(ClerkExpressRequireAuth({}));

router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { clerkUserId, name, role } = req.body;
    
    if (req.auth.userId !== clerkUserId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!['STUDENT', 'TRAINER', 'INSTITUTION', 'PROGRAMME_MANAGER', 'MONITORING_OFFICER'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await prisma.user.upsert({
      where: { clerkUserId },
      update: { role, name },
      create: {
        clerkUserId,
        name,
        role
      }
    });

    await clerkClient.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        role: role
      }
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
