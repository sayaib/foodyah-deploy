// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

  if (!token)
    return res.status(401).json({ message: "Unauthorized: No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Ensure user object has _id property
    req.user = {
      _id: user._id,
      id: user._id, // For backward compatibility
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      ...user._doc // Include all other user properties
    };
    
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token", error: err.message });
  }
}
