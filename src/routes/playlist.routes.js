import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoPlaylist,
    removeVideoPlaylist,
    deletePlaylist,
    updatePlaylist,
    togglePlaylistVisibility
} from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/toggle/:playlistId")
.post(verifyJWT, togglePlaylistVisibility)//checked

router.route("/")
.post(verifyJWT, createPlaylist)//checked
.get(verifyJWT, getUserPlaylist)//checked

router.route("/:playlistId")
.get(verifyJWT, getPlaylistById)//checked
.put(verifyJWT, updatePlaylist)//checked
.delete(verifyJWT, deletePlaylist)//checked

router.route("/:playlistId/:videoId")
.post(verifyJWT, addVideoPlaylist)//checked
.delete(verifyJWT, removeVideoPlaylist)//checked


export default router