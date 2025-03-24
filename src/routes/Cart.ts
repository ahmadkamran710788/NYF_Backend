import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart
} from "../controllers/CartController";

const router = express.Router();

router.get("/", getCart);
router.post("/add", addToCart);
router.delete("/item/:itemId", removeFromCart);
router.delete("/clear", clearCart);

export default router;