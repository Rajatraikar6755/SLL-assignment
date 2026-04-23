const express = require("express");
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const { checkRole } = require("../middleware/auth");
const crypto = require("crypto");
const prisma = require("../lib/prisma");

const router = express.Router();

router.use(ClerkExpressRequireAuth({}));

// GET /batches/trainer (Allowed: Trainer)
router.get("/trainer", checkRole(["TRAINER"]), async (req, res) => {
  try {
    const batches = await prisma.batchTrainer.findMany({
      where: { trainerId: req.dbUser.id },
      include: {
        batch: {
          include: {
            sessions: true
          }
        }
      }
    });
    res.json(batches.map(b => b.batch));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /batches (Allowed: Trainer, Institution)
router.post("/", checkRole(["TRAINER", "INSTITUTION"]), async (req, res) => {
  try {
    const { name, institutionId } = req.body;
    let actualInstitutionId = institutionId;
    
    if (req.dbUser.role === "INSTITUTION") {
      actualInstitutionId = req.dbUser.id;
    } else if (!actualInstitutionId) {
      actualInstitutionId = "general-institution";
    }

    if (!name || !actualInstitutionId) {
      return res.status(400).json({ error: "Batch name is required" });
    }

    const batch = await prisma.batch.create({
      data: {
        name,
        institutionId: actualInstitutionId,
      }
    });

    if (req.dbUser.role === "TRAINER") {
      await prisma.batchTrainer.create({
        data: {
          batchId: batch.id,
          trainerId: req.dbUser.id
        }
      });
    }

    res.status(201).json(batch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /batches/:id/invite (Allowed: Trainer)
router.post("/:id/invite", checkRole(["TRAINER"]), async (req, res) => {
  try {
    const { id } = req.params;
    
    const isTrainerInBatch = await prisma.batchTrainer.findUnique({
      where: {
        batchId_trainerId: {
          batchId: id,
          trainerId: req.dbUser.id
        }
      }
    });

    if (!isTrainerInBatch) {
      return res.status(403).json({ error: "Forbidden: You are not a trainer for this batch" });
    }

    const inviteCode = crypto.randomBytes(6).toString("hex");

    const batch = await prisma.batch.update({
      where: { id },
      data: { inviteCode }
    });

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${inviteCode}`;

    res.json({ inviteCode, inviteLink });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /batches/join (Allowed: Student)
router.post("/join", checkRole(["STUDENT"]), async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const batch = await prisma.batch.findUnique({
      where: { inviteCode }
    });

    if (!batch) {
      return res.status(404).json({ error: "Invalid invite code or batch not found" });
    }

    await prisma.batchStudent.create({
      data: {
        batchId: batch.id,
        studentId: req.dbUser.id
      }
    });

    res.json({ message: "Successfully joined the batch" });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "You are already in this batch" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
