const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dynamic destination based on field name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/others/';
    const field = file.fieldname;

    // Car images
    if (
      ['front_image', 'rear_image', 'side_image', 'interior_front_image', 'interior_back_image'].includes(field)
    ) {
      folder = 'uploads/cars/';
    } 
    // Car documents
    else if (
      ['registration_certificate', 'insurance_certificate', 'pollution_certificate'].includes(field)
    ) {
      folder = 'uploads/documents/';
    }
    // Driver documents & profile image
    else if (
      ['license', 'pan_card', 'aadhaar', 'bank_passbook'].includes(field)
    ) {
      folder = 'uploads/drivers/';
    }
    // User profile image
    else if (field === 'profile_image') {
      // Check if user or driver - add tag to route if needed
      folder = req.user?.role === 'driver' ? 'uploads/drivers/' : 'uploads/profiles/';
    }

    // Ensure folder exists
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

// Accept JPG, PNG for images; PDF, JPG, PNG for documents
const fileFilter = (req, file, cb) => {
  const imageFields = [
    'front_image', 'rear_image', 'side_image', 'interior_front_image', 'interior_back_image',
    'profile_image'
  ];

  const docFields = [
    'registration_certificate', 'insurance_certificate', 'pollution_certificate',
    'license', 'pan_card', 'aadhaar', 'bank_passbook'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (imageFields.includes(file.fieldname)) {
    if (/jpeg|jpg|png/.test(ext) && /image\/jpeg|image\/png/.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  } else if (docFields.includes(file.fieldname)) {
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
