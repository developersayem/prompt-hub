"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_check_controller_1 = require("../controller/health-check.controller");
const router = (0, express_1.Router)();
router.route("/").get(health_check_controller_1.healthCheckController);
router.route("/server-status").get(health_check_controller_1.getServerStatus);
router.route("/ping-me").get(health_check_controller_1.getServerPing);
exports.default = router;
