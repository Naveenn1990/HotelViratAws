const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} = require("../controller/roomController");

// Configure Multer for multiple file uploads (memory storage for AWS)
const storage = multer.memoryStorage();

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
