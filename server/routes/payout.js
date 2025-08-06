// routes/payout.js
import express from "express";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// GET /api/payout/restaurant/:id
router.get("/restaurant/:id", authMiddleware, async (req, res) => {
  try {
    // This is a mock response for now
    // In a real implementation, this would fetch data from the database
    const mockPayoutData = {
      earnings: {
        daily: 125.50,
        weekly: 876.25,
        monthly: 3245.75
      },
      pending: 245.30,
      history: [
        { id: 1, amount: 325.75, date: '2023-06-15', status: 'completed' },
        { id: 2, amount: 412.50, date: '2023-06-08', status: 'completed' },
        { id: 3, amount: 245.30, date: '2023-06-01', status: 'pending' }
      ],
      commission: {
        rate: 15, // percentage
        breakdown: [
          { id: 1, orderId: 'ORD-001', subtotal: 45.00, commission: 6.75, date: '2023-06-15' },
          { id: 2, orderId: 'ORD-002', subtotal: 32.50, commission: 4.88, date: '2023-06-15' },
          { id: 3, orderId: 'ORD-003', subtotal: 78.25, commission: 11.74, date: '2023-06-14' }
        ]
      }
    };

    res.json(mockPayoutData);
  } catch (err) {
    console.error("Error fetching payout data:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;