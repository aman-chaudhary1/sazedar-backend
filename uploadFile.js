const multer = require('multer');
const path = require('path');

/* =========================
   CATEGORY (LOCAL)
========================= */
const storageCategory = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './public/category'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!/\.jpe?g|\.png/.test(ext)) {
      return cb(new Error('Only jpg, jpeg, png allowed'));
    }
    cb(null, Date.now() + "_" + Math.random().toString(36).substring(7) + ext);
  }
});

const uploadCategory = multer({
  storage: storageCategory,
  limits: { fileSize: 5 * 1024 * 1024 },
});


/* =========================
   PRODUCT (LOCAL)
========================= */
const storageProduct = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './public/products'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!/\.jpe?g|\.png/.test(ext)) {
      return cb(new Error('Only jpg, jpeg, png allowed'));
    }
    cb(null, Date.now() + "_" + file.originalname);
  }
});

const uploadProduct = multer({
  storage: storageProduct,
  limits: { fileSize: 5 * 1024 * 1024 },
});


/* =========================
   POSTER (CLOUDINARY)
========================= */
const storagePoster = multer.memoryStorage(); // 🔥 IMPORTANT

const uploadPosters = multer({
  storage: storagePoster,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* =========================
   USER PROFILE IMAGE (CLOUDINARY)
========================= */
const storageUserProfile = multer.memoryStorage();

const uploadUserProfile = multer({
  storage: storageUserProfile,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

module.exports = {
  uploadCategory,
  uploadProduct,
  uploadPosters,
  uploadUserProfile,
};



// const multer = require('multer');
// const path = require('path');

// const storageCategory = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, './public/category');
//   },
//   filename: function(req, file, cb) {
//     // Check file type based on its extension
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (extname) {
//       cb(null, Date.now() + "_" + Math.floor(Math.random() * 1000) + path.extname(file.originalname));
//     } else {
//       cb("Error: only .jpeg, .jpg, .png files are allowed!");
//     }
//   }
// });

// const uploadCategory = multer({
//   storage: storageCategory,
//   limits: {
//     fileSize: 1024 * 1024 * 5 // limit filesize to 5MB
//   },
// });

// const storageProduct = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, './public/products');
//   },
//   filename: function(req, file, cb) {
//     // Check file type based on its extension
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (extname) {
//       cb(null, Date.now() + "_" + file.originalname);
//     } else {
//       cb("Error: only .jpeg, .jpg, .png files are allowed!");
//     }
//   }
// });

// const uploadProduct = multer({
//   storage: storageProduct,
//   limits: {
//     fileSize: 1024 * 1024 * 5 // limit filesize to 5MB
//   },
// });


// const storagePoster = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, './public/posters');
//   },
//   filename: function(req, file, cb) {
//     // Check file type based on its extension
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (extname) {
//       cb(null, Date.now() + "_" + file.originalname);
//     } else {
//       cb("Error: only .jpeg, .jpg, .png files are allowed!");
//     }
//   }
// });

// const uploadPosters = multer({
//   storage: storagePoster,
//   limits: {
//     fileSize: 1024 * 1024 * 5 // limit filesize to 5MB
//   },
// });

// module.exports = {
//     uploadCategory,
//     uploadProduct,
//     uploadPosters,
// };
