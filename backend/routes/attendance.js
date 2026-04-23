const express = require("express");
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const { checkRole } = require("../middleware/auth");
const prisma = require("../lib/prisma");

const router = express.Router();

router.use(ClerkExpressRequireAuth({}));

// POST /attendance/mark (Allowed: Student)
router.post("/mark", checkRole(["STUDENT"]), async (req, res) => {
  try {
    const { sessionId, status } = req.body;

    if (!sessionId || !status) {
      return res.status(400).json({ error: "Missing sessionId or status" });
    }

    if (!['PRESENT', 'ABSENT', 'LATE'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        batch: {
          include: {
            students: {
              where: {
                studentId: req.dbUser.id
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Verify student is part of the batch for this session
    if (session.batch.students.length === 0) {
      return res.status(403).json({ error: "Forbidden: You are not enrolled in this batch" });
    }

    // Upsert attendance (in case they change it within a specific window, or just create)
    const attendance = await prisma.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: req.dbUser.id
        }
      },
      update: {
        status,
        markedAt: new Date()
      },
      create: {
        sessionId,
        studentId: req.dbUser.id,
        status,
        markedAt: new Date()
      }
    });

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /sessions/:id/attendance (Allowed: Trainer)
router.get("/sessions/:id/attendance", checkRole(["TRAINER"]), async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        batch: {
          include: {
            trainers: true
          }
        },
        attendances: {
          include: {
            student: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Verify trainer is part of the batch for this session
    const isTrainer = session.batch.trainers.some(t => t.trainerId === req.dbUser.id);
    if (!isTrainer) {
      return res.status(403).json({ error: "Forbidden: You are not the trainer for this batch" });
    }

    res.json(session.attendances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
