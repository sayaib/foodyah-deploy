import express from "express";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});
router.get("/invoice/:customerId/:amount", async (req, res) => {
  try {
    const { customerId, amount } = req.params;

    let totalAmount = Number(amount);

    // 1. Check for latest existing invoice
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 1,
    });

    if (invoices.data.length > 0) {
      let invoice = invoices.data[0];

      if (invoice.status === "draft") {
        invoice = await stripe.invoices.finalizeInvoice(invoice.id);
      }

      return res.json({
        message: "Existing invoice found",
        hosted_url: invoice.hosted_invoice_url,
        pdf_url: invoice.invoice_pdf,
        status: invoice.status,
      });
    }

    // 2. Create draft invoice first
    let invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: false,
    });

    // 3. Attach invoice item directly to this invoice
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(totalAmount),
      currency: "usd",
      description: "One-time service fee",
      invoice: invoice.id,
    });

    // 4. Finalize invoice
    invoice = await stripe.invoices.finalizeInvoice(invoice.id);

    res.json({
      message: "New invoice created",
      hosted_url: invoice.hosted_invoice_url,
      pdf_url: invoice.invoice_pdf,
      status: invoice.status,
    });
  } catch (error) {
    console.error("Invoice API error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payment/create-checkout-session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { cartItems, finalTotal } = req.body;
    console.log(req.body);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "samsung_pay"],
      line_items: cartItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: Math.round(finalTotal * 100),
        },
        quantity: item.quantity,
      })),
      customer_creation: "always",
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Stripe Session Error:", error.message);
    res.status(500).json({ error: "Payment session creation failed" });
  }
});

// GET /api/payment/session-info/:sessionId
router.get("/session-info/:sessionId", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId,
      {
        expand: ["customer_details"],
      }
    );
    res.json(session);
  } catch (err) {
    console.error("Session fetch error:", err.message);
    res.status(400).json({ error: "Failed to fetch session details" });
  }
});

// GET /api/payment/session-info/:sessionId

export default router;
