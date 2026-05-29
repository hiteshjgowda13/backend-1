import { Router } from "express";
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
} from "../controllers/like.controller.js"

import verifyJWT from "../middlewares/auth.middleware.js"

const router = Router()

export default router