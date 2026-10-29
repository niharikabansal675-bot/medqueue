
import { Router } from "express";
import { prisma } from "../db.js";
import {
  authenticateToken,
  type AuthRequest,
} from "../middleware/auth.js";

const router = Router();

// POST /api/sos — Create an SOS alert
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      if (req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can create SOS alerts.",
        });
      }

      const { note } = req.body ?? {};

      if (
        note !== undefined &&
        note !== null &&
        (typeof note !== "string" || note.trim().length > 500)
      ) {
        return res.status(400).json({
          success: false,
          message: "The SOS note must be 500 characters or fewer.",
        });
      }

      const alert = await prisma.sosAlert.create({
        data: {
          studentId: req.user.id,
          note:
            typeof note === "string" && note.trim()
              ? note.trim()
              : null,
        },
      });

      return res.status(201).json({
        success: true,
        message: "SOS alert created successfully.",
        alert,
      });
    } catch (error) {
      console.error("SOS alert creation failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to create the SOS alert.",
      });
    }
  }
);

/* GET /api/sos/my — View the student's own SOS alerts */
router.get(
  "/my",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      const alerts = await prisma.sosAlert.findMany({
        where: {
          studentId: req.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json({
        success: true,
        count: alerts.length,
        alerts,
      });
    } catch (error) {
      console.error("Fetching SOS alerts failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch SOS alerts.",
      });
    }
  }
);

/* GET /api/sos — Staff view all SOS alerts */
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      if (req.user.role !== "STAFF") {
        return res.status(403).json({
          success: false,
          message: "Only staff can view all SOS alerts.",
        });
      }

      const alerts = await prisma.sosAlert.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        count: alerts.length,
        alerts,
      });
    } catch (error) {
      console.error("Fetching all SOS alerts failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch SOS alerts.",
      });
    }
  }
);

/* PATCH /api/sos/:id/status — Staff acknowledges or resolves an alert */
router.patch(
  "/:id/status",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      if (req.user.role !== "STAFF") {
        return res.status(403).json({
          success: false,
          message: "Only staff can update SOS alert status.",
        });
      }

      const idParam = req.params.id;
      const alertId = Array.isArray(idParam)
        ? idParam[0]
        : idParam;

      if (!alertId) {
        return res.status(400).json({
          success: false,
          message: "A valid SOS alert ID is required.",
        });
      }

      const { status } = req.body ?? {};

      if (
        status !== "ACKNOWLEDGED" &&
        status !== "RESOLVED"
      ) {
        return res.status(400).json({
          success: false,
          message: "Status must be ACKNOWLEDGED or RESOLVED.",
        });
      }

      const existingAlert = await prisma.sosAlert.findUnique({
        where: { id: alertId },
      });

      if (!existingAlert) {
        return res.status(404).json({
          success: false,
          message: "SOS alert not found.",
        });
      }

      const validTransition =
        (existingAlert.status === "PENDING" &&
          status === "ACKNOWLEDGED") ||
        (existingAlert.status === "ACKNOWLEDGED" &&
          status === "RESOLVED");

      if (!validTransition) {
        return res.status(409).json({
          success: false,
          message: `Cannot change status from ${existingAlert.status} to ${status}.`,
        });
      }

      const updatedAlert = await prisma.sosAlert.update({
        where: { id: alertId },
        data: { status },
      });

      return res.status(200).json({
        success: true,
        message: "SOS alert status updated successfully.",
        alert: updatedAlert,
      });
    } catch (error) {
      console.error("Updating SOS alert failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update SOS alert status.",
      });
    }
  }
);

export default router;