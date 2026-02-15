const express = require("express");
const router = express.Router();
const admin = require("../controllers/admin.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/auth.middleware");

router.post("/po", verifyToken, requireRole("admin"), admin.createPO);
router.post("/po/bulk", verifyToken, requireRole("admin"), admin.createPOBulk);
router.post("/course", verifyToken, requireRole("admin"), admin.createCourse);
router.post("/co", verifyToken, requireRole("admin"), admin.createCO);
router.post("/co/bulk", verifyToken, requireRole("admin"), admin.createCOBulk);
router.post("/map", verifyToken, requireRole("admin"), admin.mapCOPo);
router.post("/map/bulk", verifyToken, requireRole("admin"), admin.mapCOPoBulk);
router.post(
  "/assign-teacher",
  verifyToken,
  requireRole("admin"),
  admin.assignTeacherToCourse,
);
router.get("/courses", verifyToken, requireRole("admin"), admin.listCourses);
router.get("/users", verifyToken, requireRole("admin"), admin.listUsers);

// PO Routes
router.get("/po", verifyToken, requireRole("admin"), admin.listPOs);

// CO Routes
router.get("/co/:courseId", verifyToken, requireRole("admin"), admin.listCOs);

router.get("/mappings", verifyToken, requireRole("admin"), admin.listMappings);
router.get(
  "/exam-co/:examId",
  verifyToken,
  requireRole("admin"),
  admin.getExamCOAttainment,
);
router.get(
  "/course-attainment/:courseId",
  verifyToken,
  requireRole("admin"),
  admin.getCourseAttainment,
);
router.post(
  "/course-attainment/:courseId/compute-overall",
  verifyToken,
  requireRole("admin"),
  admin.computeCourseOverall,
);

router.post(
  "/generate-mapping",
  verifyToken,
  requireRole("admin"),
  admin.generateAIMapping,
);

module.exports = router;
