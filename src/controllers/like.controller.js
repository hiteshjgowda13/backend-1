import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { apiResponse } from "../utils/apiResponse.js"


const toggleVideoLike = asyncHandler(async (req,res)=>{

})

const toggleCommentLike = asyncHandler(async (req,res)=>{

})

const toggleTweetLike = asyncHandler(async (req,res)=>{

})

const getLikedVideos = asyncHandler(async (req,res)=>{

})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}


