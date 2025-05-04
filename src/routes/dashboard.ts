import express from 'express';
import { 
    getDashboardSummary
} from '../controllers/DashboardController';
import upload from "../middleware/uploadMiddleware";

const router = express.Router();


router.get('/', getDashboardSummary);  


export default router;