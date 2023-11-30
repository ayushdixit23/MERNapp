const jwt = require("jsonwebtoken");
const User = require("./models/User");

// MiddleWare For Checking User is Authenticated or Not
exports.authenticateUser = async (req, res, next) => {
	try {
		const authorizationHeader = req.headers["authorization"];
		const token = authorizationHeader && authorizationHeader.split(" ")[1];
		if (!token) {
			return res.status(404).json({ success: false, message: "Unauthorized: Access token not provided" });
		}
		const decodedToken = jwt.verify(token, process.env.MY_SECRET_KEY);
		const user = await User.findById(decodedToken.id)
		if (!user) {
			return res.status(500).json({ success: false, message: "Unauthorized: User not found" });
		}
		req.user = { id: user._id, username: user.userName, role: "admin" };
		next();
	} catch (err) {
		console.error("Authentication error:", err);
		return res.status(401).json({ success: false, message: "Unauthorized: Invalid access token" });
	}
};