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


const getSingleVideo = asyncHandler( async (req,res) => { //fetch single video
    //algorithm to get single video:
    //1.get video id from params and check if its valid object id
    //2.find video in db and populate owner field with name and email
    //3.if not found throw error else return response with video details

    // get video using params :videoID
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new apiError(404,"resource not found")
    }

    const video = await Video.findByIdAndUpdate( //this isnt how it works in backend 
        //for now it whenever we fetch view increases so in real projects threshold watchtime is included:notice
        videoId,
        {
            $inc:{
                views: 1
            }
        },
        {new:true} // returns updated doc not old one
    ).populate("owner","username avatar")


    if(!video){
        throw new apiError(404,"no video found for given id")
    }

    // Track the fetched video in the logged-in user's watch history.
    if(req.user?._id){
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $addToSet: {
                    watchHistory: video._id
                }
            }
        )
    }



    return res.status(200)
    .json(
        new apiResponse(200,video,"video fetched sucessfully")
    )
})



const getAllVideos = asyncHandler( async (req,res) => {
    //algorithm to get all videos:
    //1.get videos and videos/search are different 
    //2.here we are doing based on search
    //3.req.query gives the address in this way
    //4.not using aggregate here bcs its complex 
    //5.filter videos and give only ispublished true 
    //5.if search exists after filter then regex on title 
    //6.find video in db and populate owner field with username sort too
    //7.return response with videos details well number of videos will be in array

    const {search} = req.query
    let videos
    if(!search){
        videos = await Video.find({
            isPublished:true
        }).populate("owner","username avatar")
        .sort({ createdAt:-1})
        .select("-description -updatedAt")
    }
    else{
        videos = await Video.find({
            isPublished: true,
            title:{
                $regex: search,
                $options: "i" // searches for case insenstive and returns related fields
            }
        }).populate("owner","username avatar")
        .sort({ createdAt:-1})
        .select("-description -updatedAt")
    }
    
    return res.status(200)
    .json(
        new apiResponse(200,videos,"videos fetched succesfully")
    )
    /*
    for production level only one query no if else
    const filter = {
        isPublished:true
     }
     
     if(search){
        add regex title search
     }
     
     run one query using filter
      */
})



const updateVideoDetails = asyncHandler( async(req,res) =>{
    /* algorithm:
    1. get videoID from params directly check validty
    2.get title or description or thumbnail as only this can updated
    3.check if  either one is empty
    4.take videoID then compare with owner and req.user._id
    5.update video details then return
    */

    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new apiError(404,"resource not found")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError(404,"no video found for given id")
    }

    if(video?.owner?.toString() !== req.user?._id.toString()) {
        throw new apiError(403,"unauthorized request")
    }

    const {title,description} = req.body

    let thumbnailLocalPath;//check if present then uploaded path is stored
    if(req.file){
        thumbnailLocalPath = req.file.path
    }
    /*req.files gives an array of files:which contents object
    [{},{}]
    each object:
    {
    fieldname: 'thumbnail',
    path: we take this 
    mimetype:
    } */

    if(!title && !description && !thumbnailLocalPath){
        throw new apiError(400,"atleast one field is required")
    }

    const updateFields = {}

    if(title){
        updateFields.title = title
    }
    if(description){
        updateFields.description = description
    }
    if(thumbnailLocalPath){
        const thumbnail = await uploadCloudinary(thumbnailLocalPath)
        if(!thumbnail){
            throw new apiError(500,"error while uploading the file")
        }
        updateFields.thumbnail = thumbnail.url
    }

    const updatedVideo = await  Video.findByIdAndUpdate(
        videoId,
        {
            $set:updateFields
        },
        {
            returnDocument:"after"
        }
    ).populate("owner","username avatar")
    
    return res.status(200)
    .json(
        new apiResponse(200,
            updatedVideo,
            "video details updated succesffullly"
        )
    )
})


const deleteVideo = asyncHandler( async(req,res) =>{
    /* algorithm:
    1.get VideoId from params
    2.validate if its object id else return error
    3.check if video exists esle error
    4.validate video.owner.id and req.user.id
    4.if same delete else throw error
    5.use second query find by idanddelte */

    const {videoId} = req.params

    // if videoID is wrong or missing 24 char
    if(!isValidObjectId(videoId)){
        throw new apiError(404,"resource not found")
    }
    //find the video using the given id
    const video = await Video.findById(videoId)
    //return error if no video found
    if(!video){
        throw new apiError(404,"no video found for given id")
    }
    //validate owner and req.user._id
    if(video?.owner?.toString() !== req.user?._id.toString()) {
        throw new apiError(403,"unauthorized request")
    }
    //run query to directly delete from db as this does harddelete
    await Video.findByIdAndDelete(videoId)
    //return success if deleted else let await handle
    return res.status(200)
    .json(
        new apiResponse(200,null,"video deleted successfully")
    )

    /*
    this is harddelete function,but in producstion we do soft delete where in
    in schema we add field is deleted type boolean default false we toggle when 
    this route is clicked set a threshold for 30days check if user wants to restor
    apply condition if deleted days>30 then deleete from mongodb too using time and date or smtng related
    not sure
    */
})

const togglePublicStatus = asyncHandler( async(req,res) =>{
    /* algorithm:
    1. get videoID from params
    2. check if video exists
    3. check if user is the owner of the video
    4. toggle the isPublished field
    5. return updated video details
    */

    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new apiError(400,"invalid objectID")
    }

    const video = await Video.findById(videoId).populate("owner","username avatar")

    if(!video){
        throw new apiError(404,"no video found for given ID")
    }

    if(video?.owner?._id.toString() !== req.user?._id.toString()){
        throw new apiError(403,"unauthorized request")
    }

    // const updateFields ={}

    // if(video.isPublished){
    //     updateFields.isPublished =false
    // }else{
    //     updateFields.isPublished =true
    // }

    // const updatedVideo = await Video.findByIdAndUpdate(
    //     videoId,
    //     {
    //         $set:updateFields
    //     },
    //     {
    //         returnDocument:"after"
    //     }
    // ).populate("owner", "username avatar") db call is hitting twice optimize it

    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200)
    .json(
        new apiResponse(200,
            video,
            "toggled isPublished value succesffully"
        )
    )
})

const getMyvideos = asyncHandler( async(req,res) =>{
    /*algorithm:
    1. get the user ID from the request
    2. find all videos where the owner is the logged-in user
    also sort accordingly with latest video first
    3. return the list of videos
    */
   const userId = req.user._id

   const videos = await Video.find(
        // owner. not this mongoose expects an object
        {
            owner:userId
        }
   ).populate("owner","username avatar")
   .sort({updatedAt:-1})
   .select("-description -createdAt")

   return res.status(200)
   .json(
    new apiResponse(200,videos,"all user videos fetched")
   )
})

export {
    uploadVideo,
    getSingleVideo,
    getAllVideos,
    updateVideoDetails,
    deleteVideo,
    togglePublicStatus,
    getMyvideos 
}