import mongoose,{isValidObjectId} from "mongoose";
import { User } from "../models/users.model.js"
import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

//toggle subscribe button logic
const toggleSubscription = asyncHandler( async (req,res) =>{
    
})

// controller to return subscriber list of a channel
const getUserChannelSubcribers = asyncHandler( async (req,res) =>{
    
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler( async (req,res) =>{
    
})

export{
    toggleSubscription,
    getUserChannelSubcribers,
    getSubscribedChannels
}