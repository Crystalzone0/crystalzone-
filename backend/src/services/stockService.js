import Product from '../models/Product.js';
import AppError from '../utils/AppError.js';

/**
 * Inventory is only ever changed with atomic, conditional MongoDB updates:
 *
 *   findOneAndUpdate({ _id, stock: { $gte: quantity }, ... }, { $inc: { stock: -quantity } })
 *
 * MongoDB applies that to one document as a single operation, so two customers buying the last
 * item at the same moment cannot both succeed. This works on local MongoDB and Atlas alike
 * (no transactions needed).
 */

/** Works out why a reservation failed so the customer gets a precise message. */
async function explainFailure(line) {
  const product = await Product.findById(line.productId).select('isActive stock');

  let message;
  if (!product || !product.isActive) {
    message = `"${line.name}" is no longer available`;
  } else if (product.stock <= 0) {
    message = `"${line.name}" just went out of stock`;
  } else if (product.stock < line.quantity) {
    message = `Only ${product.stock} of "${line.name}" left in stock`;
  } else {
    message = `The price of "${line.name}" just changed. Please review your cart and try again.`;
  }

  return new AppError(message, 409, [{ productId: String(line.productId), message }]);
}

/**
 * Restores stock (order cancelled, or a checkout failed half-way).
 * Never throws: it tries every line and returns the ones that failed, so one problem cannot
 * stop the remaining products from being restored.
 */
export async function restoreStock(lines) {
  const failed = [];

  for (const line of lines) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await Product.updateOne(
        { _id: line.productId },
        { $inc: { stock: line.quantity, soldCount: -line.quantity } }
      );
      // soldCount is a popularity counter and must never go below zero.
      // eslint-disable-next-line no-await-in-loop
      await Product.updateOne({ _id: line.productId, soldCount: { $lt: 0 } }, { $set: { soldCount: 0 } });
    } catch (err) {
      failed.push(line);
      console.error(`CRITICAL: could not restore ${line.quantity} unit(s) of product ${line.productId}:`, err.message);
    }
  }

  return failed;
}

/**
 * Reduces stock for every line, or for none of them.
 * lines: [{ productId, name, quantity, price, salePrice }]
 *
 * Each product is updated only if it is still active, still has enough stock, and still has the
 * price the order was calculated with. If any line fails, the lines already reserved are given
 * back and an AppError (HTTP 409) explains exactly what happened.
 */
export async function reserveStock(lines) {
  const reserved = [];

  try {
    for (const line of lines) {
      // eslint-disable-next-line no-await-in-loop
      const updated = await Product.findOneAndUpdate(
        {
          _id: line.productId,
          isActive: true,
          stock: { $gte: line.quantity },
          price: line.price,
          salePrice: line.salePrice ?? null, // null also matches products without a sale price
        },
        { $inc: { stock: -line.quantity, soldCount: line.quantity } },
        { new: true, projection: { _id: 1 } }
      );

      if (!updated) {
        // eslint-disable-next-line no-await-in-loop
        throw await explainFailure(line);
      }
      reserved.push(line);
    }
  } catch (err) {
    await restoreStock(reserved);
    throw err;
  }
}