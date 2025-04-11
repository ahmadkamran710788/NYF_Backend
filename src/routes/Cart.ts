import express from "express";
import {
  getOrCreateCart, 
  addItemToCart, 
  removeItemFromCart, 
  updateCartItem, 
  clearCart,
  checkoutCart
} from "../controllers/CartController";

const router = express.Router();

router.get('/get-cart-item/:cartId?', getOrCreateCart);
// Cart operations
// router.get('/:cartId?', getOrCreateCart);
router.post('/cart-item/:cartId?', addItemToCart);


router.delete('/:cartId/items/:itemIndex', removeItemFromCart);

router.put('/:cartId/items/:itemIndex', updateCartItem);

router.delete('/:cartId', clearCart);

// Checkout
router.post('/:cartId/checkout', checkoutCart);

export default router;

