const Branch = require("../model/Branch")
const Category = require("../model/Category")
const asyncHandler = require("express-async-handler")

// Get only branches that have restaurant categories
const getRestaurantBranches = asyncHandler(async (req, res) => {
  try {
    console.log("🍽️ Fetching branches with restaurant categories...")
    
    // First, let's see ALL categories to debug
    const allCategories = await Category.find({})
    console.log("📊 Total categories in DB:", allCategories.length)
    console.log("📊 All category names:", allCategories.map(c => c.name))
    console.log("📊 Sample category branch data:", allCategories.slice(0, 3).map(c => ({
      name: c.name,
      branchId: c.branchId,
      branch: c.branch
    })))
    
    // Find all categories where name contains "restaurant" (case-insensitive)
    const restaurantCategories = await Category.find({
      name: { $regex: /restaurant/i }
    })
    
    console.log("📊 Total restaurant categories found:", restaurantCategories.length)
    console.log("📊 Restaurant category names:", restaurantCategories.map(c => c.name))
    
    if (restaurantCategories.length === 0) {
      console.log("⚠️ No restaurant categories found - checking if any categories exist at all")
      return res.json([])
    }
    
    // Extract unique branch IDs from restaurant categories
    // Handle both branchId (string) and branch.id (nested object)
    const branchIdsWithRestaurantCategories = [...new Set(
      restaurantCategories
        .map(cat => {
          // Try branchId first, then branch.id
          if (cat.branchId) return cat.branchId.toString()
          if (cat.branch && cat.branch.id) return cat.branch.id.toString()
          return null
        })
        .filter(id => id) // Remove null/undefined
    )]
    
    console.log("📊 Unique branch IDs with restaurant categories:", branchIdsWithRestaurantCategories)
    
    if (branchIdsWithRestaurantCategories.length === 0) {
      console.log("⚠️ No branches with restaurant categories found")
      return res.json([])
    }
    
    // Get all branches that have restaurant categories
    const restaurantBranches = await Branch.find({
      _id: { $in: branchIdsWithRestaurantCategories }
    })
    
    console.log("🍽️ Restaurant branches found:", restaurantBranches.length)
    console.log("✅ Branch names:", restaurantBranches.map(b => b.name))
    
    res.json(restaurantBranches)
  } catch (error) {
    console.error("❌ Error in getRestaurantBranches:", error)
    res.status(500).json({ message: error.message })
  }
})

module.exports = {
  getRestaurantBranches
}
