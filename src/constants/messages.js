export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: "Login successful",
  LOGIN_FAILED: "Invalid email or password",
  UNAUTHORIZED: "Unauthorized access",
  SIGNUP_SUCCESS: "User registered successfully",
  OTP_SENT: "OTP sent to your email",
  OTP_VERIFIED: "Email verified successfully",
  PHONE_EXISTS: "Phone number already registered",
  EMAIL_EXISTS: "Email already registered"
};

export const USER_MESSAGES = {
  FETCH_SUCCESS: "Users fetched successfully",
  NOT_FOUND: "User not found",
  BLOCKED: "User blocked successfully",
  UNBLOCKED: "User unblocked successfully",
  INVALID_STATUS: "Invalid status value"
};

export const COMMON_MESSAGES = {
  SOMETHING_WENT_WRONG: "Something went wrong"
};

export const PRODUCT_MESSAGES = {
  NOT_FOUND: "Product not found",
  UNAVAILABLE: "Product unavailable",
  NAME_REQUIRED: "Product name is required",
  NAME_EXISTS: "Product name already exists",
  CATEGORY_REQUIRED: "Category is required",
  BRAND_REQUIRED: "Brand is required",
  AT_LEAST_ONE_VARIANT: "At least one variant is required",
  MIN_VARIANT_IMAGES: "Each variant must include at least 3 images"
};

export const CATEGORY_MESSAGES = {
  NOT_FOUND: "Category not found",
  NAME_REQUIRED: "Category name is required",
  NAME_EXISTS: "Category already exists",
  NAME_EXISTS_EDIT: "Category name already exists"
};

export const BRAND_MESSAGES = {
  NOT_FOUND: "Brand not found",
  NAME_REQUIRED: "Brand name is required",
  NAME_EXISTS: "Brand already exists"
};

export const ADDRESS_MESSAGES = {
  NOT_FOUND: "Address not found",
  NAME_REQUIRED: "Name is required",
  HOUSE_REQUIRED: "House is required",
  DISTRICT_REQUIRED: "District is required",
  STATE_REQUIRED: "State is required",
  INVALID_PHONE: "Invalid phone number",
  INVALID_PINCODE: "Invalid pincode"
};

export const VALIDATION_MESSAGES = {
  INVALID_STATUS: "Invalid status value",
  INVALID_PRODUCT_PAYLOAD: "Invalid product payload",
  INVALID_VARIANTS_DATA: "Invalid variants data"
};

export const CART_MESSAGES = {
  EMPTY: "Your cart is empty",
  ITEM_ADDED: "Item added to cart",
  ITEM_REMOVED: "Item removed from cart",
  CART_CLEARED: "Cart cleared successfully",
  ITEM_NOT_FOUND: "Cart item not found",
  PRODUCT_UNAVAILABLE: "This product is unavailable",
  VARIANT_UNAVAILABLE: "This variant is unavailable",
  OUT_OF_STOCK: "This item is out of stock",
  MAX_QTY_REACHED: "Maximum quantity limit reached",
  INVALID_QUANTITY: "Invalid quantity"
};
