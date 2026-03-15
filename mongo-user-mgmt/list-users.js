/**
 * NyayAI — List All LibreChat Users with Full Metadata
 *
 * Usage:
 *   node config/list-users.js              # human-readable table (default)
 *   node config/list-users.js --json       # pretty-print full JSON
 *   node config/list-users.js --company X  # filter by company_name
 *   node config/list-users.js --csv        # CSV rows to stdout
 *
 * Run from the NyayAI-LibreChat root directory.
 */

const path = require('path');
require('module-alias/register');
const moduleAlias = require('module-alias');
moduleAlias.addAlias('~', path.resolve(__dirname, '..', 'api'));

const mongoose = require('mongoose');
const { User } = require('@librechat/data-schemas').createModels(mongoose);
const connect = require('../config/connect');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const asJson  = args.includes('--json');
const asCsv   = args.includes('--csv');
const companyFilter = (() => {
  const idx = args.indexOf('--company');
  return idx !== -1 ? args[idx + 1] : null;
})();

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v) => (v !== undefined && v !== null && v !== '') ? String(v) : 'N/A';
const fmtDate = (d) => d ? new Date(d).toISOString() : 'N/A';
const fmtBool = (b) => (b === true ? 'yes' : b === false ? 'no' : 'N/A');
const separator = '━'.repeat(72);
const thin      = '─'.repeat(72);

// ── Main ──────────────────────────────────────────────────────────────────────
const listUsers = async () => {
  try {
    await connect();

    const query = companyFilter ? { company_name: companyFilter } : {};

    // Fetch every field — use lean() for plain JS objects
    const users = await User.find(query).lean().sort({ createdAt: 1 });

    if (asJson) {
      // Strip hashed passwords from JSON output for safety
      const safe = users.map(({ password, __v, ...rest }) => rest);
      console.log(JSON.stringify(safe, null, 2));
      console.error(`\nTotal: ${users.length} user(s)`);
      return process.exit(0);
    }

    if (asCsv) {
      const cols = [
        'id','email','name','username','role','provider',
        'company_name','company_slug','banned','emailVerified',
        'createdAt','updatedAt',
      ];
      console.log(cols.join(','));
      users.forEach((u) => {
        const row = [
          u._id,
          u.email,
          u.name,
          u.username,
          u.role,
          u.provider,
          u.company_name,
          u.company_slug,
          u.banned,
          u.emailVerified,
          fmtDate(u.createdAt),
          fmtDate(u.updatedAt),
        ].map((v) => `"${fmt(v).replace(/"/g, '""')}"`);
        console.log(row.join(','));
      });
      console.error(`\nTotal: ${users.length} user(s)`);
      return process.exit(0);
    }

    // ── Human-readable ────────────────────────────────────────────────────────
    console.log(`\n${separator}`);
    console.log('  NyayAI LibreChat — User Registry');
    if (companyFilter) console.log(`  Filter: company_name = "${companyFilter}"`);
    console.log(`${separator}\n`);

    // Group by company for readability
    const byCompany = {};
    users.forEach((u) => {
      const key = u.company_name || '(no company)';
      (byCompany[key] = byCompany[key] || []).push(u);
    });

    let idx = 0;
    for (const [company, members] of Object.entries(byCompany).sort()) {
      console.log(`\n🏢  Company: ${company}  (${members.length} user${members.length !== 1 ? 's' : ''})`);
      console.log(thin);

      members.forEach((u) => {
        idx++;
        console.log(`  #${idx}`);
        console.log(`    ID              : ${u._id}`);
        console.log(`    Email           : ${fmt(u.email)}`);
        console.log(`    Name            : ${fmt(u.name)}`);
        console.log(`    Username        : ${fmt(u.username)}`);
        console.log(`    Role            : ${fmt(u.role)}`);
        console.log(`    Provider        : ${fmt(u.provider)}`);
        console.log(`    Company Name    : ${fmt(u.company_name)}`);
        console.log(`    Company Slug    : ${fmt(u.company_slug)}`);
        console.log(`    Banned          : ${fmtBool(u.banned)}`);
        console.log(`    Email Verified  : ${fmtBool(u.emailVerified)}`);
        console.log(`    2FA Enabled     : ${fmtBool(u.totpEnabled)}`);
        console.log(`    Created         : ${fmtDate(u.createdAt)}`);
        console.log(`    Updated         : ${fmtDate(u.updatedAt)}`);

        // Any extra fields that aren't the common ones (future-proof)
        const known = new Set([
          '_id','id','email','name','username','role','provider','avatar',
          'company_name','company_slug','banned','emailVerified','totpEnabled',
          'password','refreshToken','passwordResetToken','passwordResetExpires',
          'verificationToken','createdAt','updatedAt','__v',
        ]);
        const extra = Object.entries(u).filter(([k]) => !known.has(k));
        if (extra.length) {
          console.log(`    Extra Fields:`);
          extra.forEach(([k, v]) => {
            const display = typeof v === 'object' ? JSON.stringify(v) : String(v);
            console.log(`      ${k.padEnd(16)}: ${display}`);
          });
        }
        console.log('');
      });
    }

    console.log(separator);
    console.log(`  Total users: ${users.length}  |  Companies: ${Object.keys(byCompany).length}`);
    console.log(`${separator}\n`);

    process.exit(0);
  } catch (err) {
    console.error('\nError listing users:', err.message);
    process.exit(1);
  }
};

listUsers();
