/**
 * Development seed data for Crystal Zone.
 *
 *   npm run seed            add the sample categories, products, demo customers and reviews
 *   npm run seed:destroy    remove everything the seed created (do this before you launch)
 *
 * Safe to run again and again: anything that already exists is skipped, never overwritten.
 * It never touches admin accounts, real customers, real orders, or products you created yourself.
 * It refuses to run when NODE_ENV=production (add --force only if you really mean it).
 */
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { Cart, Category, Product, Review, Setting, User, Wishlist } from '../models/index.js';
import { CATEGORIES, DEMO_CUSTOMERS, PRODUCTS, REVIEWS } from './seedData.js';

/** Adds the sample data. Expects an open database connection. Returns how many of each thing was created. */
export async function seedDatabase() {
  const created = { categories: 0, products: 0, customers: 0, reviews: 0 };

  await Setting.getStore(); // store settings with their defaults

  // Categories (reused if one with the same name already exists)
  const categoryIds = new Map();
  for (const [index, def] of CATEGORIES.entries()) {
    let category = await Category.findOne({ name: def.name });
    if (!category) {
      category = await Category.create({ name: def.name, description: def.description, sortOrder: index });
      created.categories += 1;
    }
    categoryIds.set(def.name, category._id);
  }

  // Products: create() (never insertMany) so the model works out slug, discount and final price.
  for (const def of PRODUCTS) {
    if (await Product.exists({ sku: def.sku })) continue;
    const { category, ...fields } = def;
    await Product.create({ ...fields, category: categoryIds.get(category) });
    created.products += 1;
  }

  // Demo customers: a random password nobody ever sees, so nobody can log in as them.
  const customers = new Map();
  for (const def of DEMO_CUSTOMERS) {
    let user = await User.findOne({ email: def.email });
    if (!user) {
      user = await User.create({
        name: def.name,
        email: def.email,
        phone: def.phone,
        password: `${crypto.randomBytes(24).toString('hex')}aA1`,
        role: 'customer',
      });
      created.customers += 1;
    }
    customers.set(def.email, { user, display: def.display });
  }

  // Reviews (saving each one updates the product's average rating and review count)
  for (const def of REVIEWS) {
    const product = await Product.findOne({ sku: def.sku });
    const customer = customers.get(def.email);
    if (!product || !customer) continue;
    if (await Review.exists({ product: product._id, user: customer.user._id })) continue;

    await Review.create({
      product: product._id,
      user: customer.user._id,
      order: new mongoose.Types.ObjectId(), // sample reviews have no real order behind them
      name: customer.display,
      rating: def.rating,
      comment: def.comment,
    });
    created.reviews += 1;
  }

  return created;
}

/** Removes only what the seed created. Expects an open database connection. */
export async function destroySeedData() {
  const skus = PRODUCTS.map((p) => p.sku);
  const emails = DEMO_CUSTOMERS.map((c) => c.email);

  const productIds = (await Product.find({ sku: { $in: skus } }).select('_id')).map((p) => p._id);
  const userIds = (await User.find({ email: { $in: emails }, role: 'customer' }).select('_id')).map((u) => u._id);

  const reviews = await Review.deleteMany({ $or: [{ user: { $in: userIds } }, { product: { $in: productIds } }] });
  await Cart.updateMany({ 'items.product': { $in: productIds } }, { $pull: { items: { product: { $in: productIds } } } });
  await Wishlist.updateMany({ products: { $in: productIds } }, { $pull: { products: { $in: productIds } } });
  const products = await Product.deleteMany({ _id: { $in: productIds } });
  const customers = await User.deleteMany({ _id: { $in: userIds } });

  // A sample category is removed only when nothing else is in it (so your own products are never orphaned).
  let categories = 0;
  for (const def of CATEGORIES) {
    const category = await Category.findOne({ name: def.name });
    if (category && !(await Product.exists({ category: category._id }))) {
      await category.deleteOne();
      categories += 1;
    }
  }

  return { categories, products: products.deletedCount, customers: customers.deletedCount, reviews: reviews.deletedCount };
}

async function main() {
  const destroy = process.argv.includes('--destroy');

  if (env.isProd && !process.argv.includes('--force')) {
    console.error(
      '\nRefusing to run: NODE_ENV is "production". Seed data is made-up sample data meant for development.\n' +
        'If you really want it on this database, add --force.\n'
    );
    process.exit(1);
  }

  await connectDB();
  try {
    if (destroy) {
      const removed = await destroySeedData();
      console.log(
        `\nSeed data removed: ${removed.products} products, ${removed.categories} categories, ` +
          `${removed.customers} demo customers, ${removed.reviews} reviews.\n`
      );
    } else {
      const added = await seedDatabase();
      console.log(
        `\nSeed complete. Added ${added.categories} categories, ${added.products} products, ` +
          `${added.customers} demo customers and ${added.reviews} sample reviews.`
      );
      console.log('Open the store to see them. Run "npm run seed:destroy" to remove them before you launch.\n');
    }
  } finally {
    await disconnectDB();
  }
}

// Run only when started from the command line (the tests import the two functions above instead).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (err) => {
    console.error(`\nSeed failed: ${err.message}\n`);
    try {
      await disconnectDB();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
}