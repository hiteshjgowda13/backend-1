import mongoose,{isValidObjectId} from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req,res) => { //router checked
    const {name, description} = req.body
    if(
        [name,description].some((field) => !field || field.trim() === "")
    ){
        throw new apiError(400,"All fields are required")
    }

    const playlist = await Playlist.create({
        name:name.trim(),
        description:description.trim(),
        owner:req.user._id
    })
    if(!playlist){
        throw new apiError(500,"Failed to create playlist")
    }
    return res.status(201).json(new apiResponse(201,playlist,"Playlist created successfully"))
})

const getUserPlaylist = asyncHandler(async (req,res) => {//router checked
    /*algorithm:
    1. Get authenticated user's id from req.user._id
    2. Find playlists where owner=req.user._id
    3. If no playlists, return empty array (NOT error)
    4. Return playlists */
    const playlists = await Playlist.find(
        {owner:req.user._id}
    )

    if(!playlists){
        throw new apiError(500,"Failed to fetch playlists")
    }

    return res.status(200).json(new apiResponse(200,playlists,"User playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req,res) => {//router checked
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new apiError(400,"Invalid playlist ID")
    }


    const playlist = await Playlist.findOne({
        _id:playlistId,
        $or:[
            {owner:req.user._id},
            {isPublic:true}
        ]
    }).populate("videos","title thumbnail duration views")

    
    
    if(!playlist){
        throw new apiError(404,"Playlist not found")
    }

    return res.status(200).json(new apiResponse(200,playlist,"Playlist fetched successfully"))
})

const addVideoPlaylist = asyncHandler(async (req,res) => {//router checked
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new apiError(400,"Invalid playlist ID or video ID")
    }
    const video = await Video.exists({_id:videoId})
    if(!video){
        throw new apiError(404,"Video not found")
    }

    const playlist = await Playlist.exists({
        _id:playlistId,
        owner:req.user._id
    })
    if(!playlist){
        throw new apiError(404,"Playlist not found")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {$addToSet:{videos:videoId}},//addToSet prevents duplicates
        {new:true}
    )
    if(!updatedPlaylist){
        throw new apiError(500,"Failed to add video to playlist")
    }
    return res.status(200).json(new apiResponse(200,updatedPlaylist,"Video added to playlist successfully"))
})

const removeVideoPlaylist = asyncHandler(async (req,res) => {//router checked
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new apiError(400,"Invalid playlist ID or video ID")
    }
    const video = await Video.exists({_id:videoId})
    if(!video){
        throw new apiError(404,"Video not found")
    }
    const playlist = await Playlist.exists({
        _id:playlistId,
        owner:req.user._id
    })
    if(!playlist){
        throw new apiError(404,"Playlist not found")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {$pull:{videos:videoId}},//pull removes the videoId from videos array if not there it ignores
        {new:true}
    )
    if(!updatedPlaylist){
        throw new apiError(500,"Failed to remove video from playlist")
    }
    return res.status(200).json(new apiResponse(200,updatedPlaylist,"Video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req,res) => {//router checked
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new apiError(400,"Invalid playlist ID")
    }
    const playlist = await Playlist.findOneAndDelete({
        _id:playlistId,
        owner:req.user._id
    })
    if(!playlist){
        throw new apiError(404,"Playlist not found")
    }
    return res.status(200).json(new apiResponse(200,null,"Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req,res) => {//router checked
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!isValidObjectId(playlistId)){
        throw new apiError(400,"Invalid playlist ID")
    }
    if(
        [name,description].some((field) => !field || field.trim() === "")
    ){
        throw new apiError(400,"All fields are required")
    }

    const playlist = await Playlist.findOneAndUpdate(
        {_id:playlistId, owner:req.user._id},
        {name:name.trim(), description:description.trim()},
        {new:true}
    )

    if(!playlist){
        throw new apiError(404,"Playlist not found")
    }

    return res.status(200).json(new apiResponse(200,playlist,"Playlist updated successfully"))
})

const togglePlaylistVisibility = asyncHandler(async (req,res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new apiError(400,"Invalid playlist ID")
    }
    const playlist = await Playlist.findOne({
        _id:playlistId,
        owner:req.user._id
    })
    if(!playlist){
        throw new apiError(404,"Playlist not found")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {isPublic: !playlist.isPublic},
        {new:true}
    )
    if(!updatedPlaylist){
        throw new apiError(500,"Failed to toggle playlist visibility")
    }
    return res.status(200).json(new apiResponse(200,updatedPlaylist,"Playlist visibility toggled successfully"))
})

export {
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoPlaylist,
    removeVideoPlaylist,
    deletePlaylist,
    updatePlaylist,
    togglePlaylistVisibility
}

