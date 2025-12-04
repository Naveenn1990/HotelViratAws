const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} = require("../controller/roomController");

// Ensure uploads/rooms directory exists
const uploadDir = path.join(__dirname, "..", "uploads", "rooms");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for multiple file uploads (disk storage like menu)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/rooms");
  },
  filename: (req, file, cb) => {
    cb(null, `room-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5, // Max 5 files
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Routes - upload.array for multiple images (max 5)
router.route("/")
  .post(upload.array("images", 5), handleMulterError, createRoom)
  .get(getRooms);

router.route("/:id")
  .get(getRoomById)
  .put(upload.array("images", 5), handleMulterError, updateRoom)
  .delete(deleteRoom);

module.exports = router;
