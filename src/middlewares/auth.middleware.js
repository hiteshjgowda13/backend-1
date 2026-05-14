import { User } from "../models/users.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

// if we want to omit res we replace it with underscore (_)
//this is for secure routes assuming user is registered and logged in
export const verifyJWT = asyncHandler(async (req, _,next) =>{
try {
    //get access token here 
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
    //check if token is there else give error negative check
    if(!token){
        throw new apiError(401,"unauthorized request")
    }
    //verify the token with our token and return decoded value using jwt.verify
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) //returns decoded value
        
    // get user from db and remove password and refresh token from him after
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
    
    if(!user){
        throw new apiError(401,"Invalid access Token")
    }
    
    req.user = user;
    next()
} catch (error) {
    throw new apiError(401, error?.message || "Invalid access Token")
}
})