const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config;




//sendotp
exports.sendotp = async (req, res) => {

    try {
        //fetch email form req ki body
        const { email } = req.body;

        //check if userr alreay exist
        const checkUserPresent = await User.findOne({ email });
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: 'User already rergistered',
            })
        }

        //generate otp

        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log("OTP generated ", otp);


        //check unique otp or not
        let result = await OTP.findOne({ otp: otp });
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({ otp: otp });
        }


        const otpPayload = { email, otp };


        //create an entry for otp
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);
        // const otpEntry = await OTP.create({ email, otp });
        console.log("OTP saved to DB:", otpBody);


        //return response successfully
        res.status(200).json({
            success: true,
            message: 'OTP sent Successfull',
            otp,
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }

};



//sign up


exports.signup = async (req, res) => {

    try {

        //data fetch from request ki body

        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;


        console.log("fetch kr liya jee");
        //validation kr lp

        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: "All fields are reequired",
            });
        }

        console.log("Validation ho gya");
        //2 password match krlo

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password and confirmpassword value does not match,please try again',
            });
        }

        console.log("passwordbhi ho gya");
        //check user alreadyexist or not

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User is already registered',
            });
        }
        console.log("fexisting user check kr liya");
        //find most recent otp  stored for the user

        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        console.log(recentOtp);

        //vaildate otp
        console.log("Incoming email:", email);
        console.log("Incoming OTP:", otp);
        console.log("Recent OTP found in DB:", recentOtp);

        if (recentOtp.length === 0) {
            //otp not found
            return res.status(400).json({
                success: false,
                message: 'otp is not vaild',
            });
        } else if (otp !== recentOtp[0].otp.toString()) {
            //invalid otp
            return res.status(400).json({
                success: false,
                message: 'otp is ...not matching ',
            });

        }


        //hash password 

        const hashedPassword = await bcrypt.hash(password, 10);

        //entry create in db

        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });



        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}${lastName}`,
        })

        //return res
        return res.status(200).json({
            success: true,
            message: 'User is registered successfully',
            user,
        });

    } catch (error) {
        console.log(error);
        console.log("error kya hai? batao..")
        return res.status(500).json({
            success: false,
            message: "User cannot be registered.Please try again",
        });


    }

};


//login

exports.login = async (req, res) => {
    try {

        //get data from req body
        const { email, password } = req.body;

        //validation data 
        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: 'all fields are required, please try again',
            });
        }

        //user check exist or not \
        const user = await User.findOne({ email }).populate("additionalDetails");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User is not registered,Please signup first",
            });

        }

        //generate jwt,after password matching
        if (await bcrypt.compare(password, user.password)) {

            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "2h",
            });
            user.token = token;
            user.password = undefined;

            //create cookie and send response
            const options = {
                expires: new Date(Date.now() + 3 * 34 * 60 * 60 * 1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: 'Logged in successfully',
            });
     console.log("JWT_SECRET =", process.env.JWT_SECRET); // should log "Anup"

        }
        else {
            return res.status(401).json({
                success: false,
                message: 'Passworrd is incorrect',
            });
        }



    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'login failure,please try again later',
        });
    }
};


//changepassword

//TODO:Homework
exports.changePassword = async (req, res) => {
    try {
       //get data from req body
const userDetails = await User.findById(req.user.id);

    //getoldpassword, newpassword, confirmpassword
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    //validaation
    const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {

			return res
				.status(401)
				.json({ success: false, message: "The password is incorrect" });
		}
        if (newPassword !== confirmNewPassword) {
			// If new password and confirm new password do not match, return a 400 (Bad Request) error
			return res.status(400).json({
				success: false,
				message: "The password and confirm password does not match",
			});
		}

		// Match new password and old password
		if (newPassword === oldPassword) {
			// If new password and confirm new password do not match, return a 400 (Bad Request) error
			return res.status(400).json({
				success: false,
				message: "Use a new password",
			});
		}

    //update pwd in db
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

    //send mail - password updated
    try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}


    //return response
    		return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });

          
    } catch (error) {
	// If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
    }
};



