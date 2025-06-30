import { Router } from "express";
import { getCommunityStatsController, getTopCreatorsController, getTrendingTagsController } from "../controller/stats.controller";



const router = Router()

router.route("/top-creators").get(getTopCreatorsController)
router.route("/trending-tags").get(getTrendingTagsController)
router.route("/community").get(getCommunityStatsController)

export default router