import { Router } from "express";
import { getDeploymentStats, getServerPing, getServerStatus, healthCheckController } from "../controller/health-check.controller";



const router = Router()

router.route("/").get(healthCheckController)
router.route("/server-status").get(getServerStatus)
router.route("/ping-me").get(getServerPing)
router.route("/test").get(getDeploymentStats)



export default router