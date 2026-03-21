import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";

import cloudinary from "../../config/cloudinary.js";

function uploadImage(buffer) {

  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(
      { folder: "musclekart/products" },
      (error, result) => {

        if (error) return reject(error);

        resolve(result.secure_url);

      }
    );

    stream.end(buffer);

  });

}

export const getProductsService = async ({
  page = 1,
  limit = 10,
  search = ""
 }) => {

  const pageNumber = parseInt(page) || 1;
  const limitNumber = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage = {
    isDeleted: false,
    product_name: { $regex: search, $options: "i" }
  };

  const products = await Product.aggregate([

    { $match: matchStage },

    {
        $lookup: {
            from: "variants",
            let: { productId: "$_id" },
            pipeline: [
            {
                $match: {
                $expr: { $eq: ["$product_id", "$$productId"] },
                isDeleted: false
                }
            }
            ],
            as: "variants"
        }
    },

    {
      $lookup: {
        from: "categories",
        localField: "category_id",
        foreignField: "_id",
        as: "category"
      }
    },

    {
      $lookup: {
        from: "brands",
        localField: "brand_id",
        foreignField: "_id",
        as: "brand"
      }
    },

    {
      $addFields: {

        category: { $arrayElemAt: ["$category", 0] },
        brand: { $arrayElemAt: ["$brand", 0] },

        min_price: { $min: "$variants.price" },

        max_price: { $max: "$variants.price" },

        total_stock: { $sum: "$variants.stock_qty" },

        main_image: { $arrayElemAt: ["$variants.main_image", 0] }

      }
    },

    {
      $project: {
        product_name: 1,
        isActive: 1,
        category: "$category.name",
        brand: "$brand.name",
        min_price: 1,
        max_price: 1,
        total_stock: 1,
        main_image: 1,
        createdAt: 1
      }
    },

    { $sort: { createdAt: -1 } },

    { $skip: skip },

    { $limit: limitNumber }

  ]);

  const totalProducts = await Product.countDocuments(matchStage);

  return {
    products,
    totalProducts,
    currentPage: Number(pageNumber),
    totalPages: Math.ceil(totalProducts / limitNumber)
  };

};

export const getProductByIdService = async (productId) => {
  const product = await Product.findOne({
    _id: productId,
    isDeleted: false
  }).lean();

  if (!product) {
    throw new Error("Product not found");
  }

  const variants = await Variant.find({
    product_id: productId,
    isDeleted: false
  })
    .sort({ createdAt: 1 })
    .lean();

  return {
    ...product,
    variants
  };
};


export const createProductService = async (data, files) => {

  const {
    product_name,
    description,
    specifications,
    category_id,
    brand_id,
  } = data;

  const parsedVariants = JSON.parse(data.variants);

  if (!Array.isArray(parsedVariants) || !parsedVariants.length) {
    throw new Error("At least one variant is required");
  }

  if (!product_name?.trim()) {
    throw new Error("Product name is required");
  }

  if (!category_id) {
    throw new Error("Category is required");
  }

  if (!brand_id) {
    throw new Error("Brand is required");
  }



  const product = await Product.create({
    product_name,
    description,
    specifications,
    category_id,
    brand_id
  });

  const mainImages = files.main_images || [];
  const galleryImages = files.gallery_images || [];

  let mainIndex = 0;
  let galleryIndex = 0;

  const variantDocs = await Promise.all(

    parsedVariants.map(async (v) => {

      let mainImageUrl = null;

      if (mainImages[mainIndex]) {

        mainImageUrl = await uploadImage(
          mainImages[mainIndex].buffer
        );

        mainIndex++;

      }

      const galleryUrls = [];

      for (let i = 0; i < v.new_gallery_count; i++) {

        if (galleryImages[galleryIndex]) {

          const url = await uploadImage(
            galleryImages[galleryIndex].buffer
          );

          galleryUrls.push(url);

          galleryIndex++;

        }

      }

      const totalImages = (mainImageUrl ? 1 : 0) + galleryUrls.length;

      if (totalImages < 3) {
        throw new Error("Each variant must include at least 3 images");
      }


      return {
        product_id: product._id,
        price: v.price,
        stock_qty: v.stock,
        main_image: mainImageUrl,
        gallery_images: galleryUrls,
        attributes: v.attributes
      };

    })

  );

  await Variant.insertMany(variantDocs);

  return product;

};


export const updateProductService = async (productId, data, files) => {
  const {
    product_name,
    description,
    specifications,
    category_id,
    brand_id,
    isActive
  } = data;

  const parsedVariants = JSON.parse(data.variants);

  if (!Array.isArray(parsedVariants) || !parsedVariants.length) {
    throw new Error("At least one variant is required");
  }


  const existingProduct = await Product.findOne({
    product_name: { $regex: `^${product_name}$`, $options: "i" },
    _id: { $ne: productId },
    isDeleted: false
  });

  if (existingProduct) {
    throw new Error("Product name already exists");
  }

  if (!product_name?.trim()) {
    throw new Error("Product name is required");
  }

  if (!category_id) {
    throw new Error("Category is required");
  }

  if (!brand_id) {
    throw new Error("Brand is required");
  }



  const product = await Product.findByIdAndUpdate(
    productId,
    {
      product_name,
      description,
      specifications,
      category_id,
      brand_id,
      isActive
    },
    { new: true }
  );

  if (!product) {
    throw new Error("Product not found");
  }

  await Variant.updateMany(
    { product_id: productId, isDeleted: false },
    {
      isDeleted: true,
      deletedAt: new Date()
    }
  );

  const mainImages = files.main_images || [];
  const galleryImages = files.gallery_images || [];

  let mainIndex = 0;
  let galleryIndex = 0;

  const variantDocs = await Promise.all(
    parsedVariants.map(async (v) => {
      let mainImageUrl = v.existing_main_image || null;

      if (mainImages[mainIndex]) {
        mainImageUrl = await uploadImage(mainImages[mainIndex].buffer);
        mainIndex++;
      }

      const galleryUrls = [...(v.existing_gallery_images || [])];

      for (let i = 0; i < v.new_gallery_count; i++) {
        if (galleryImages[galleryIndex]) {
          const url = await uploadImage(galleryImages[galleryIndex].buffer);
          galleryUrls.push(url);
          galleryIndex++;
        }
      }

      const totalImages = (mainImageUrl ? 1 : 0) + galleryUrls.length;

      if (totalImages < 3) {
        throw new Error("Each variant must include at least 3 images");
      }


      return {
        product_id: productId,
        price: v.price,
        stock_qty: v.stock,
        main_image: mainImageUrl,
        gallery_images: galleryUrls,
        attributes: v.attributes
      };
    })
  );

  await Variant.insertMany(variantDocs);

  return product;
};



export const deleteProductService = async (productId) => {

  const product = await Product.findByIdAndUpdate(
    productId,
    {
      isDeleted: true,
      deletedAt: new Date()
    },
    { new: true }
  );

  await Variant.updateMany(
    { product_id: productId },
    {
      isDeleted: true,
      deletedAt: new Date()
    }
  );

  return product;
};


export const toggleProductStatusService = async (productId) => {

  const product = await Product.findOne({
    _id: productId,
    isDeleted: false
    });

  if (!product) {
    throw new Error("Product not found");
  }

  product.isActive = !product.isActive;

  await product.save();

  return product;
};
