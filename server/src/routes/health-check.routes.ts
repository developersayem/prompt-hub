import { Router } from "express";
import { healthCheckController } from "../controller/health-check.controller";



const router = Router()

router.route("/").get(healthCheckController)
router.route("/server-details").get(healthCheckController)

export default router