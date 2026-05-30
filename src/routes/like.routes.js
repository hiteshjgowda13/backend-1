import { Router } from "express";
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
} from "../controllers/like.controller.js"

import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

//loggedin routes:
router.route("/toggle/video/:videoId").post(verifyJWT,toggleVideoLike)//checked
router.route("/Liked-Videos").get(verifyJWT,getLikedVideos)//checked
router.route("/toggle/comment/:commentId").post(verifyJWT,toggleCommentLike)//checked
router.route("/toggle/tweet/:tweetId").post(verifyJWT,toggleTweetLike)//checked

export default router