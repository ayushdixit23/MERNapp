const mongoose = require("mongoose")

const userScehma = new mongoose.Schema({
	email: {
		type: String,
		unique: true,
	},
	userName: String,
	password: String,
	postId: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Post"
	}
	],
	likedPost: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Post"
	}]
})

const User = new mongoose.model("User", userScehma)
module.exports = User