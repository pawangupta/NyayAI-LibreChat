const MAX_TITLE_LENGTH = 200;

function getFirstPromptTitle(text = '') {
  if (typeof text !== 'string') {
    return null;
  }

  const title = text.replace(/\s+/g, ' ').trim();
  if (title.length === 0) {
    return null;
  }

  return title.slice(0, MAX_TITLE_LENGTH);
}

module.exports = { getFirstPromptTitle, MAX_TITLE_LENGTH };