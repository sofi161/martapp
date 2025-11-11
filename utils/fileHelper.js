const fs = require("fs");
const path = require("path");

exports.deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, "..", "public", filePath);
  fs.unlink(fullPath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    }
  });
};

exports.deleteFiles = (filePaths) => {
  filePaths.forEach((filePath) => {
    this.deleteFile(filePath);
  });
};
