import express from 'express';
import { globalSearch } from '../controllers/GlobalController';

const router = express.Router();


router.get('/', globalSearch);
export default router;