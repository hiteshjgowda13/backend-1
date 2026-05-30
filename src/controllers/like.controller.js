import mongoose,{isValidObjectId} from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { apiResponse } from "../utils/apiResponse.js"
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import {Tweet} from "../models/tweets.model.js"


//for toggling race condition fails:
//tht is if 2 reqs come at same time between find and create()
//two create happens
//so put unique indexing TODO
const toggleVideoLike = asyncHandler(async (req,res)=>{
    /*
    algorithm:
    1.get videoID from user and validate it 
    2.find video if not found throw error using exists 
    3.find matching doc of videoID and userID only 1 ll be writtened
    4.if found delete else create
    5.return response accordingly
     */


    const {videoId} =req.params

    if(!isValidObjectId(videoId)){
        throw new apiError(400,"bad request invalid videoId")
    }

    const videoExists = await Video.exists({_id:videoId})
    if(!videoExists){
        throw new apiError(404,"Video not found")
    }

    const videoLike = await Like.findOne({
        video:videoId,
        likedBy:req.user._id
    })

    if(videoLike){
        await Like.deleteOne({
            video:videoId,
            likedBy:req.user._id
        })
        return res.status(200)
        .json(
            new apiResponse(200,
                {
                    videoId,
                    isLiked:false
                }
                ,"unliked the video")
        )
    }else{
        await Like.create({
            video:videoId,
            likedBy:req.user._id
        })
        return res.status(201)
        .json(
            new apiResponse(201,
                {
                    videoId,
                    isLiked:true
                }
                ,"liked the video")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req,res)=>{
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new apiError(400,"bad request invalid commentId")
    }

    const commentExists = await Comment.exists({_id:commentId})
    if(!commentExists){
        throw new apiError(404,"comment not found")
    }

    const commentLike = await Like.findOne({
        comment:commentId,
        likedBy:req.user._id
    })

    if(commentLike){
        await Like.deleteOne({
            comment:commentId,
            likedBy:req.user._id
        })
        return res.status(200)
        .json(
            new apiResponse(
                200,
                {
                    commentId,
                    isLiked:false,
                },
                "unliked the comment"
            )
        )
    }else{
        await Like.create({
            comment:commentId,
            likedBy:req.user._id
        })
        return res.status(201)
        .json(
            new apiResponse(
                201,
                {
                    commentId,
                    isLiked:true,
                },
                "liked the comment"
            )
        )
    }
})

const toggleTweetLike = asyncHandler(async (req,res)=>{
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new apiError(400,"bad request invalid tweetId")
    }

    const tweetExists = await Tweet.exists({_id:tweetId})
    if(!tweetExists){
        throw new apiError(404,"tweet not found")
    }

    const tweetLike = await Like.findOne({
        tweets:tweetId,
        likedBy:req.user._id
    })

    if(tweetLike){
        await Like.deleteOne({
            tweets:tweetId,
            likedBy:req.user._id
        })
        return res.status(200)
        .json(
            new apiResponse(
                200,
                {
                    tweetId,
                    isLiked:false,
                },
                "unliked the tweet"
            )
        )
    }else{
        await Like.create({
            tweets:tweetId,
            likedBy:req.user._id
        })
        return res.status(201)
        .json(
            new apiResponse(
                201,
                {
                    tweetId,
                    isLiked:true,
                },
                "liked the tweet"
            )
        )
    }
})

const getLikedVideos = asyncHandler(async (req,res)=>{
    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user._id),
                video:{ $exists:true}
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"likedVideos",
                pipeline:[{
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[{
                            $project:{
                                fullname:1,
                                username:1,
                                avatar:1
                            }
                        }]
                    }
                },{
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                }]
            }
        }
    ])
    const videos = likedVideos.flatMap((doc) => doc.likedVideos ?? [])
    return res.status(200)
    .json(
        new apiResponse(
            200,
            videos,
            "succesffully fetched liked videos"
        )
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}


