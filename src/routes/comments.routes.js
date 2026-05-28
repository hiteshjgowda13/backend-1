import { Router } from "express";
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import router from "./user.routes";

const route = Router()


export default router