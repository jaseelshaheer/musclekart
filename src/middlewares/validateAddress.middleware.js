export const validateAddress = (req, res, next) => {
  let { name, phone, country, house, district, state, pincode } = req.body;

  name = name?.trim();
  phone = phone?.trim();
  house = house?.trim();
  country = country?.trim();
  district = district?.trim();
  state = state?.trim();
  pincode = pincode?.trim();

  if (!name || !house || !country || !district || !state) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be filled"
    });
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number"
    });
  }

  if (!/^[0-9]{6}$/.test(pincode)) {
    return res.status(400).json({
      success: false,
      message: "Invalid pincode"
    });
  }

  next();
};
