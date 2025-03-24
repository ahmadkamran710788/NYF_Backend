import express from "express";
import {
  getActivityDetail,
  createActivityDetail,
  updateActivityDetail
} from "../controllers/ActivityDetailController";

const router = express.Router();

router.get("/:activityId", getActivityDetail);
router.post("/:activityId", createActivityDetail);
router.put("/:activityId", updateActivityDetail);

export default router;
