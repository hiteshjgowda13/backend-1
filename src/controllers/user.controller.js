import { asyncHandler } from "../utils/asyncHandler.js"; 
import { apiError } from "../utils/apiError.js";
import { User } from "../models/users.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";



const generateAccessNRefreshToken = async(userID) => {
    //this function accepts userid 
    //generates the refresh and access token from user model methods using jwt
    try {
        const user = await User.findById(userID)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken}
    } catch (error) {
        throw new apiError(500,"something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async(req,res) => {

    //get user details as per user model
    //validation - eg. not empty input 
    //check if acc exists: check using email or username
    //check images
    //check avatar which is required 
    //upload them to cloudinary,check avatar (multer uploaded or not)
    //create user object to mongodb bcs nosql - create entry in db
    //remove password and refresh token field from response 
    //check if response came or not (null or user created)
    //return response else error


    //from frontend we get this body
    const{fullName, email, username, password} = req.body
    //console.log("email :" ,email) //checking if we are able to see and yes 


    //trimming first and last spaces and checking if empty for all the fields else throw error
    if(
        [fullName,email,username,password].some((field) => field?.trim() === "")
    ){
        throw new apiError(400,"All fields are required")
    }

    // use model.findOne with same username or email else return error
    const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    })

    if(existedUser){
        throw new apiError(409,"User with email or username already exist")
    }

    //multer gives path since avatar is required check for it again
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path; complex and may lead to undefined which gives error later

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new apiError(400,"Avtar file is required")
    }
    
    //after multer we hav in local so upload on cloudinary
    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = await uploadCloudinary(coverImageLocalPath)

    //again check avatar
    if(!avatar){
        throw new apiError(400,"Avtar file is required")
    }
    
    //now store user using mongodb "create"
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //disable password and from model (User) and userid
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //user not created its server error
    if(!createdUser){
        throw new apiError(500,"something went wrong while registering the user")
    }
    

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req,res) => {
    //req body -> get data
    //username available or email available
    //find the user according to email or username
    //checks the password
    //access and refresh token generate
    //send cookies

    const {email,username,password} = req.body

    if(!username && !email){
        throw new apiError(400,"Username or email is required")
    }

    // if (!username || !email){ this is wrong not ok 
    //     throw new apiError(400,"username or email is required")
    // }
    // instead of above code use this like for anyone required:
    // if(!(username||email))

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new apiError(404,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiError(401,"password incorrect")
    }

    const {accessToken,refreshToken} = await generateAccessNRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //what info send to user cooke
    const options ={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new apiResponse(200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in Successfully"
        )
    )
})


const logoutUser = asyncHandler( async (req,res) => {
    //how to logout user?
    //clear cookies http only so
    //refresh token reset 
    //doing using middleware
    await User.findByIdAndUpdate(
        //set is mongodb function wheich sets refresh token undefined
        req.user._id,
        {
            $set:{
                refreshToken:  undefined // makes the refreshtoken from db vanish set is a function of mongodb
            }
        },
        {
            new: true //used to not get back refreshtoken again
        }
    )
    //cookie setting httponly and secure
    const options ={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new apiResponse(200,{},"User Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
// refresh access token when its expired using refresh token checking

    //take incoming refresh token from cookies or body and check if given else throw error
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new apiError(401,"Unauthorized request")
    }
    try {
        //incoming token is in encrypted format so we hav to verify it once ie decode the incoming token
        const decodedToken = jwt.verify( incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        //using jwt verify we get token use tht to verify with our userid db refresh token if valid send access
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new apiError(401,"invalid refresh TOken")
        }
        //else 210: throw error
        if(incomingRefreshToken !== user?.refreshToken){
            throw new apiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure: true,
        }
        //generate new access token and new refresh token accordingly and send it back to user
        const {accessToken, newRefreshToken} = await generateAccessNRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new apiResponse(
                200,
                {accessToken, refreshToken : newRefreshToken},
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new apiError(401,error?.message || "Invalid refreshed token")
    }
})

const changeCurrentPassword = asyncHandler(async ( req,res) =>{
    const {oldPassword, newPassword} = req.body

    //req.user?._id from auth middle ware we verify if user is logged in and hence proceed
    const user = await User.findById(req.user?._id)

    //ispassword correct is from user model method 
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new apiError(400,"Invalid password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json( new apiResponse(200,{},"password changed successfully"))
})

const getcurrentUser = asyncHandler ( async (req,res) =>{
    return res.status(200)
    .json(
        new apiResponse(200,req.user,"user details fetched succesfully")
    )
})

const updateDetails = asyncHandler(async (req,res) => {
    const {fullName , email} = req.body
    //accept fullname and email from user and update it if email and password not there throw error
    if(!fullName || !email){
        throw new apiError(400,"required fields")
    }
    //it is secure routes so req.user id should work or can keep a middle ware over here
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            //set fullname and email new one
            $set:{
                fullName,
                email: email
            }
        },
        {new:true}
    ).select("-password") //delete password and send the response

    return res.status(200)
    .json(
        new apiResponse(200,user,"account details updated successfully")
    )
})


/*
update files avatar or coverImage:
while uploading thru multer we store in diskstorage or locally so access using req.file
if absent throw error
upload on cloudinary method which gives us url
check and throw error if missing
find user thru middleware and set avatar or coverimage accordingly
*/
const updateUserAvatar = asyncHandler( async (req,res) =>{
    //checked and worked but cloudinary file is still there so shld delete it automatically
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new apiError(400,"avatar file is missing")
    }

    const avatar = await uploadCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new apiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(
        new apiResponse(200,user,"avatar updated successfully")
    )
})

const updateUserCoverImage =asyncHandler(async(req,res) =>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new apiError(400,"error coverimage file missing")
    }

    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new apiError(400,"Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(
        new apiResponse(200,user,"cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res) =>{
    //req.params contains url and gives us username we destructure it 
    const {username} = req.params
    //check if username is given or empty
    if(!username?.trim()){
        throw new apiError(400,"username is missing ")
    }

    //aggregate are sequence stages which execute one after another in db and it returns array
    const channel = await User.aggregate([
        {   //matches and gets document of username
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                // $lookup joins data from another collection into this aggregation pipeline
                from:"subscriptions", //in db all lower and plural
                localField:"_id", //in the new return value we hav this as id
                foreignField:"channel", // its looks on channel
                as:"subscribers"//named as subsribers
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber" ]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                //used to send selected fields not everything
                fullName:1,
                username:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])//for aggregate pipline 

    if(!channel?.length){
        throw new apiError(404,"Channel does not exist")
    }
    else{
        console.log(channel) // array output for my checking 
    }



    return res.status(200)
    .json(
        new apiResponse(200,channel[0],"User channel fetched successfully")
    )
})//for function of getUserChannelProfile 



const getWatchHistory = asyncHandler(async (req,res) =>{
    //for aggregate mongoose wont intefere it goes direclty to mongodb
    //also req.user._id gives a string mongoose just does the conversion in its own 
    //so we convert here
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id) 
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(
        new apiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getcurrentUser,
    updateDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getWatchHistory,
    getUserChannelProfile
}