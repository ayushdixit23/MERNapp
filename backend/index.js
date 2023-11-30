const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const User = require("./models/User")
const bycrpt = require("bcrypt")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const Post = require("./models/Post")
const path = require("path")
require("dotenv").config()
const PORT = process.env.PORT || 5000
const app = express()
const { authenticateUser } = require("./middleware")

app.use(cors())
app.use(express.json())
app.use(express.static("uploads"));

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/");
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
	}
});

const upload = multer({ storage: storage });

mongoose.connect("mongodb://127.0.0.1:27017/jwt").then(() => console.log(`Connected to MongoDb`)).catch((err) => {
	console.log(err)
})

function generateAccessToken(data) {
	const access_token = jwt.sign(data, process.env.MY_SECRET_KEY, { expiresIn: "45m" })
	return access_token
}
function generateRefreshToken(data) {
	const refresh_token = jwt.sign(data, process.env.MY_SECRET_KEY, { expiresIn: "7d" })
	return refresh_token
}

app.post("/signup", async (req, res) => {
	try {
		const { email, userName, password } = req.body
		const user = await User.findOne({ email })
		if (user) {
			res.json({ message: "User already exists" })
		} else {
			const hashPassword = await bycrpt.hash(password, 10)
			const newUser = new User({
				userName,
				email,
				password: hashPassword
			})
			const saveuser = await newUser.save()
			res.json({ saveuser, success: true })
		}
	} catch (err) {

	}
})

app.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body
		const user = await User.findOne({ email })
		const passwordMatch = await bycrpt.compare(password, user.password);
		if (!user) {
			res.json({ message: "User not Found", success: false })
		}
		if (!passwordMatch) {
			return res.json({ message: "Incorrect Password", success: false });
		}
		const data = { id: user._id, username: user.userName, role: "admin" }
		const access_token = generateAccessToken(data)
		const refresh_token = generateRefreshToken(data)
		res.json({ access_token, refresh_token, user, success: true })
	} catch (err) {
	}
})

app.post("/refresh", async (req, res) => {
	try {
		const { refresh_token } = req.body;

		if (!refresh_token) {
			return res.json({ success: false, message: "Refresh token not provided" });
		}
		jwt.verify(refresh_token, process.env.MY_SECRET_KEY, async (err, payload) => {
			try {
				if (err) {
					return res.json({ success: false, message: "Invalid refresh token" });
				}
				const user = await User.findById(payload.id)
				if (!user) {
					return res.json({ success: false, message: "User not found" });
				}
				const data = { id: user._id, username: user.userName, role: "admin" }
				const access_token = generateAccessToken(data)
				res.json({ success: true, access_token });
			} catch (err) {
				console.log(err)
			}
		})
	} catch (err) {
		console.log(err);
		res.json({ success: false, message: "Internal server error" });
	}
});

app.post("/post", authenticateUser, upload.single("postimage"), async (req, res) => {
	const { caption } = req.body;
	const postimage = req.file
	const user = req.user

	console.log(user, user.id)
	try {
		const newPost = new Post({
			caption,
			postimage: postimage.filename,
			userid: user.id
		})
		const userToSend = await newPost.save()
		await User.updateOne({ _id: user.id }, { $push: { postId: userToSend._id } })
		res.json({ userToSend, success: true })
	} catch (err) {
		res.json({ success: false, message: "Internal server error" });
	}
})

app.get("/getPost", async (req, res) => {
	try {
		const post = await Post.find().populate("userid", "userName").populate("comments.id")
		if (post) {
			const posts = post.reverse()
			res.json({ success: true, posts })
		}
	} catch (err) {
		res.json({ success: false, message: "Internal server error" });
	}
})

app.delete("/delete/:id/:postid", authenticateUser, async (req, res) => {
	try {
		const { id, postid } = req.params;
		console.log("Request User ID:", id);
		console.log("Authenticated User ID:", req.user.id);
		if (req.user.id.toString() !== id) {
			return res.json({ success: false, message: "You can only delete your own posts" });
		}
		const deletedPost = await Post.findByIdAndDelete(postid);
		await User.updateOne({ _id: id }, { $pull: { postId: postid } })
		if (!deletedPost) {
			return res.json({ success: false, message: "Post not found" });
		}
		if (deletedPost.userid.toString() !== id) {
			return res.json({ success: false, message: "You don't have permission to delete this post" });
		}
		res.json({ success: true });
	} catch (err) {
		console.error(err);
		res.json({ success: false, message: "Internal server error" });
	}
});

