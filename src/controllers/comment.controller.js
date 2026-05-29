import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import mongoose, { isValidObjectId } from "mongoose";


const getVideoComments = asyncHandler( async(req,res) => {
    /*algorithm:
    1.get videoID page limit from param and query 
    2.verify if is videoID is object
    3.veirfy limit and keep page as default 1 keep limit 10 option
    4.throw error if limit is more 
    5.verify if video exists while getting comments for it
    6.load comments also count documents how many comments*/

    //toget videoID it comes from ":" params
    const {videoId} = req.params
    //to get page and limit it comes from query
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    //production level code should not allow more than 20 limit to avoid server overload
    const limit = Math.min(parseInt(req.query.limit) || 10, 20)
    const skip =(page-1)*limit //skips contents accordingly

    if(!isValidObjectId(videoId)){
        throw new apiError(400,"bad request invalid videoID")
    }

    //3 and 4 is already done silently checks for limit and page default is 1 for page
    //limit is 10 if not given if exceeds 20 plus it becomes 20

    //verify if video exists:
    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError(404,"video not found")
    }

    const totalComments = await Comment.countDocuments(
        {
            video:videoId
        }
    )
    const totalPages = Math.ceil(totalComments/limit)
    const prevPage = page > 1
    const nextPage = page < totalPages

    const comments = await Comment.find(
        {
            video:videoId
        }
    )
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)
    .populate("owner","username avatar")

    return res.status(200)
    .json(
        new apiResponse(200,
          {  comments,
            totalComments,
            page,
            limit,
            totalPages,
            prevPage,
            nextPage
        },
            "successfully fetched comments for given VideoID"
        )
    )
})


const addComment = asyncHandler(async (req,res) =>{ //required jwt
    /*algorithm:
    1.get videoId form params and content from req.body validate both if empty or " "
    2.find video if not throw error
    3.create comment
     */

    const {videoId} = req.params
    const {content} = req.body

    if(!isValidObjectId(videoId)){
        throw new apiError(400,"bad request invalid videoID")
    }

    if(!content || !content.trim()){
        throw new apiError(400,"comment cant be empty")
    }

    const videoExists = await Video.exists({_id:videoId})
    if(!videoExists){
        throw new apiError(404,"video is not found")
    }

    const comment = await Comment.create(
        {
            content:content.trim(),
            video: videoId,
            owner:req.user._id
        }
    )
    if(!comment){
        throw new apiError(500,"server error while creating comment")
    }
    await comment.populate("owner","username avatar")

    return res.status(201)
    .json(
        new apiResponse(200,comment,"successfully posted comment")
    )
})

const updateComment = asyncHandler(async (req,res) =>{ //no need of videoID since comment knows it already
    /*algorithm:
    1.gather commentID and content from req.param and req.body
    2.validate both of them
    3.update the comment 
    4.change the boolean flag to true
    5.return updated comment */

    const {commentId} = req.params
    const {content} = req.body

    if(!isValidObjectId(commentId)){
        throw new apiError(400,"bad request invalid commentID")
    }
    if(!content || !content.trim()){
        throw new apiError(400,"comment cant be empty")
    }
    
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new apiError(404,"comment not found")
    }
    if(!comment.owner.equals(req.user._id)){
        throw new apiError(403,"unauthorized req")
    }

    
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content:content.trim(),
            isEdited:true,
        },
        {new:true}
    )
    if(!updatedComment){
        throw new apiError(500,"server error while updating")
    }
    await updatedComment.populate("owner","username avatar")

    return res.status(200)
    .json(
        new apiResponse(200,updatedComment,"successfully updated comment")
    )
})

const deleteComment = asyncHandler(async (req,res) => {
    //get commentID from params and verify if its object
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new apiError(400,"bad request invalid commentID")
    }
    //find the comment and check if comment there and then check if owner and req is same 
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new apiError(404,"comment not found")
    }
    if(!comment.owner.equals(req.user._id)){
        throw new apiError(403,"unauthorized req")
    }
    //delete the comment
    await Comment.findByIdAndDelete(commentId)

    return res.status(200)
    .json(
        new apiResponse(200,null,"comment deleted successfully")
    )
    /*
    this is harddelete function,but in producstion we do soft delete where in
    in schema we add field is deleted type boolean default false we toggle when 
    this route is clicked set a threshold for 30days check if user wants to restor
    apply condition if deleted days>30 then deleete from mongodb too using time and date or smtng related
    not sure
    */
})


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}