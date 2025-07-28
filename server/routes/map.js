import express from "express";
import {
  addUserAddress,
  getUserAddresses,
  setDefaultAddress,
  deleteAddress,
} from "../controller/mapController.js";

const router = express.Router();

router.post("/address", addUserAddress);
router.get("/getAddress/:id", getUserAddresses);
router.put("/address/:id/:addressId/default", setDefaultAddress);
router.delete("/address/:id/:addressId", deleteAddress);

export default router;
