
const express =require("express");
const dotenv = require("dotenv");
dotenv.config();
const app =express();


const userRoutes =require("./routes/User");
const profileRoutes =require("./routes/Profile");
const paymentRoutes =require("./routes/Payment");
const courseRoutes =require("./routes/Course");

const database =require("./config/database");
const cookieParser = require("cookie-parser");
const cors =require("cors");
const {cloudinaryConnect} =require("./config/cloudinary");
const fileUpload =require("express-fileupload");
// const dotenv = require("dotenv");

const PORT  = process.env.PORT || 4000;

//databse connect
database.connect();


//middleware
app.use(express.json());
app.use(cookieParser());
// app.use(
//     cors({
//         origin:"http://localhost:3000",

//         credentials:true,
//     })
// )


// const allowedOrigins = [
//     "http://localhost:3000",
//   "https://study-verse-frontend.vercel.app",
//   process.env.FRONTEND_URL?.replace(/\/$/, "")
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     // Allow requests with no origin (like server-to-server or REST tools)
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// }));

app.use(
	cors({
		origin: "https://study-verse-frontend.vercel.app",
    
		credentials:true,
	         methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 allowedHeaders: ["Content-Type", "Authorization"],
	})
)
// ✅ Handle preflight (OPTIONS) requests for all routes
// app.options("*", cors());

app.use(
    fileUpload({
        useTempFiles:true,
        tempFileDir:"/tmp",
    })
)

//cloudinary connection
cloudinaryConnect();

app.use("/api/v1/auth",userRoutes);
app.use("/api/v1/profile",profileRoutes);
app.use("/api/v1/course",courseRoutes);
app.use("/api/v1/payment",paymentRoutes);

//default route

app.get("/",(req,res)=>{
    return res.json({
        success:true,
        message:`your server is up and running... `
    });
})

app.listen(PORT, ()=>{
    console.log(`App is running at ${PORT}`)
})

// module.exports = app;