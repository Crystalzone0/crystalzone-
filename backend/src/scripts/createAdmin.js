/**
 * Creates the first (or any additional) admin account.
 * Run from the project root:   npm run create-admin
 *
 * The password is typed into the terminal (hidden) and is never stored in a file, an env
 * variable or shell history. This can only be run by someone with access to your server/computer.
 */
import readline from 'node:readline';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import {
  nameSchema,
  emailSchema,
  phoneSchema,
  passwordSchema,
} from '../validators/authValidators.js';

const isTTY = Boolean(process.stdin.isTTY);

function ask(rl, question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    if (!hidden || !isTTY) {
      rl.question(question, resolve);
      return;
    }
    // Hidden input: print the question ourselves and suppress echo of typed characters.
    process.stdout.write(question);
    const originalWrite = rl._writeToOutput;
    rl._writeToOutput = (text) => {
      if (text.includes('\n') || text.includes('\r')) process.stdout.write('\n');
    };
    rl.question('', (answer) => {
      rl._writeToOutput = originalWrite;
      resolve(answer);
    });
  });
}

async function askValid(rl, label, schema, options) {
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const answer = await ask(rl, label, options);
    const result = schema.safeParse(answer);
    if (result.success) return result.data;
    console.log(`  ${result.error.issues[0].message}`);
  }
}

async function main() {
  await connectDB();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: isTTY,
  });

  try {
    console.log('\nCrystal Zone: create admin account\n');

    const email = await askValid(rl, 'Admin email: ', emailSchema);

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role === 'admin') {
        console.log(`\n${email} is already an admin. Nothing to do.`);
        return;
      }
      const answer = (
        await ask(rl, `\n${email} already has a customer account. Promote it to admin? (y/N): `)
      )
        .trim()
        .toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        await User.updateOne({ _id: existing._id }, { role: 'admin', isActive: true });
        console.log(`\nDone. ${email} is now an admin.`);
      } else {
        console.log('\nCancelled. No changes made.');
      }
      return;
    }

    const name = await askValid(rl, 'Full name: ', nameSchema);
    const phone = await askValid(rl, 'Phone: ', phoneSchema);

    let password;
    for (;;) {
      // eslint-disable-next-line no-await-in-loop
      password = await askValid(rl, 'Password (min 8 chars, letters + numbers): ', passwordSchema, {
        hidden: true,
      });
      // eslint-disable-next-line no-await-in-loop
      const confirm = await ask(rl, 'Confirm password: ', { hidden: true });
      if (confirm === password) break;
      console.log('  Passwords do not match. Try again.');
    }

    await User.create({ name, email, phone, password, role: 'admin' });
    console.log(`\nAdmin created: ${email}`);
    console.log('You can now log in at /admin/login on your site.');
  } finally {
    rl.close();
    await disconnectDB();
  }
}

main().catch(async (err) => {
  console.error(`\nFailed: ${err.message}\n`);
  try {
    await disconnectDB();
  } catch {
    /* ignore */
  }
  process.exit(1);
});