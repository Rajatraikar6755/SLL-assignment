const express = require("express");
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const { checkRole } = require("../middleware/auth");
const prisma = require("../lib/prisma");

const router = express.Router();

router.use(ClerkExpressRequireAuth({}));

// Helper function to calculate attendance summary from a list of batches
const calculateSummaryFromBatches = (batches) => {
  let totalSessions = 0;
  let totalAttendances = 0;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let totalStudents = 0;

  for (const batch of batches) {
    totalStudents += batch.students.length;
    totalSessions += batch.sessions.length;
    for (const session of batch.sessions) {
      totalAttendances += session.attendances.length;
      for (const att of session.attendances) {
        if (att.status === 'PRESENT') presentCount++;
        if (att.status === 'ABSENT') absentCount++;
        if (att.status === 'LATE') lateCount++;
      }
    }
  }

  const attendanceRate = totalAttendances > 0 
    ? ((presentCount + lateCount) / totalAttendances) * 100 
    : 0;

  return {
    totalBatches: batches.length,
    totalStudents,
    totalSessions,
    totalAttendances,
    presentCount,
    absentCount,
    lateCount,
    attendanceRate: attendanceRate.toFixed(2) + '%'
  };
};

// GET /batches/:id/summary (Allowed: Institution)
router.get("/batches/:id/summary", checkRole(["INSTITUTION", "PROGRAMME_MANAGER", "ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        students: true,
        sessions: {
          include: {
            attendances: true
          }
        }
      }
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Verify institution owns this batch
    if (req.dbUser.role === "INSTITUTION" && batch.institutionId !== req.dbUser.institutionId && batch.institutionId !== req.dbUser.id) {
      return res.status(403).json({ error: "Forbidden: Not your batch" });
    }

    const summary = calculateSummaryFromBatches([batch]);
    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /institutions/:id/summary (Allowed: Programme Manager, Institution)
router.get("/institutions/:id/summary", checkRole(["PROGRAMME_MANAGER", "ADMIN", "INSTITUTION"]), async (req, res) => {
  try {
    let { id } = req.params;

    if (id.startsWith('user_')) {
      const userRecord = await prisma.user.findUnique({ where: { clerkUserId: id } });
      if (userRecord) id = userRecord.id;
    }

    if (req.dbUser.role === "INSTITUTION" && req.dbUser.id !== id) {
      return res.status(403).json({ error: "Forbidden: Not your institution" });
    }

    const batches = await prisma.batch.findMany({
      where: { institutionId: id },
      include: {
        students: true,
        sessions: { include: { attendances: true } }
      }
    });

    const overallSummary = calculateSummaryFromBatches(batches);
    const batchBreakdown = batches.map(b => ({
      id: b.id,
      name: b.name,
      ...calculateSummaryFromBatches([b])
    }));

    res.json({ ...overallSummary, batches: batchBreakdown });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /programme/summary (Allowed: Programme Manager, Monitoring Officer)
router.get("/programme/summary", checkRole(["PROGRAMME_MANAGER", "MONITORING_OFFICER", "ADMIN"]), async (req, res) => {
  try {
    const institutions = await prisma.user.findMany({
      where: { role: 'INSTITUTION' }
    });

    const batches = await prisma.batch.findMany({
      include: {
        students: true,
        sessions: { include: { attendances: true } }
      }
    });

    const overallSummary = calculateSummaryFromBatches(batches);
    
    const institutionBreakdown = institutions.map(inst => {
      const instBatches = batches.filter(b => b.institutionId === inst.id);
      return {
        id: inst.id,
        name: inst.name,
        ...calculateSummaryFromBatches(instBatches)
      };
    });

    res.json({ ...overallSummary, institutions: institutionBreakdown });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
