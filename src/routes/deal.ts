import express from 'express';
import { 
  createDeal, 
  getDealsByActivity, 
  getDealById, 
  updateDeal, 
  deleteDeal,
  getDealsPricingByActivityAndDate,
  getBestDealPricing
} from '../controllers/Deal';

const router = express.Router();

router.post('/', createDeal);
router.get('/activity/:activityId', getDealsByActivity);
router.get('/:dealId', getDealById);
router.put('/:dealId', updateDeal);
router.delete('/:dealId', deleteDeal);
router.get('/activity/:activityId/pricing', getDealsPricingByActivityAndDate);
router.get('/:dealId/pricing', getBestDealPricing);

export default router;