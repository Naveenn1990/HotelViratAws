const Branch = require("../model/Branch")
const asyncHandler = require("express-async-handler")
const fs = require("fs")
const path = require("path")
const { uploadFile2, deleteFile } = require("../middleware/AWS")

// Import RestaurantProfile model for cross-app sync
let RestaurantProfile;
try {
  RestaurantProfile = require("../../../crm/crm_backend/Restaurant/RestautantModel/RestaurantProfileModel");
} catch (e) {
  console.warn("RestaurantProfile model not found - cross-app sync disabled:", e.message);
}

// Ensure upload directory exists
const ensureUploadDir = () => {
  const uploadDir = path.join(__dirname, "..", "uploads", "branch")
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
    console.log("Created upload directory:", uploadDir)
  }
}

const createBranch = asyncHandler(async (req, res) => {
  try {
    console.log("Request body:", req.body)
    console.log("Request file:", req.file)

    // Ensure upload directory exists
    // ensureUploadDir()

    if (!req.body) {
      res.status(400)
      throw new Error("Request body is missing")
    }

    const { name, gstNumber, address, contact, openingHours, _id } = req.body
    
    // Handle image upload - always use local storage for reliability
    let image = null;
    if (req.file) {
      // Always use local storage path
      if (req.file.path) {
        const uploadsIndex = req.file.path.indexOf('uploads');
        image = uploadsIndex !== -1 ? req.file.path.substring(uploadsIndex).replace(/\\/g, '/') : req.file.path;
        console.log("Using local file path:", image);
      }
      
      // Try S3 upload as backup (optional)
      try {
        const fileBuffer = req.file.path ? await fs.promises.readFile(req.file.path) : req.file.buffer;
        if (fileBuffer) {
          const s3Url = await uploadFile2(fileBuffer, req.file.originalname, req.file.mimetype);
          if (s3Url) {
            console.log("Image also uploaded to S3:", s3Url);
            // Keep local file - don't delete it
          }
        }
      } catch (error) {
        console.warn("S3 upload failed, using local storage only:", error.message);
      }
    }

    if (!name || !address) {
      res.status(400)
      throw new Error("Name and address are required")
    }

    // Create branch data object
    const branchData = { name, gstNumber, address, image };
    
    // Parse contact and openingHours if they're JSON strings
    if (contact) {
      branchData.contact = typeof contact === 'string' ? JSON.parse(contact) : contact;
    }
    if (openingHours) {
      branchData.openingHours = typeof openingHours === 'string' ? JSON.parse(openingHours) : openingHours;
    }
    
    // If _id is provided (from dual backend sync), use it
    if (_id) {
      branchData._id = _id;
      console.log("Using provided _id for sync:", _id);
    }

    const branch = new Branch(branchData)
    const createdBranch = await branch.save()

    console.log("Branch created successfully:", createdBranch)
    res.status(201).json(createdBranch)
  } catch (error) {
    console.error("Error in createBranch:", error)
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
})

const getBranches = asyncHandler(async (req, res) => {
  try {
    const branches = await Branch.find({})
    res.json(branches)
  } catch (error) {
    console.error("Error in getBranches:", error)
    res.status(500).json({ message: error.message })
  }
})

const getBranchById = asyncHandler(async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)

    if (branch) {
      res.json(branch)
    } else {
      res.status(404)
      throw new Error("Branch not found")
    }
  } catch (error) {
    console.error("Error in getBranchById:", error)
    res.status(500).json({ message: error.message })
  }
})

