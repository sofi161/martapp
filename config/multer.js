const multer = require("multer");

// Use memory storage — keeps files in memory as Buffer
const storage = multer.memoryStorage();

// File filter - only allow image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValidMime = allowedTypes.test(file.mimetype);
  if (isValidMime) cb(null, true);
  else cb(new Error("Only image files are allowed!"));
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
  fileFilter: fileFilter,
});

module.exports = upload;
