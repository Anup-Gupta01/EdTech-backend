const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");



//auth

exports.auth = async (req, res, next) => {
  try {
    // console.log("🛡️ auth middleware hit");

    const authHeader = req.header("Authorization");
    // console.log("🔐 authHeader =", authHeader);

    const token =
      req.cookies?.token ||
      req.body?.token ||
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null);

    // console.log("📦 Token being verified =", token);
    // console.log("🔑 JWT_SECRET =", process.env.JWT_SECRET);

    if (!token) {
      // console.log("❌ token tumhare invalid hai bete");
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("✅ Decoded Token:", decode);
      req.user = decode;
    } catch (error) {
      // console.log("❌ JWT Verification Failed:", error.message);
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }

    next();
  } catch (error) {
    // console.log("💥 Unexpected error in auth middleware:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while validating the token",
    });
  }
};


//isStudent

exports.isStudent =async (req,res,next) => {
    try{
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success: false,
                message:'this is a protected route for students only',
            });
        }
        next();

    } catch(error){
        return res.status(500).json({
            success:false,
            message:'User role i=cannot be verified',
        })
    }
}

//isInstructor
exports.isInstructor =async (req,res,next) => {
    try{
        // console.log("👨‍🏫 isInstructor middleware hit");
        // console.log("req.user in isInstructor:", req.user)

        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success: false,
                message:'this is a protected route for Instructor only',
            });
        }
        next();

    } catch(error){
        return res.status(500).json({
            success:false,
            message:'User role i=cannot be verified',
        })
    }
};

//isAdmin

exports.isAdmin =async (req,res,next) => {
    try{
        console.log("pritng accounting:" ,req.user.accountType);
        if(req.user.accountType !== "Admin"){
            return rs.status(401).json({
                success: false,
                message:'this is a protected route for Admins only',
            });
        }
        next();

    } catch(error){
        return res.status(500).json({
            success:false,
            message:'User role i=cannot be verified',
        })
    }
};