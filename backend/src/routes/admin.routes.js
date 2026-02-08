const express = require("express");
const router = express.Router();
const admin = require("../controllers/admin.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/auth.middleware");

router.post("/po", verifyToken, requireRole("admin"), admin.createPO);
router.post("/course", verifyToken, requireRole("admin"), admin.createCourse);
router.post("/co", verifyToken, requireRole("admin"), admin.createCO);
router.post("/map", verifyToken, requireRole("admin"), admin.mapCOPo);
router.post("/assign-teacher", verifyToken, requireRole("admin"), admin.assignTeacherToCourse);
router.get("/courses", verifyToken, requireRole("admin"), admin.listCourses);
router.get("/mappings", verifyToken, requireRole("admin"), admin.listMappings);

module.exports = router;
