const Category = require("../models/Category");
const Course =require("../models/Course");
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }

//creeate tag ka handler funciton 

exports.createCategory =async (req,res) =>{
    try{

        //fetch data
   const {name,description} =req.body;
   //validation
    if(!name || !description){
        return res.status(400).json({
            success:false,
            message:'All fields are required',
        })

    }

    // create entry in db
    const categoryDetails = await Category.create({
        name:name,
        description :description,
    });
    console.log(categoryDetails);
    //return response

    return res.status(200).json({
        success:true,
        message:"category created successfully",
    });
    
    } catch(error){
        return res.status(500).json({
            success: false,
            message:error.message,

        })
    }
}


//getAlltags handler function

exports.showAllCategories =  async (req,res) =>{
    try{

        const allCategories = await Category.find({}, {name:true,description:true});
         
        res.status(200).json({
            success:true,
            message:"All categories returned successfully",
            allCategories,
        })

    } catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }


}

// category page details



// exports.categoryPageDetails = async (req, res) => {
//     try {
//       const { categoryId } = req.body
//       console.log("PRINTING CATEGORY ID: ", categoryId);
//       // Get courses for the specified category
//       const selectedCategory = await Category.findById(categoryId)
//         .populate({
//           path: "courses",
//           match: { status: "Published" },
//           populate: "ratingAndReviews",
//         })
//         .exec()
  
//       //console.log("SELECTED COURSE", selectedCategory)
//       // Handle the case when the category is not found
//       if (!selectedCategory) {
//         console.log("Category not found.")
//         return res
//           .status(404)
//           .json({ success: false, message: "Category not found" })
//       }
//       // Handle the case when there are no courses
//       if (selectedCategory.courses.length === 0) {
//         console.log("No courses found for the selected category.")
//         return res.status(404).json({
//           success: false,
//           message: "No courses found for the selected category.",
//         })
//       }
  
//       // Get courses for other categories
//       const categoriesExceptSelected = await Category.find({
//         _id: { $ne: categoryId },
//       })
//       let differentCategory = await Category.findOne(
//         categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
//           ._id
//       )
//         .populate({
//           path: "courses",
//           match: { status: "Published" },
//         })
//         .exec()
//         //console.log("Different COURSE", differentCategory)
//       // Get top-selling courses across all categories
//       const allCategories = await Category.find()
//         .populate({
//           path: "courses",
//           match: { status: "Published" },
//           populate: {
//             path: "instructor",
//         },
//         })
//         .exec()
//       const allCourses = allCategories.flatMap((category) => category.courses)
//       const mostSellingCourses = allCourses
//         .sort((a, b) => b.sold - a.sold)
//         .slice(0, 10)
//        // console.log("mostSellingCourses COURSE", mostSellingCourses)
//       res.status(200).json({
//         success: true,
//         data: {
//           selectedCategory,
//           differentCategory,
//           mostSellingCourses,
//         },
//       })
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message: "Internal server error",
//         error: error.message,
//       })
//     }
//   }

exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;
    console.log("📌 PRINTING CATEGORY ID: ", categoryId);

    // Get courses for the specified category
    // const selectedCategory = await Category.findById(categoryId)
    //   .populate({
    //     path: "courses",
    //     // match: { status: "Published" },
    //     populate: "ratingAndReviews",
    //   })
    //   .exec();

      const selectedCategory = await Category.findById(categoryId).lean();

// const courses = await Course.find({ category: categoryId })
//   .populate("ratingAndReviews");
  const courses = await Course.find({
  category: categoryId,
  status: "Published", // ✅ filter directly in query
}).populate("ratingAndReviews");


selectedCategory.courses = courses; // manually attach

if (!courses || courses.length === 0) {
  console.log("❌ No courses found for the selected category.");
  return res.status(404).json({
    success: false,
    message: "No courses found for the selected category.",
  });
}


    // if (!selectedCategory) {
    //   console.log("❌ Category not found.");
    //   return res.status(404).json({
    //     success: false,
    //     message: "Category not found",
    //   });
    // }

    // if (!selectedCategory.courses || selectedCategory.courses.length === 0) {
    //   console.log("❌ No courses found for the selected category.");
    //   return res.status(404).json({
    //     success: false,
    //     message: "No courses found for the selected category.",
    //   });
    // }

    // Get other categories (excluding current one)
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId },
    });

    // Helper function for random index
    // function getRandomInt(max) {
    //   return Math.floor(Math.random() * max);
    // }

    let differentCategory = null;
    if (categoriesExceptSelected.length > 0) {
      const randomIndex = getRandomInt(categoriesExceptSelected.length);
      const randomCategoryId = categoriesExceptSelected[randomIndex]._id;

      differentCategory = await Category.findById(randomCategoryId)
        .populate({
          path: "courses",
          // match: { status: "Published" },
        })
        .exec();
    }

    // Get top-selling courses across all categories
    const allCategories = await Category.find().populate({
      path: "courses",
      // match: { status: "Published" },
      populate: {
        path: "instructor",
      },
    }).exec();

    const allCourses = allCategories.flatMap((category) => category.courses || []);
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    // Final response
    res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses,
      },
    });

  } catch (error) {
    console.error("❌ SERVER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
