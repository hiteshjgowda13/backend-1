import mongoose,{isValidObjectId} from "mongoose";
import { User } from "../models/users.model.js"
import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

//toggle subscribe button logic
const toggleSubscription = asyncHandler( async (req,res) =>{
    /*
    algorithm:
    1. get channelId
    2. validate objectId
    3. prevent self subscription
    4. check existing subscription
    5. if exists -> delete
    6. else -> create */

    const { channelId } = req.params

    if(!isValidObjectId(channelId)){
        throw new apiError(400,"invalid channelId")
    }
    //check if channel exists or not else throw error
    const channel = await User.findById(channelId) //findbyId direct expects value of id not object

    if(!channel){
        throw new apiError(404,"no channel found for given channelId")
    }

    if(req.user?._id.toString()===channelId){ //comparasion 
        throw new apiError(403,"user cannot subscribe to their own channel")
    }

    const isSubscribed = await Subscription.exists({
        subscriber:req.user._id,
        channel:channelId
    })

    if(isSubscribed){
        await Subscription.findOneAndDelete({
            subscriber:req.user._id,
            channel:channelId
        })
        return res.status(200)
        .json(
            new apiResponse(
                200,
                {
                    Subscribed:false
                },
                "unsubscribed the channel"
            )
        )
    }else{
        await Subscription.create({
            subscriber:req.user._id,
            channel:channelId
        })
        return res.status(201)
        .json(
            new apiResponse(
                201,
                {
                    Subscribed:true
                },
                "subsribed to channel"
            )
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubcribers = asyncHandler( async (req,res) =>{
    /*algorithm:
    get userCHannelsubsribers how do i do it? and its a secured route too?
    like(only channel owner can access this infor ryt in yt) other can see count how do i build logicv for this
    : channelid from params return docs where channel:channel id ?
    i need only subscribers not channel since it ll be same do i need populate?
    i get id from subscribers so i need username and avatar? how do i do it? 
    populate("subscriber" ."username avatar") */

    const{channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new apiError(400,"invalid channeld")
    }

    if(req.user?._id.toString() !== channelId){
        throw new apiError(403,"ur not authorized to view this")
    }

    const subscribers = await Subscription.find({
        channel: channelId
    })
    .sort({ updatedAt: -1 })
    .populate("subscriber", "username avatar")
    
    const subscriberList = subscribers.map((sub) => sub.subscriber)

    return res.status(200)
    .json(
        new apiResponse(200,subscriberList,"succesffuly fetched all subscribers")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler( async (req,res) =>{
    const{channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new apiError(400,"invalid channeld")
    }

    if(req.user?._id.toString() !== channelId){
        throw new apiError(403,"ur not authorized to view this")
    }

    const subscribedTo = await Subscription.find({
        subscriber:channelId
    })
    .sort({updatedAt:-1})
    .populate("channel","username avatar")

    
    const subscribedToList = subscribedTo.map(
        (sub)=>sub.channel
    )

    return res.status(200)
    .json(
        new apiResponse(200,subscribedToList,"succesffuly fetched all subscribedTo")
    )
})

export{
    toggleSubscription,
    getUserChannelSubcribers,
    getSubscribedChannels
}