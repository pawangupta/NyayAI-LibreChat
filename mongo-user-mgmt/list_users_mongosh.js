// Run via: docker exec chat-mongodb mongosh --quiet LibreChat /tmp/list_users_mongosh.js
var SEP = "--------------------------------------------------------------------";
var users = db.users.find({}, {
  email: 1, name: 1, username: 1, role: 1, provider: 1,
  company_name: 1, company_slug: 1, banned: 1, emailVerified: 1,
  totpEnabled: 1, createdAt: 1, updatedAt: 1
}).sort({ createdAt: 1 }).toArray();

print("\nNyayAI LibreChat - User Registry");
print(SEP);

users.forEach(function(u, i) {
  print("");
  print("  #" + (i + 1));
  print("  ID             : " + u._id);
  print("  Email          : " + (u.email || "N/A"));
  print("  Name           : " + (u.name || "N/A"));
  print("  Username       : " + (u.username || "N/A"));
  print("  Role           : " + (u.role || "N/A"));
  print("  Provider       : " + (u.provider || "N/A"));
  print("  Company Name   : " + (u.company_name || "N/A"));
  print("  Company Slug   : " + (u.company_slug || "N/A"));
  print("  Banned         : " + (u.banned !== undefined ? u.banned : "N/A"));
  print("  Email Verified : " + (u.emailVerified !== undefined ? u.emailVerified : "N/A"));
  print("  2FA Enabled    : " + (u.totpEnabled !== undefined ? u.totpEnabled : "N/A"));
  print("  Created        : " + (u.createdAt ? u.createdAt.toISOString() : "N/A"));
  print("  Updated        : " + (u.updatedAt ? u.updatedAt.toISOString() : "N/A"));
  print(SEP);
});

print("");
print("Total users: " + users.length);
print("");
