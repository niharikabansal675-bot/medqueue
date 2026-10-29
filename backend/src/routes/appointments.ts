
import { Router } from "express";
import { prisma } from "../db.js";
import {
  authenticateToken,
  type AuthRequest,
} from "../middleware/auth.js";

const router = Router();

// POST /api/appointments — Book an appointment
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
          message: "Only students can book appointments.",
        });
      }

      const { department, date } = req.body ?? {};

      if (
        typeof department !== "string" ||
        !department.trim() ||
        typeof date !== "string" ||
        !date.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Department and appointment date are required.",
        });
      }

      const appointmentDate = new Date(date);

      if (Number.isNaN(appointmentDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid appointment date.",
        });
      }

      if (appointmentDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Appointment must be scheduled in the future.",
        });
      }

      const appointment = await prisma.appointment.create({
        data: {
          department: department.trim(),
          date: appointmentDate,
          studentId: req.user.id,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Appointment booked successfully.",
        appointment,
      });
    } catch (error) {
      console.error("Appointment booking failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to book the appointment.",
      });
    }
  }
);

/* GET /api/appointments/my — View your appointments */
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

      const appointments = await prisma.appointment.findMany({
        where: {
          studentId: req.user.id,
        },
        orderBy: {
          date: "asc",
        },
      });

      return res.status(200).json({
        success: true,
        count: appointments.length,
        appointments,
      });
    } catch (error) {
      console.error("Fetching appointments failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch appointments.",
      });
    }
  }
);

/* PATCH /api/appointments/:id/cancel — Cancel your appointment */
router.patch(
  "/:id/cancel",
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
          message: "Only students can cancel their appointments.",
        });
      }

      const idParam = req.params.id;
      const appointmentId = Array.isArray(idParam)
        ? idParam[0]
        : idParam;

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: "A valid appointment ID is required.",
        });
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment || appointment.studentId !== req.user.id) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      if (
        appointment.status === "CANCELLED" ||
        appointment.status === "COMPLETED"
      ) {
        return res.status(409).json({
          success: false,
          message: "This appointment cannot be cancelled.",
        });
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "CANCELLED" },
      });

      return res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully.",
        appointment: updatedAppointment,
      });
    } catch (error) {
      console.error("Appointment cancellation failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to cancel the appointment.",
      });
    }
  }
);

/* GET /api/appointments — Staff: View all appointments */
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
          message: "Only staff can view all appointments.",
        });
      }

      const appointments = await prisma.appointment.findMany({
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      return res.status(200).json({
        success: true,
        count: appointments.length,
        appointments,
      });
    } catch (error) {
      console.error("Fetching all appointments failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch appointments.",
      });
    }
  }
);

/* PATCH /api/appointments/:id/status — Staff: Update appointment status */
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
          message: "Only staff can update appointment status.",
        });
      }

      const idParam = req.params.id;
      const appointmentId = Array.isArray(idParam)
        ? idParam[0]
        : idParam;

      const { status } = req.body ?? {};
      const allowedStatuses = [
        "BOOKED",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
      ];

      if (
        !appointmentId ||
        typeof status !== "string" ||
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid appointment ID and status are required.",
        });
      }

      const existing = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: status as
          | "BOOKED"
          | "CONFIRMED"
          | "COMPLETED"
          | "CANCELLED" },
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
        message: "Appointment status updated successfully.",
        appointment,
      });
    } catch (error) {
      console.error("Updating appointment status failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update appointment status.",
      });
    }
  }
);


export default router;
