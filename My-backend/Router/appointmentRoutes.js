const express = require("express");
const router = express.Router();
const appointmentController = require("../Controller/appointmentController");

router.post("/", appointmentController.bookAppointment);
router.get("/user/:email", appointmentController.getUserAppointments);
router.get("/userbyname/:doctorName", appointmentController.getDoctorAppointmentsByName);
router.put("/:id/update",appointmentController.updateAppointmentStatusAndPrescription);
router.get("/getprescriptionlist",appointmentController.getPrescriptionList);

router.put('/:id/prescription-status', appointmentController.updatePrescriptionStatus);

router.post("/:id/report", appointmentController.uploadReport);
router.get("/:id/report", appointmentController.getReport);

router.delete("/:id", appointmentController.deleteAppointment);

module.exports = router;
