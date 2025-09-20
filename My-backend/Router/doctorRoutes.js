const express = require("express");
const router = express.Router();
const doctorController = require("../Controller/doctorController");

router.get("/", doctorController.getAllDoctors);

module.exports = router;
