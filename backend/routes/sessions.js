const express = require("express");
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const { checkRole } = require("../middleware/auth");
const prisma = require("../lib/prisma");

const router = express.Router();

router.use(ClerkExpressRequireAuth({}));

// GET /sessions/student (Allowed: Student)
router.get("/student", checkRole(["STUDENT"]), async (req, res) => {
  try {
    const batches = await prisma.batchStudent.findMany({
      where: { studentId: req.dbUser.id },
      select: { batchId: true }
    });
    
    const batchIds = batches.map(b => b.batchId);
    
    const sessions = await prisma.session.findMany({
      where: { batchId: { in: batchIds } },
      include: {
        batch: { select: { name: true } },
        attendances: {
          where: { studentId: req.dbUser.id }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /sessions (Allowed: Trainer)
router.post("/", checkRole(["TRAINER"]), async (req, res) => {
  try {
    const { title, date, startTime, endTime, batchId } = req.body;

    if (!title || !date || !startTime || !endTime || !batchId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify trainer is in this batch
    const isTrainerInBatch = await prisma.batchTrainer.findUnique({
      where: {
        batchId_trainerId: {
          batchId,
          trainerId: req.dbUser.id
        }
      }
    });

    if (!isTrainerInBatch) {
      return res.status(403).json({ error: "Forbidden: You are not a trainer for this batch" });
    }

    const session = await prisma.session.create({
      data: {
        title,
        date: new Date(date),
        startTime: new Date(`${date}T${startTime}`),
        endTime: new Date(`${date}T${endTime}`),
        batchId,
        trainerId: req.dbUser.id
      }
    });

    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /sessions/:id/attendance (Allowed: Trainer)
router.get("/:id/attendance", checkRole(["TRAINER"]), async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        attendances: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                clerkUserId: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Verify trainer owns this session
    if (session.trainerId !== req.dbUser.id) {
      return res.status(403).json({ error: "Forbidden: Not your session" });
    }

    res.json(session.attendances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
