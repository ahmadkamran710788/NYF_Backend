import express from 'express';
import { 
  createDeal, 
  getDealsByActivity, 
  getDealById, 
  updateDeal, 
  deleteDeal,
  getDealsPricingByActivityAndDate,
  getBestDealPricing,
  getAllDeals,
  addBulkDealPricing,
  updateBulkDealPricing,
  deleteBulkDealPricing
} from '../controllers/Deal';
import upload from "../middleware/uploadMiddleware";

const router = express.Router();

router.post('/',upload.single("image"),createDeal);
router.get('/', getAllDeals);  
router.get('/activity/:activityId', getDealsByActivity);
router.get('/:dealId', getDealById);
router.put('/:dealId', updateDeal);
router.delete('/:dealId', deleteDeal);
router.get('/activity/:activityId/pricing', getDealsPricingByActivityAndDate);
router.get('/:dealId/pricing', getBestDealPricing);
router.post('/:dealId/pricing/bulk', addBulkDealPricing);
router.put('/:dealId/pricing/bulk', updateBulkDealPricing);
router.delete('/:dealId/pricing/bulk', deleteBulkDealPricing);

export default router;