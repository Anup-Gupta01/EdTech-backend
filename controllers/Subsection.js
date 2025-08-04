const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

//create SubSection

exports.createSubSection = async (req, res) => {
    try {
        
             console.log("🔥 createSubSection HIT");
              console.log("BODY:", req.body);
  console.log("FILES:", req.files);
        //fetch data from req body
        const { sectionId, title, timeDuration, description } = req.body;

        //extract file/video
        const video = req.files?.videoFile;
        // const video =req.files.video;
        //validation
        if (!sectionId || !title  || !description || !video) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }
        //uploD VIDEO TO CLOUDINARY
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        //create subsection
        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url,
        })
        //puush section with this sub section
        const updatedSection = await Section.findByIdAndUpdate({ _id: sectionId },
            {
                $push: {
                    subSection: subSectionDetails._id,
                }
            },
            { new: true }
        ).populate("subSection")
        // HW: log updaate section after adding populate query
        //return response
        return res.status(200).json({
            success: true,
            message: 'Sub section created successfully',
            data:updatedSection,
        });

    } catch (error) {
         console.error("Error creating new sub-section:", error)
        return res.status(500).json({
            success: false,
            message: 'internalserer error',
            error: error.message,
        });
    }
};



//hW: updatesubsection
exports.updateSubSection = async (req, res) => {
    try {

        //data fetch
        const { subSectionId, title, timeDuration, description } = req.body;
        
        const subSection =await SubSection.findById(subSectionId)

        if (!subSection) {
        return res.status(404).json({
          success: false,
          message: "SubSection not found",
        })
      }
        const video = req.files.videoFile;
        //vaildation
        if (!subSectionId || !title || !timeDuration || !description || !video) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }
        //upload new video if provided
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        subSection.videoUrl = uploadDetails.secure_url
        subSection.timeDuration = `${uploadDetails.duration}`
         
        await subSection.save();

        // const updatedSection = await Section.findById(sectionId).populate("subSection")
        //update subsection
        const updatedSubSection = await SubSection.findByIdAndUpdate(subSectionId,
            {
                title,
                timeDuration,
                description,
                videoUrl: uploadDetails.secure_url,
            },
            { new: true }
        );
        //reesponse
        return res.status(200).json({
            success: true,
            message: 'Sub section updated  successfully',
            updatedSubSection,
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "unable to update subsection please try again",
            error: error.message,
        });
    }
};



//hw:delete subsection 

exports.deleteSubSection = async (req, res) => {
    try {

        //get subsection id
        const { subSectionId ,sectionId} = req.body;

        await Section.findByIdAndUpdate(
            {_id:sectionId},
            {
                $pull :{
                    subSection:subSectionId,
                },
            }
        )

        //delete by in using findanddelete function
       const subSection = await SubSection.findByIdAndDelete({_id:subSectionId});
       
        if (!subSection) {
        return res
          .status(404)
          .json({ success: false, message: "SubSection not found" })
      }
            const updatedSection = await Section.findById(sectionId).populate("subSection")
        //return res
        return res.status(200).json({
            success: true,
            data:updatedSection,
            message: "Subsection deleted successfully ",
        });




    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "unable to delete subsection please try again",
            error: error.message,
        });
    }
};