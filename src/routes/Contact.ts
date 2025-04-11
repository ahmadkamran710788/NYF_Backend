

import express from 'express';
import { 
    submitContactForm,
    getContactSubmissions
} from '../controllers/ContactController';

const router = express.Router();

router.post('/submit', submitContactForm);
router.get('/submissions',  getContactSubmissions);
export default router;