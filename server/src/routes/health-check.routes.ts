import { Router } from "express";
import { healthCheckController } from "../controller/health-check.controller.ts";



const router = Router()

router.route("/").get(healthCheckController)

export default router