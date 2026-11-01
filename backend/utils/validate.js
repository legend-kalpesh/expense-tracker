// Small reusable validation helpers.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// True only for real calendar dates written as YYYY-MM-DD
const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const isPositiveInt = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

// Used with router.param('id', ...) so every :id in the URL is checked once.
const validateIdParam = (req, res, next, value) => {
  if (!isPositiveInt(value)) {
    return res.status(400).json({ message: 'Invalid id in URL' });
  }
  next();
};

module.exports = { EMAIL_REGEX, isValidDate, isPositiveInt, validateIdParam };