app.post('/logout', authenticateUser, async (req, res) => {
	try {
		res.json({ success: true, message: 'Logout successful' });
	} catch (error) {
		console.error('Logout error:', error);
		res.status(500).json({ success: false, message: 'Internal server error during logout' });
	}
});

app.post("/like/posts/:postid", authenticateUser, async (req, res) => {
	try {
		const { postid } = req.params;
		const user = req.user;
		const post = await Post.findById(postid)
		if (!post) {
			return res.json({ success: false, message: "Post doesn't exist" });
		}
		await Post.findByIdAndUpdate({ _id: postid }, { $push: { likes: user.id.toString() } }, { new: true });
		if (post.dislikes.includes(user.id.toString())) {
			await Post.findByIdAndUpdate({ _id: postid }, { $pull: { dislikes: user.id.toString() } }, { new: true });
		}
		const updatedUser = await User.findByIdAndUpdate({ _id: user.id.toString() }, { $push: { likedPost: postid } }, { new: true });
		if (post.likes.includes((user.id.toString())) && updatedUser.likedPost.includes(postid.toString())) {
			await Post.findByIdAndUpdate({ _id: postid }, { $pull: { likes: user.id.toString() } }, { new: true });
			await User.findByIdAndUpdate({ _id: user.id.toString() }, { $pull: { likedPost: postid } }, { new: true });
			return res.json({
				success: true,
				message: "Post Unliked successfully",
			});
		}
		res.json({
			success: true,
			message: "Post liked successfully",
		});
	} catch (err) {
		console.error("Like post error:", err);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

app.post("/dislike/post/:postid", authenticateUser, async (req, res) => {
	try {
		const user = req.user
		const { postid } = req.params
		const post = await Post.findById(postid)
		if (!post) {
			return res.json({ success: false, message: "Post doesn't exist" });
		} else {
			if (!post.dislikes.includes(user.id.toString())) {
				await Post.findByIdAndUpdate({ _id: postid }, { $push: { dislikes: user.id.toString() } }, { new: true })
			} else {
				await Post.findByIdAndUpdate({ _id: postid }, { $pull: { dislikes: user.id.toString() } }, { new: true })
			}
			if (post.likes.includes(user.id.toString())) {
				await Post.findByIdAndUpdate({ _id: postid }, { $pull: { likes: user.id.toString() } }, { new: true })
			}
		}
		res.json({ success: true, message: "Done" })
	} catch (err) {
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
})

app.post("/post/comment/:postid", authenticateUser, async (req, res) => {
	try {
		const user = req.user
		const { postid } = req.params
		const { message } = req.body
		const post = await Post.findByIdAndUpdate({ _id: postid }, { $push: { comments: { id: user.id.toString(), message } } }, { new: true })
		if (!post) {
			return res.json({ success: false, message: "Post doesn't exist" });
		}
		res.json({ success: true, message: "Updated" })
	} catch (err) {
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
})

app.post("/delete/comment/:id/:postid/:comid", authenticateUser, async (req, res) => {
	try {
		const { id, postid, comid } = req.params;
		const userid = req.user.id
		if (userid.toString() === id) {
			const result = await Post.findByIdAndUpdate(
				{ _id: postid },
				{ $pull: { comments: { _id: comid } } },
				{ new: true }
			);
			if (result) {
				return res.json({ success: true, message: "Comment deleted successfully" });
			} else {
				return res.status(404).json({ success: false, message: "Comment not found" });
			}
		} else {
			return res.json({ success: false, message: "Can Not Delete Others Comment " })
		}
	} catch (err) {
		console.error(err);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
})

app.listen(PORT, (err) => {
	if (err) {
		throw err
	}
	console.log(`Connected on ${PORT}`)
})
