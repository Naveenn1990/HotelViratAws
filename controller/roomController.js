const Room = require("../model/Room");
const asyncHandler = require("express-async-handler");
const { uploadFile2, deleteFile } = require("../middleware/AWS");
const path = require("path");
const fs = require("fs");

// Upload images helper
const uploadImages = async (files) => {
  const imageUrls = [];
  
  for (const file of files) {
    try {
      console.log("Processing file:", file.originalname, "Size:", file.size, "Type:", file.mimetype);
      
      // Try S3 upload first
      const url = await uploadFile2(file.buffer, file.originalname, file.mimetype);
      if (url) {
        console.log("S3 upload successful:", url);
        imageUrls.push(url);
      } else {
        // Fallback to local storage
        console.log("S3 failed, using local storage...");
        const uploadDir = path.join(__dirname, "..", "uploads", "rooms");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `room-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, file.buffer);
        const localUrl = `uploads/rooms/${filename}`;
        console.log("Local storage successful:", localUrl);
        imageUrls.push(localUrl);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      // Still try local storage on error
      try {
        const uploadDir = path.join(__dirname, "..", "uploads", "rooms");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `room-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, file.buffer);
        imageUrls.push(`uploads/rooms/${filename}`);
      } catch (localError) {
        console.error("Local storage also failed:", localError);
      }
    }
  }
  
  return imageUrls;
};

// Create Room
const createRoom = asyncHandler(async (req, res) => {
  try {
    console.log("=== CREATE ROOM ===");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    
    const { branchId, floor, roomType, price, description, amenities, capacity, roomNumber } = req.body;

    if (!branchId || !floor || !price) {
      return res.status(400).json({ message: "Branch, floor and price are required" });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      console.log("Uploading", req.files.length, "images...");
      images = await uploadImages(req.files.slice(0, 5)); // Max 5 images
      console.log("Uploaded images:", images);
    }

    const parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
    const parsedCapacity = typeof capacity === 'string' ? JSON.parse(capacity) : capacity;

    const room = new Room({
      branchId,
      floor: floor || 'First Floor',
      roomType: roomType || 'Single',
      price: Number(price),
      description,
      images,
      amenities: parsedAmenities || {},
      capacity: parsedCapacity || { adults: 2, children: 0 },
      roomNumber,
    });

    const createdRoom = await room.save();
    res.status(201).json(createdRoom);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all rooms
const getRooms = asyncHandler(async (req, res) => {
  try {
    const { branchId } = req.query;
    const filter = branchId ? { branchId } : {};
    const rooms = await Room.find(filter).populate('branchId', 'name');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get room by ID
const getRoomById = asyncHandler(async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('branchId', 'name');
    if (room) {
      res.json(room);
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update room
const updateRoom = asyncHandler(async (req, res) => {
  try {
    const { floor, roomType, price, description, amenities, capacity, roomNumber, isAvailable, existingImages } = req.body;
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Handle existing images
    let images = [];
    if (existingImages) {
      images = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
    }

    // Upload new images
    if (req.files && req.files.length > 0) {
      const newImages = await uploadImages(req.files.slice(0, 5 - images.length));
      images = [...images, ...newImages].slice(0, 5);
    }

    const updateData = {
      floor: floor || room.floor,
      roomType: roomType || room.roomType,
      price: price ? Number(price) : room.price,
      description: description !== undefined ? description : room.description,
      images: images.length > 0 ? images : room.images,
      roomNumber: roomNumber !== undefined ? roomNumber : room.roomNumber,
      isAvailable: isAvailable !== undefined ? isAvailable === 'true' || isAvailable === true : room.isAvailable,
    };

    if (amenities) {
      updateData.amenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
    }
    if (capacity) {
      updateData.capacity = typeof capacity === 'string' ? JSON.parse(capacity) : capacity;
    }

    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedRoom);
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete room
const deleteRoom = asyncHandler(async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Delete images
    for (const imageUrl of room.images) {
      await deleteFile(imageUrl);
    }

    await Room.deleteOne({ _id: req.params.id });
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
};
