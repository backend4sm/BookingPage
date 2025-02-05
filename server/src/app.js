import { app } from "./index";
import axiosClient from "./utils/axiosClient";

app.use();

// Get Room Availability & Prices
app.get("/api/availability", async (req, res) => {
  try {
    const response = await axiosClient("availability");

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching availability:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

// Process Booking & Payment
app.post("/api/book", async (req, res) => {
  const { roomId, checkIn, checkOut, token } = req.body;

  // Check if room is already booked
  const existingBooking = await Booking.findOne({ roomId, checkIn });
  if (existingBooking)
    return res.status(400).json({ error: "Room is already booked" });

  try {
    // Fetch Room Price
    const availabilityResponse = await axiosClient("availability");

    const room = availabilityResponse.data.find((r) => r.id === roomId);
    if (!room) return res.status(400).json({ error: "Room not found" });

    const price = room.price;

    // Process Payment with Stripe
    const charge = await stripe.charges.create({
      amount: price * 100, // Convert to cents
      currency: "usd",
      source: token,
      description: `Booking for room ${roomId} from ${checkIn} to ${checkOut}`,
    });

    // If payment is successful, create Beds24 Booking
    const bookingResponse = await axiosClient.post("bookings", {
      roomId,
      checkIn,
      checkOut,
      status: "booked",
    });

    // Save Booking to MongoDB
    const newBooking = new Booking({ roomId, checkIn, checkOut });
    await newBooking.save();

    res.json({
      success: true,
      message: "Booking confirmed",
      bookingId: bookingResponse.data.id,
    });
  } catch (error) {
    console.error("Booking error:", error.response?.data || error.message);
    res.status(500).json({ error: "Booking failed" });
  }
});
