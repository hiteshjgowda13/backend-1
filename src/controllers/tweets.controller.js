import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweets.model.js"
import {apiError} from "../utils/ApiError.js"
import {apiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req,res) =>{
    /*algorithm:
    1.from jwt middleware get userid loggedin user can tweet
    2.get content from req.body
    3.validate if content is provided or not
    4.create tweet and return response
     */

    const {content} = req.body
    if(!content.trim() || !content){
        throw new apiError(400,"Content is required")
    }

    const tweet = await Tweet.create({
        content:content.trim(),
        owner: req.user._id
    })

    if(!tweet){
        throw new apiError(500,"Failed to create tweet")
    }
    await tweet.populate("owner","username avatar")

    return res.status(201)
    .json(
        new apiResponse(201,tweet,"Tweet created successfully")
    )
})

const getUserTweet = asyncHandler(async(req,res) =>{ //not jwt since anyone can get other user tweets its public
    /*algorithm:
    1.get userid from req params
    2.validate if userid is valid
    3.find tweets for the user with pagination
    4.return response with populated owner details
     */


    const {userId} = req.params 
    //to get page and limit it comes from query
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    //production level code should not allow more than 20 limit to avoid server overload
    const limit = Math.min(parseInt(req.query.limit) || 10, 20)
    const skip =(page-1)*limit //skips contents accordingly

    if(!isValidObjectId(userId)){
        throw new apiError(400,"Invalid user id")
    }

    //flag to get total tweets to calc total pages prev and next page
    const totalTweets = await Tweet.countDocuments(
        {
            owner:userId
        }
    )
    const totalPages = Math.ceil(totalTweets/limit)
    const prevPage = page > 1
    const nextPage = page < totalPages

    const tweets = await Tweet.find(
        {
            owner:userId
        }
    ).sort({createdAt:-1})
    .skip(skip)
    .limit(limit)
    .populate("owner","username avatar")  

    return res.status(200)
    .json(
        new apiResponse(200,
            {
                tweets,
                totalTweets,
                page,
                limit,
                totalPages,
                prevPage,
                nextPage
            },
            "Successfully fetched tweets for given userId"
        )
    )
})

const updateTweet = asyncHandler(async(req,res)=>{
    /*algorithm:
    1.get tweet id from req params
    2.get content from req body
    3.validate both of them if present or not
    4.find tweet by id and update content only update if authrized user is owner of the tweet
    5.return response with updated tweet details
     */

    const {tweetId} = req.params
    const {content} = req.body

    if(!isValidObjectId(tweetId)){
        throw new apiError(400,"bad request invalid tweet id")
    }
    if(!content || !content.trim()){
        throw new apiError(400,"comment cant be empty")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new apiError(404,"tweet not found for given id")
    }

    if(!tweet.owner.equals(req.user._id)){
        throw new apiError(403,"unauthorized req")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content:content.trim(),
            isEdited:true,
        },
        {new:true}
    )
    if(!updatedTweet){
            throw new apiError(500,"server error while updating")
    }

    await updatedTweet.populate("owner","username avatar")

    return res.status(200)
    .json(
        new apiResponse(200,updatedTweet,"successfully updated tweet")
    )
})

const deleteTweet = asyncHandler( async (req,res) =>{
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new apiError(404,"resource not found")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new apiError(404,"no tweet with this id")
    }

    if(!tweet.owner.equals(req.user._id)){
        throw new apiError(403,"unauthorized req")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200)
    .json(
        new apiResponse(200,null,"tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}