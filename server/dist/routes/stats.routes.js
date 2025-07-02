"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stats_controller_1 = require("../controller/stats.controller");
const router = (0, express_1.Router)();
router.route("/top-creators").get(stats_controller_1.getTopCreatorsController);
router.route("/trending-tags").get(stats_controller_1.getTrendingTagsController);
router.route("/community").get(stats_controller_1.getCommunityStatsController);
exports.default = router;
