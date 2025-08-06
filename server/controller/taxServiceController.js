import TaxService from "../models/TaxService.js";

// Get all tax and service fees
export const getAllTaxServices = async (req, res) => {
  try {
    const taxServices = await TaxService.find({});
    res.status(200).json(taxServices);
  } catch (error) {
    console.error("Error fetching tax services:", error);
    res.status(500).json({ message: "Failed to fetch tax services", error: error.message });
  }
};

// Get tax and service fees by type
export const getTaxServicesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const taxServices = await TaxService.find({ type, isActive: true });
    res.status(200).json(taxServices);
  } catch (error) {
    console.error(`Error fetching ${req.params.type} services:`, error);
    res.status(500).json({ message: `Failed to fetch ${req.params.type} services`, error: error.message });
  }
};

// Create a new tax or service fee
export const createTaxService = async (req, res) => {
  try {
    const { name, type, value, valueType, description, distanceRange, timeRange, applicableRegions, isActive } = req.body;
    
    // Validate required fields
    if (!name || !type || value === undefined || !valueType) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Create new tax/service fee
    const newTaxService = new TaxService({
      name,
      type,
      value,
      valueType,
      description,
      isActive: isActive !== undefined ? isActive : true,
      distanceRange,
      timeRange,
      applicableRegions,
      createdBy: req.user?._id, // Safely access user ID
      updatedBy: req.user?._id
    });
    
    await newTaxService.save();
    res.status(201).json(newTaxService);
  } catch (error) {
    console.error("Error creating tax service:", error);
    res.status(500).json({ message: "Failed to create tax service", error: error.message });
  }
};

// Update a tax or service fee
export const updateTaxService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, value, valueType, description, isActive, distanceRange, timeRange, applicableRegions } = req.body;
    
    // Find and update the tax/service fee
    const updatedTaxService = await TaxService.findByIdAndUpdate(
      id,
      {
        name,
        type,
        value,
        valueType,
        description,
        isActive,
        distanceRange,
        timeRange,
        applicableRegions,
        updatedBy: req.user?._id // Safely access user ID
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedTaxService) {
      return res.status(404).json({ message: "Tax service not found" });
    }
    
    res.status(200).json(updatedTaxService);
  } catch (error) {
    console.error("Error updating tax service:", error);
    res.status(500).json({ message: "Failed to update tax service", error: error.message });
  }
};

// Delete a tax or service fee
export const deleteTaxService = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedTaxService = await TaxService.findByIdAndDelete(id);
    
    if (!deletedTaxService) {
      return res.status(404).json({ message: "Tax service not found" });
    }
    
    res.status(200).json({ message: "Tax service deleted successfully" });
  } catch (error) {
    console.error("Error deleting tax service:", error);
    res.status(500).json({ message: "Failed to delete tax service", error: error.message });
  }
};

// Calculate applicable taxes and fees for an order
export const calculateOrderFees = async (req, res) => {
  try {
    const { subtotal, distance, region, time } = req.body;
    
    // Get all active taxes and fees
    const allFees = await TaxService.find({ isActive: true });
    
    // Initialize result object
    const result = {
      subtotal,
      taxes: [],
      fees: [],
      total: subtotal
    };
    
    // Process each fee
    for (const fee of allFees) {
      // Skip if region-specific and not applicable to this region
      if (fee.applicableRegions && fee.applicableRegions.length > 0 && 
          !fee.applicableRegions.includes(region)) {
        continue;
      }
      
      // Skip if distance-specific and not in range
      if (fee.distanceRange && 
          ((fee.distanceRange.min !== undefined && distance < fee.distanceRange.min) || 
           (fee.distanceRange.max !== undefined && distance > fee.distanceRange.max))) {
        continue;
      }
      
      // Skip if time-specific and not in range
      if (fee.timeRange && fee.timeRange.startTime && fee.timeRange.endTime) {
        const orderTime = time || new Date().toTimeString().slice(0, 5); // Format: "HH:MM"
        if (orderTime < fee.timeRange.startTime || orderTime > fee.timeRange.endTime) {
          continue;
        }
      }
      
      // Calculate fee amount
      let amount = 0;
      let description = fee.description || "";
      
      // Handle distance-based calculations
      if (fee.description && fee.description.toLowerCase().includes("per km") && distance) {
        // For distance-based fees, multiply the value by the distance
        if (fee.valueType === "fixed") {
          amount = fee.value * distance;
          description = `${fee.description} (${distance} km)`;
        } else {
          // For percentage-based distance fees
          amount = (subtotal * fee.value * distance) / 100;
          description = `${fee.description} (${distance} km)`;
        }
      } else {
        // Standard calculation for non-distance based fees
        if (fee.valueType === "percentage") {
          amount = (subtotal * fee.value) / 100;
        } else { // fixed
          amount = fee.value;
        }
      }
      
      // Add to appropriate category
      if (fee.type === "tax") {
        result.taxes.push({
          name: fee.name,
          amount,
          description: description
        });
      } else { // platform_fee or delivery_fee
        result.fees.push({
          name: fee.name,
          type: fee.type,
          amount,
          description: description
        });
      }
      
      // Add to total
      result.total += amount;
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error calculating order fees:", error);
    res.status(500).json({ message: "Failed to calculate order fees", error: error.message });
  }
};