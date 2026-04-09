import HTTP_STATUS from "../constants/httpStatus.js";

export const validateProductPayload = (req, res, next) => {
  try {
    const { product_name, category_id, brand_id, variants } = req.body;

    if (!product_name || !product_name.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Product name is required"
      });
    }

    if (product_name.trim().length > 120) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Product name must be 120 characters or fewer"
      });
    }

    if (req.body.description && req.body.description.trim().length > 1000) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Description must be 1000 characters or fewer"
      });
    }

    if (req.body.specifications && req.body.specifications.trim().length > 2000) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Specifications must be 2000 characters or fewer"
      });
    }

    if (!category_id || !category_id.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Category is required"
      });
    }

    if (!brand_id || !brand_id.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Brand is required"
      });
    }

    if (!variants) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "At least one variant is required"
      });
    }

    let parsedVariants;

    try {
      parsedVariants = JSON.parse(variants);
    } catch{
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid variants data"
      });
    }

    if (!Array.isArray(parsedVariants) || !parsedVariants.length) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "At least one variant is required"
      });
    }

    for (const variant of parsedVariants) {
      if (!Array.isArray(variant.attributes) || !variant.attributes.length) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Each variant must include at least one attribute"
        });
      }

      if (variant.price === undefined || Number(variant.price) <= 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Each variant must have valid price"
        });
      }

      if (variant.stock === undefined || Number(variant.stock) < 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Each variant must have valid stock"
        });
      }

      const existingMainImageCount = variant.existing_main_image ? 1 : 0;
      const existingGalleryCount = Array.isArray(variant.existing_gallery_images)
        ? variant.existing_gallery_images.length
        : 0;

      const uploadedMainImageCount = req.files?.main_images?.length ? 1 : 0;
      const newGalleryCount = Number(variant.new_gallery_count || variant.gallery_count || 0);

      const totalImageCount =
        existingMainImageCount + existingGalleryCount + uploadedMainImageCount + newGalleryCount;

      if (totalImageCount < 3) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Each variant must include at least 3 images"
        });
      }

      for (const attr of variant.attributes) {
        if (!attr.type || !attr.type.trim() || !attr.value || !attr.value.trim()) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: "Variant attributes must include both type and value"
          });
        }

        if (attr.type.trim().length > 30) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: "Variant attribute name must be 30 characters or fewer"
          });
        }

        if (attr.value.trim().length > 50) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: "Variant attribute value must be 50 characters or fewer"
          });
        }
      }
    }

    next();
  } catch{
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid product payload"
    });
  }
};
