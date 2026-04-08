import multer from "multer";

const storage = multer.memoryStorage();

const ALLOWED_EXT = /\.(jpg|jpeg|png)$/i;
const ALLOWED_MIME = ["image/jpeg", "image/png"];

function imageFileFilter(req, file, cb) {
  const isExtOk = ALLOWED_EXT.test(file.originalname || "");
  const isMimeOk = ALLOWED_MIME.includes(file.mimetype);

  if (!isExtOk || !isMimeOk) {
    return cb(new Error("Only .jpg, .jpeg and .png files are allowed"));
  }

  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

export default upload;
