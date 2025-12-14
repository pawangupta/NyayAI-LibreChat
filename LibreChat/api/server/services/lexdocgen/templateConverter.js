const fs = require('fs/promises');
const path = require('path');
const mammoth = require('mammoth');
const PizZip = require('pizzip');
const { logger } = require('@librechat/data-schemas');
const { TEMPLATE_DIR } = require('./constants');
const { getDefaultSchema } = require('./defaultSchemas');

class TemplateConverter {
  constructor() {
    this.templatesDir = TEMPLATE_DIR;
  }

  async convert({ tempPath, originalName, sessionId }) {
    const safeName = originalName?.replace(/\s+/g, '_') || 'document.docx';
    const fileName = `${sessionId}-${Date.now()}-${safeName}`;
    const targetPath = path.join(this.templatesDir, fileName);
    await fs.copyFile(tempPath, targetPath);

    const { schema, placeholders } = await this._extractSchema(targetPath);
    const preview = await this._extractPreview(targetPath);

    return {
      templatePath: targetPath,
      templateFileName: fileName,
      schema,
      placeholderCount: placeholders.length,
      textPreview: preview,
      detectedDocumentType: this._detectDocumentType(preview),
    };
  }

  async _extractSchema(filePath) {
    try {
      const binary = await fs.readFile(filePath, 'binary');
      const zip = new PizZip(binary);
      const docXml = zip.file('word/document.xml')?.asText();
      if (!docXml) {
        return { schema: getDefaultSchema(), placeholders: [] };
      }

      const matches = docXml.match(/{{\s*([^}]+)\s*}}/g) || [];
      const placeholders = matches.map((match) => match.replace(/[{|}\s]/g, '')).filter(Boolean);
      if (!placeholders.length) {
        logger.warn(
          'LexDocGen converter did not find placeholders; falling back to default schema.',
        );
        return { schema: getDefaultSchema(), placeholders: [] };
      }

      const unique = Array.from(new Set(placeholders));
      const schema = unique.map((key) => ({
        key,
        label: this._humanize(key),
        type: 'string',
        required: true,
        description: `Value for ${this._humanize(key)}`,
      }));
      return { schema, placeholders: unique };
    } catch (error) {
      logger.error('LexDocGen: failed to read template schema', error);
      return { schema: getDefaultSchema(), placeholders: [] };
    }
  }

  async _extractPreview(filePath) {
    try {
      const { value } = await mammoth.extractRawText({ path: filePath });
      return value?.trim().slice(0, 2000) ?? '';
    } catch (error) {
      logger.warn('LexDocGen: unable to extract preview text', error.message);
      return '';
    }
  }

  _detectDocumentType(preview) {
    if (!preview) {
      return 'will';
    }
    if (/last\s+will\s+and\s+testament/i.test(preview)) {
      return 'will';
    }
    if (/employment\s+agreement/i.test(preview)) {
      return 'employment_agreement';
    }
    if (/sale\s+agreement/i.test(preview)) {
      return 'sale_agreement';
    }
    return 'will';
  }

  _humanize(key) {
    return key
      .replace(/[_\-.]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }
}

module.exports = TemplateConverter;