const updateBranch = asyncHandler(async (req, res) => {
  try {
    console.log("Update request body:", req.body)
    console.log("Update request file:", req.file)

    // Ensure upload directory exists
    // ensureUploadDir()

    if (!req.body) {
      res.status(400)
      throw new Error("Request body is missing")
    }

    const { name, address, gstNumber, contact, openingHours } = req.body
    const updateData = { name, address, gstNumber }
    
    // Parse contact and openingHours if they're JSON strings
    if (contact) {
      updateData.contact = typeof contact === 'string' ? JSON.parse(contact) : contact;
    }
    if (openingHours) {
      updateData.openingHours = typeof openingHours === 'string' ? JSON.parse(openingHours) : openingHours;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key])

    // If a new image is uploaded, update the image path
    if (req.file) {
      // Always use local storage path
      if (req.file.path) {
        const uploadsIndex = req.file.path.indexOf('uploads');
        updateData.image = uploadsIndex !== -1 ? req.file.path.substring(uploadsIndex).replace(/\\/g, '/') : req.file.path;
        console.log("Using local file path:", updateData.image);
      }
      
      // Try S3 upload as backup (optional)
      try {
        const fileBuffer = req.file.path ? await fs.promises.readFile(req.file.path) : req.file.buffer;
        if (fileBuffer) {
          const s3Url = await uploadFile2(fileBuffer, req.file.originalname, req.file.mimetype);
          if (s3Url) {
            console.log("Image also uploaded to S3:", s3Url);
            // Keep local file - don't delete it
          }
        }
      } catch (error) {
        console.warn("S3 upload failed, using local storage only:", error.message);
      }
    }

    const updatedBranch = await Branch.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })

    if (!updatedBranch) {
      res.status(404)
      throw new Error("Branch not found")
    }

    // Also update RestaurantProfile model for WaveCRM compatibility
    if (RestaurantProfile) {
      try {
        const restaurantUpdateData = {
          branchName: updatedBranch.name,
          restaurantName: updatedBranch.name,
          gstNumber: updatedBranch.gstNumber,
          image: updatedBranch.image,
        };
        
        // Parse address if it's a string
        if (typeof updatedBranch.address === 'string') {
          const parts = updatedBranch.address.split(',').map(p => p.trim());
          if (parts.length >= 3) {
            restaurantUpdateData.address = {
              street: parts.slice(0, -3).join(', '),
              city: parts[parts.length - 3] || "",
              state: parts[parts.length - 2] || "",
              country: parts[parts.length - 1] || ""
            };
          } else {
            restaurantUpdateData.address = {
              street: updatedBranch.address,
              city: "",
              state: "",
              country: ""
            };
          }
        }
        
        if (updatedBranch.contact) {
          restaurantUpdateData.contact = updatedBranch.contact;
        }
        if (updatedBranch.openingHours) {
          restaurantUpdateData.openingHours = updatedBranch.openingHours;
        }
        
        await RestaurantProfile.findByIdAndUpdate(req.params.id, restaurantUpdateData, {
          new: true,
          runValidators: true,
        });
        console.log("✅ Also updated RestaurantProfile model");
      } catch (syncError) {
        console.warn("⚠️ Failed to sync with RestaurantProfile:", syncError.message);
        // Continue even if sync fails
      }
    }

    console.log("Branch updated successfully:", updatedBranch)
    res.json(updatedBranch)
  } catch (error) {
    console.error("Error in updateBranch:", error)
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
})

const deleteBranch = asyncHandler(async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)

    if (!branch) {
      res.status(404)
      throw new Error("Branch not found")
    }

    // Delete the associated image file
    if (branch.image) {
      await deleteFile(branch.image)
    }

    await Branch.deleteOne({ _id: req.params.id })
    
    // Also delete from RestaurantProfile model for WaveCRM compatibility
    if (RestaurantProfile) {
      try {
        await RestaurantProfile.deleteOne({ _id: req.params.id });
        console.log("✅ Also deleted from RestaurantProfile model");
      } catch (syncError) {
        console.warn("⚠️ Failed to delete from RestaurantProfile:", syncError.message);
        // Continue even if sync fails
      }
    }
    
    res.json({ message: "Branch removed successfully" })
  } catch (error) {
    console.error("Error in deleteBranch:", error)
    res.status(500).json({ message: error.message })
  }
})

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
}
