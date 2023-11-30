const mongoose = require("mongoose")

const postScehma = new mongoose.Schema({
	userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	postimage: {
		type: String
	},
	caption: String,
	likes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}],
	dislikes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}],
	comments: [{
		id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		message: String
	}]
})

const Post = new mongoose.model("Post", postScehma)
module.exports = Post