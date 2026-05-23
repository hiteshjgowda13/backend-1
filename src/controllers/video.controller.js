import {Video} from '../models/video.model.js'
import {User} from '../models/users.model.js'
import {uploadCloudinary} from '../utils/cloudinary.js'
import {apiError} from '../utils/apiError.js'
import {apiResponse} from '../utils/apiResponse.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import mongoose ,{isValidObjectId} from 'mongoose'

const uploadVideo = asyncHandler( async (req,res) => {
    /* description  to upload the video:
    our route verifies if user is logged in so jwt works there:
    now what we need to store in db are owner which comes from user 
    we dont need to store views since here post op is only uploading video
    duration is coming from cloudinary [check this how]
    description,title  from body 
    
    algorithm to upload video:
    1.destructure the req.body values check if empty since required : true
    2.store local path for videofile and thumbnail since it comes from middleware
    3.upload on cloudinary for both after checking 
    4.gather duration 
    5.give the video owner field which is logged in user*/

    const {title, description} = req.body

    //check if title and description is empty after trim
    if(
        [title,description].some((field) => field?.trim() === "")
    ){
        throw new apiError(400,"title and description required")
    }
    //multer gives path and its uploaded in public
    const videoFileLocalpath = req.files?.videoFile?.[0]?.path;
    
    if(!videoFileLocalpath){
        throw new apiError(400,"VideoFile is required")
    }

    const thumbnailLocalpath = req.files?.thumbnail?.[0]?.path;

    if(!thumbnailLocalpath){
        throw new  apiError(400,"thumbnail is required")
    }

    const thumbnail = await uploadCloudinary(thumbnailLocalpath)
    const videoFile = await uploadCloudinary(videoFileLocalpath)

    if(!thumbnail){
        throw new apiError(500,"error while uploading file")
    }

    if(!videoFile){
        throw new apiError(500,"error while uploading file")
    }
    
    //create document for db:
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        //views:,
        owner:req.user._id//jwt has already given this so chill
    })

    if(!video){
        throw new apiError(500,"something went wrong while creating doc")
    }

    return res.status(201)
    .json(
        new apiResponse(201,
            video,
            "video uploaded succesfully"
        )
    )

})


const getSingleVideo = asyncHandler( async (req,res) => { //single video when search 

})



const getAllVideos = asyncHandler( async (req,res) => {

})



const updateVideoDetails = asyncHandler( async(req,res) =>{

})


const deleteVideo = asyncHandler( async(req,res) =>{

})

const togglePublicStatus = asyncHandler( async(req,res) =>{

})

export {
    uploadVideo,
    getSingleVideo,
    getAllVideos,
    updateVideoDetails,
    deleteVideo,
    togglePublicStatus
}