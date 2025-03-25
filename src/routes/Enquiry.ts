import express from 'express';
import { 
  createEnquiry, 
  getAllEnquiries, 
  updateEnquiryStatus, 
  getPackagePrice 
} from '../controllers/Enquiry';


const router = express.Router();

// Public route to submit an enquiry
router.post('/', createEnquiry);

// Public route to get package price
router.get('/package-price/:packageId', getPackagePrice);

// Admin routes (protected)
router.get('/', getAllEnquiries);
router.patch('/:id/status', updateEnquiryStatus);

export default router;