import { Router } from "express";
import{
    toggleSubscription,
    getUserChannelSubcribers,
    getSubscribedChannels
}from "../controllers/subscription.controller"

router = Router()

export default router