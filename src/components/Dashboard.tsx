
// Let's fix the if statement that's always truthy at line 306
// First let's update the filter function for locations and any other property filters

// Apply location filter - fix the truthy expression
if (filters.locations && filters.locations.length > 0) {
  data = data.filter(item => filters.locations.includes(item["Calculated Location"]));
}

// Apply product filter
if (filters.products && filters.products.length > 0) {
  data = data.filter(item => filters.products.includes(item["Cleaned Product"]));
}

// Apply category filter
if (filters.categories && filters.categories.length > 0) {
  data = data.filter(item => filters.categories.includes(item["Cleaned Category"]));
}

// Apply seller filter
if (filters.sellers && filters.sellers.length > 0) {
  data = data.filter(item => filters.sellers.includes(item["Sold By"]));
}

// Apply payment method filter
if (filters.paymentMethods && filters.paymentMethods.length > 0) {
  data = data.filter(item => filters.paymentMethods.includes(item["Payment Method"]));
}
