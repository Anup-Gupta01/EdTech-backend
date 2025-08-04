const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto =require("crypto");

//resetpasswwordtoken
exports.resetPasswordToken = async (req, res) => {

    try {
        // get email from req body

        const email = req.body.email;

        //check user for this email,email validation
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.json({
                success: false,
                message: 'Your email is not registered with us',

            });
        }
        //generate token
        const token = crypto.randomUUID();


        //update userr by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
            { email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 5 * 60 * 100,
            },
            { new: true }
        );
     console.log("DETAILS", updatedDetails);
        // create url 
        const url = `http://localhost:3000/update-password/${token}`

        //send mail containing the url
        await mailSender(email, "Password Reset Link",
            `password Reset Link: ${url}`,
        )
        //return response
        return res.json({
            success: true,
            message: 'Email sent successfully'
        })


    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'something went wrong while reseting password'
        });
    }

}


//resetPassword

exports.resetPassword = async (req, res) => {

    try {

        //data fetch
        const { password, confirmPassword, token } = req.body;

        //validation
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: 'password is not matching',
            });
        }

        // get userdetails from db using token

        const userDetails = await User.findOne({ token: token });
        //if no entry - invalid token
        if (!userDetails) {
            return res.json({
                success: false,
                message: 'Token to invaild hai',
            });
        }

        //token time check
        if (userDetails.resetPasswordExpires > Date.now()) {
            return res.json({
                success: false,
                message: 'token is expired,regenrate your token',
            });
        }

        //hashing password
        const hashedPassword = await bcrypt.hash(password, 10);

        //pwd update
        await User.findOneAndUpdate(
            { token: token },
            { password: hashedPassword },
            { new: true },
        );

        //return response
        return res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'something went wrong while sending reset password mail '
        });
    }
};
