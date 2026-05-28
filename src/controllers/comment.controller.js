import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";


const getVideoComments = asyncHandler( async(req,res) => {

})


const addComment = asyncHandler(async (req,res) =>{

})

const updateComment = asyncHandler(async (req,res) =>{

})

const deleteComment = asyncHandler(async (req,res) => {

})


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}