import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
} from "../controllers/tweets.controller.js"


const router = Router()


router.route("/:userId").get(getUserTweet)//checked
//loggedin features
router.route("/create-tweet").post(verifyJWT,createTweet)//checked
router.route("/update/:tweetId").patch(verifyJWT,updateTweet)//checked
router.route("/delete/:tweetId").delete(verifyJWT,deleteTweet)//checked
export default router