const { getBalanceConfig } = require('@librechat/api');
const { FileSources } = require('librechat-data-provider');
const { getStrategyFunctions } = require('~/server/services/Files/strategies');
const { resizeAvatar } = require('~/server/services/Files/images/avatar');
const { updateUser, createUser, getUserById, findUser } = require('~/models');
const { resolveCompanyIdentity } = require('~/server/utils/company');

async function resolveUniqueTenantUsername(companySlug, username) {
  const base = String(username || 'user')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_.-]/g, '')
    .slice(0, 70) || 'user';

  let candidate = base;
  let suffix = 1;
  while (suffix < 1000) {
    const existing = await findUser({ company_slug: companySlug, username: candidate }, '_id');
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${base}-${suffix}`.slice(0, 79);
  }

  return `${base}-${Date.now().toString().slice(-6)}`.slice(0, 79);
}

/**
 * Updates the avatar URL and email of an existing user. If the user's avatar URL does not include the query parameter
 * '?manual=true', it updates the user's avatar with the provided URL. For local file storage, it directly updates
 * the avatar URL, while for other storage types, it processes the avatar URL using the specified file strategy.
 * Also updates the email if it has changed (e.g., when a Google Workspace email is updated).
 *
 * @param {IUser} oldUser - The existing user object that needs to be updated.
 * @param {string} avatarUrl - The new avatar URL to be set for the user.
 * @param {AppConfig} appConfig - The application configuration object.
 * @param {string} [email] - Optional. The new email address to update if it has changed.
 *
 * @returns {Promise<void>}
 *          The function updates the user's avatar and/or email and saves the user object. It does not return any value.
 *
 * @throws {Error} Throws an error if there's an issue saving the updated user object.
 */
const handleExistingUser = async (oldUser, avatarUrl, appConfig, email) => {
  const fileStrategy = appConfig?.fileStrategy ?? process.env.CDN_PROVIDER;
  const isLocal = fileStrategy === FileSources.local;
  const updates = {};

  let updatedAvatar = false;
  const hasManualFlag =
    typeof oldUser?.avatar === 'string' && oldUser.avatar.includes('?manual=true');

  if (isLocal && (!oldUser?.avatar || !hasManualFlag)) {
    updatedAvatar = avatarUrl;
  } else if (!isLocal && (!oldUser?.avatar || !hasManualFlag)) {
    const userId = oldUser._id;
    const resizedBuffer = await resizeAvatar({
      userId,
      input: avatarUrl,
    });
    const { processAvatar } = getStrategyFunctions(fileStrategy);
    updatedAvatar = await processAvatar({
      buffer: resizedBuffer,
      userId,
      username: oldUser.username,
      companySlug: oldUser.company_slug,
      manual: 'false',
    });
  }

  if (updatedAvatar) {
    updates.avatar = updatedAvatar;
  }

  /** Update email if it has changed */
  if (email && email.trim() !== oldUser.email) {
    updates.email = email.trim();
  }

  if (!oldUser.company_name || !oldUser.company_slug) {
    Object.assign(updates, resolveCompanyIdentity(oldUser.company_name));
  }

  if (Object.keys(updates).length > 0) {
    await updateUser(oldUser._id, updates);
  }
};

/**
 * Creates a new user with the provided user details. If the file strategy is not local, the avatar URL is
 * processed using the specified file strategy. The new user is saved to the database with the processed or
 * original avatar URL.
 *
 * @param {Object} params - The parameters object for user creation.
 * @param {string} params.email - The email of the new user.
 * @param {string} params.avatarUrl - The avatar URL of the new user.
 * @param {string} params.provider - The provider of the user's account.
 * @param {string} params.providerKey - The key to identify the provider in the user model.
 * @param {string} params.providerId - The provider-specific ID of the user.
 * @param {string} params.username - The username of the new user.
 * @param {string} params.name - The name of the new user.
 * @param {AppConfig} appConfig - The application configuration object.
 * @param {boolean} [params.emailVerified=false] - Optional. Indicates whether the user's email is verified. Defaults to false.
 *
 * @returns {Promise<User>}
 *          A promise that resolves to the newly created user object.
 *
 * @throws {Error} Throws an error if there's an issue creating or saving the new user object.
 */
const createSocialUser = async ({
  email,
  avatarUrl,
  provider,
  providerKey,
  providerId,
  username,
  name,
  appConfig,
  emailVerified,
  company_name,
}) => {
  const companyIdentity = resolveCompanyIdentity(company_name);
  const tenantUsername = await resolveUniqueTenantUsername(companyIdentity.company_slug, username);

  const update = {
    email,
    avatar: avatarUrl,
    provider,
    [providerKey]: providerId,
    username: tenantUsername,
    company_name: companyIdentity.company_name,
    company_slug: companyIdentity.company_slug,
    name,
    emailVerified,
  };

  const balanceConfig = getBalanceConfig(appConfig);
  const newUserId = await createUser(update, balanceConfig);
  const fileStrategy = appConfig?.fileStrategy ?? process.env.CDN_PROVIDER;
  const isLocal = fileStrategy === FileSources.local;

  if (!isLocal) {
    const resizedBuffer = await resizeAvatar({
      userId: newUserId,
      input: avatarUrl,
    });
    const { processAvatar } = getStrategyFunctions(fileStrategy);
    const avatar = await processAvatar({
      buffer: resizedBuffer,
      userId: newUserId,
      username: tenantUsername,
      companySlug: companyIdentity.company_slug,
      manual: 'false',
    });
    await updateUser(newUserId, { avatar });
  }

  return await getUserById(newUserId);
};

module.exports = {
  handleExistingUser,
  createSocialUser,
};
