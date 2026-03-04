const express = require("express")
const router = express.Router()
const mobileStaffOrderController = require("../controller/mobileStaffOrderController")

// Mobile app specific route - creates order and updates table status to reserved
router.post("/create-guest-order", mobileStaffOrderController.createMobileGuestOrder)

// Mobile app specific route - updates existing order with additional items
router.put("/:id/add-items", mobileStaffOrderController.updateMobileGuestOrderItems)

module.exports = router
