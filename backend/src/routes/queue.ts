
import { Router } from "express";
import { prisma } from "../db.js";
import {
  authenticateToken,
  type AuthRequest,
} from "../middleware/auth.js";

const router = Router();

// POST /api/queue — Create a queue token
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
          message: "Only students can join the queue.",
        });
      }

      const { department } = req.body ?? {};

      if (
        typeof department !== "string" ||
        !department.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "A department is required.",
        });
      }

      const normalizedDepartment = department.trim();

      const existingToken = await prisma.queueToken.findFirst({
        where: {
          studentId: req.user.id,
          status: "WAITING",
        },
      });

      if (existingToken) {
        return res.status(409).json({
          success: false,
          message: "You already have a waiting queue token.",
          token: existingToken,
        });
      }

      const latestToken = await prisma.queueToken.findFirst({
        where: { department: normalizedDepartment },
        orderBy: { tokenNumber: "desc" },
        select: { tokenNumber: true },
      });

      const nextTokenNumber =
        (latestToken?.tokenNumber ?? 0) + 1;

      const token = await prisma.queueToken.create({
        data: {
          tokenNumber: nextTokenNumber,
          department: normalizedDepartment,
          studentId: req.user.id,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Queue token created successfully.",
        token,
      });
    } catch (error) {
      console.error("Queue token creation failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to create a queue token.",
      });
    }
  }
);

// GET /api/queue/my — View your own queue tokens
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

      const tokens = await prisma.queueToken.findMany({
        where: { studentId: req.user.id },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        success: true,
        count: tokens.length,
        tokens,
      });
    } catch (error) {
      console.error("Fetching queue tokens failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch queue tokens.",
      });
    }
  }
);

// GET /api/queue/department/:department — Staff queue overview
router.get(
  "/department/:department",
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
          message: "Only staff can view the department queue.",
        });
      }

      const departmentParam = req.params.department;
      const department = Array.isArray(departmentParam)
        ? departmentParam[0]
        : departmentParam;

      if (!department) {
        return res.status(400).json({
          success: false,
          message: "A department is required.",
        });
      }

      const tokens = await prisma.queueToken.findMany({
        where: {
          department,
          status: {
            in: ["WAITING", "IN_CONSULTATION"],
          },
        },
        orderBy: { createdAt: "asc" },
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
        department,
        count: tokens.length,
        tokens,
      });
    } catch (error) {
      console.error("Fetching department queue failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch the department queue.",
      });
    }
  }
);

// PATCH /api/queue/:id/status — Staff updates token status
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
          message: "Only staff can update queue status.",
        });
      }

      const idParam = req.params.id;
      const tokenId = Array.isArray(idParam)
        ? idParam[0]
        : idParam;

      if (!tokenId) {
        return res.status(400).json({
          success: false,
          message: "A valid queue token ID is required.",
        });
      }

      const { status } = req.body ?? {};

      const allowedStatuses = [
        "IN_CONSULTATION",
        "COMPLETED",
        "CANCELLED",
      ] as const;

      if (
        typeof status !== "string" ||
        !allowedStatuses.includes(
          status as (typeof allowedStatuses)[number]
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid queue status.",
        });
      }

      const existingToken = await prisma.queueToken.findUnique({
        where: { id: tokenId },
      });

      if (!existingToken) {
        return res.status(404).json({
          success: false,
          message: "Queue token not found.",
        });
      }

      const validTransition =
        (existingToken.status === "WAITING" &&
          (status === "IN_CONSULTATION" ||
            status === "CANCELLED")) ||
        (existingToken.status === "IN_CONSULTATION" &&
          (status === "COMPLETED" ||
            status === "CANCELLED"));

      if (!validTransition) {
        return res.status(409).json({
          success: false,
          message: `Cannot change status from ${existingToken.status} to ${status}.`,
        });
      }

      const updatedToken = await prisma.queueToken.update({
        where: { id: existingToken.id },
        data: { status },
      });

      return res.status(200).json({
        success: true,
        message: "Queue status updated successfully.",
        token: updatedToken,
      });
    } catch (error) {
      console.error("Queue status update failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to update queue status.",
      });
    }
  }
);

export default router;
