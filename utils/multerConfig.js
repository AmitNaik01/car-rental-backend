// utils/multerConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dynamic destination based on field name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/others/';
    const field = file.fieldname;

    // Decide folder based on type of upload
    if (
      ['front_image', 'rear_image', 'side_image', 'interior_front_image', 'interior_back_image'].includes(field)
    ) {
      folder = 'uploads/cars/';
    } else if (
      ['registration_certificate', 'insurance_certificate', 'pollution_certificate'].includes(field)
    ) {
      folder = 'uploads/documents/';
    }

    // Ensure folder exists
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

// Accept JPG, PNG, and PDF for documents, images only for car images
const fileFilter = (req, file, cb) => {
  const imageFields = ['front_image', 'rear_image', 'side_image', 'interior_front_image', 'interior_back_image'];
  const docFields = ['registration_certificate', 'insurance_certificate', 'pollution_certificate'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (imageFields.includes(file.fieldname)) {
    // Only allow images
    if (/jpeg|jpg|png/.test(ext) && /image\/jpeg|image\/png/.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed for car images'));
    }
  } else if (docFields.includes(file.fieldname)) {
    // Allow image and PDF files for documents
    if (/jpeg|jpg|png|pdf/.test(ext) && /image\/jpeg|image\/png|application\/pdf/.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG allowed for documents'));
    }
  } else {
    cb(new Error('Unknown field for file upload'));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
