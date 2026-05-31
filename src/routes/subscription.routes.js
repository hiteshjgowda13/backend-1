import { Router } from "express";
import{
    toggleSubscription,
    getUserChannelSubcribers,
    getSubscribedChannels
}from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
.route("/c/:channelId")
.get(getSubscribedChannels)//subscribed To
.post(toggleSubscription)

router.route("/u/:channelId").get(getUserChannelSubcribers)//subscribers

export default router