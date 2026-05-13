import { asyncHandler } from "../utils/asyncHandler.js"; 
import { apiError } from "../utils/apiError.js";
import { User } from "../models/users.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"



const generateAccessNRefreshToken = async(userID) => {
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

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new apiError(401,"Unauthorized request")
    }
    try {
        //incoming token is in encrypted format so we hav to verify it once ie decode the incoming token
        const decodedToken = jwt.verify( incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new apiError(401,"invalid refresh TOken")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new apiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            http:true,
            secure: true,
        }
    
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

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}