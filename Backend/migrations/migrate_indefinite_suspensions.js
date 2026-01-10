#!/usr/bin/env node
const { connectDB } = require('../util/database');
const { User } = require('../Model/userRoleModel');

// Usage examples:
// node migrate_indefinite_suspensions.js --action=setDefault --days=365 --confirm
// node migrate_indefinite_suspensions.js --action=unsuspend --confirm

const args = process.argv.slice(2);
const parsed = {};
args.forEach(arg => {
  const [k, v] = arg.split('=');
  const key = k.replace(/^--/, '');
  parsed[key] = v === undefined ? true : v;
});

(async function() {
  try {
    await connectDB();

    const action = parsed.action || 'setDefault';
    const days = parseInt(parsed.days || '365', 10) || 365;
    const confirm = parsed.confirm || false;

    const indefiniteUsers = await User.find({ isSuspended: true, suspensionEndDate: null });

    console.log(`Found ${indefiniteUsers.length} suspended users with NULL end date`);
    if (indefiniteUsers.length === 0) {
      console.log('Nothing to migrate. Exiting.');
      process.exit(0);
    }

    if (!confirm) {
      console.log('\nDRY RUN - No changes made. To apply changes, re-run with --confirm');
      console.log(`Planned action: ${action}${action === 'setDefault' ? ` (set end date to today + ${days} days)` : ''}`);
      indefiniteUsers.slice(0,5).forEach(u => console.log(` - ${u.username} (${u._id})`));
      process.exit(0);
    }

    if (action === 'unsuspend') {
      const ids = indefiniteUsers.map(u => u._id);
      const res = await User.updateMany({ _id: { $in: ids } }, { $set: { isSuspended: false, suspensionEndDate: null, suspensionReason: null } });
      console.log(`Unsuspended ${res.modifiedCount || res.nModified || 0} users`);
      process.exit(0);
    }

    // setDefault
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end.setDate(end.getDate() + days);

    const ids = indefiniteUsers.map(u => u._id);
    const res = await User.updateMany({ _id: { $in: ids } }, { $set: { suspensionEndDate: end } });
    console.log(`Updated ${res.modifiedCount || res.nModified || 0} users with end date ${end.toISOString().split('T')[0]}`);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
})();
