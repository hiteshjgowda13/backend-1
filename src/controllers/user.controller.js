import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/users.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

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

    const{fullName, email, username, password} = req.body
    console.log("email :" ,email)

    if(
        [fullName,email,username,password].some((field) => field?.trim === "")
    ){
        throw new apiError(400,"All fields are required")
    }

    const existedUser = User.findOne({
        $or: [{ username },{ email }]
    })

    if(!existedUser){
        throw new apiError(409,"User with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new apiError(400,"Avtar file is required")
    }

    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new apiError(400,"Avtar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new apiError(500,"something went wrong while registering the user")
    }
    
    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    )
})

export {registerUser}