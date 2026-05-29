import { Router } from "express";
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

//public routes
router.route("/:videoId").get(getVideoComments)//checked
//logged in routes
router.route("/:videoId/post-comment").post(verifyJWT,addComment)//checked
router.route("/update/:commentId").patch(verifyJWT,updateComment)//checled
router.route("/delete/:commentId").delete(verifyJWT,deleteComment)//checked
export default router