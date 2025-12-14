const fs = require('fs/promises');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const { logger } = require('@librechat/data-schemas');
const { OUTPUT_DIR } = require('./constants');

class DocumentRenderer {
  constructor() {
    this.outputDir = OUTPUT_DIR;
  }

  async render({ templatePath, sessionId, payload }) {
    const binary = await fs.readFile(templatePath, 'binary');
    const zip = new PizZip(binary);
    let doc;
    try {
      doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      doc.render(payload);
    } catch (error) {
      logger.error('LexDocGen: docxtemplater render error', error);
      throw new Error(
        'Unable to render document. Please verify that placeholders match collected fields.',
      );
    }

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    const sessionOutputDir = path.join(this.outputDir, sessionId);
    await fs.mkdir(sessionOutputDir, { recursive: true });

    const timestamp = Date.now();
    const finalPath = path.join(sessionOutputDir, `final-${timestamp}.docx`);
    const inputsPath = path.join(sessionOutputDir, `inputs-${timestamp}.json`);

    await fs.writeFile(finalPath, buffer);
    await fs.writeFile(inputsPath, JSON.stringify(payload, null, 2), 'utf8');

    return { finalPath, inputsPath };
  }
}

module.exports = DocumentRenderer;
