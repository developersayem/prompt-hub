import { Router } from "express";
import { getServerPing, getServerStatus, healthCheckController } from "../controller/health-check.controller";



const router = Router()

router.route("/").get(healthCheckController)
router.route("/server-status").get(getServerStatus)
router.route("/ping").get(getServerPing)


export default router