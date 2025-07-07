import { Router } from "express";
import { getServerStatus, healthCheckController } from "../controller/health-check.controller";



const router = Router()

router.route("/").get(healthCheckController)
router.route("/server-status").get(getServerStatus)

export default router