const prisma = require("../lib/prisma");

/**
 * Middleware to check if the authenticated Clerk user has the required roles.
 * Must be used AFTER ClerkExpressRequireAuth.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route.
 */
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // req.auth comes from ClerkExpressRequireAuth
      if (!req.auth || !req.auth.userId) {
        console.warn("🔒 Auth failed: Missing userId in request");
        return res.status(401).json({ error: "Unauthorized: Missing authentication" });
      }

      const clerkUserId = req.auth.userId;

      // Look up the user in our database using clerkUserId
      const user = await prisma.user.findUnique({
        where: { clerkUserId },
      });

      if (!user) {
        console.warn(`👤 User not found in DB: ${clerkUserId}. They likely need to complete onboarding.`);
        return res.status(403).json({ 
          error: "Forbidden: User not found in database",
          code: "USER_NOT_ONBOARDED",
          clerkUserId 
        });
      }

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(user.role)) {
        console.warn(`🚫 Permission denied: User ${clerkUserId} has role ${user.role}, but route requires one of: ${allowedRoles.join(", ")}`);
        return res.status(403).json({ 
          error: `Forbidden: Role ${user.role} is not authorized for this action` 
        });
      }

      // Attach the DB user to the request for downstream use
      req.dbUser = user;
      next();
    } catch (error) {
      console.error("🔥 RBAC Middleware Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};

module.exports = { checkRole };
