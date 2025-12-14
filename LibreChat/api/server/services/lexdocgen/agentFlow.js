const { RunnableSequence, RunnableLambda } = require('@langchain/core/runnables');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { logger } = require('@librechat/data-schemas');

let ChatOpenAI;
try {
  ({ ChatOpenAI } = require('@langchain/openai'));
} catch (_error) {
  ChatOpenAI = null;
  logger.warn('LexDocGen: @langchain/openai not available, falling back to rule-based prompts.');
}

class LexDocGenAgent {
  constructor(options = {}) {
    this.modelName = options.modelName || process.env.LEXDOCGEN_LLM || 'gpt-4o-mini';
    this.temperature = options.temperature ?? 0.2;
    this.llm = options.llm ?? this._createLLM();
    this.prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'You are LexDocGen, an expert legal document intake specialist. Ask one concise question at a time, ' +
          'cite the field label, and explain why it is needed when helpful. Use a polite, plain-language tone.',
      ],
      [
        'human',
        'Schema: {schema}\nMissingField: {field}\nCurrentAnswers: {answers}\n' +
          'Craft the next question that gathers ONLY MissingField. Provide a JSON object with "question".',
      ],
    ]);

    if (this.llm) {
      const parser = new StringOutputParser();
      this.llmChain = RunnableSequence.from([this.prompt, this.llm, parser]);
    } else {
      this.ruleChain = RunnableLambda.from(async (input) => this._ruleBasedQuestion(input));
    }
  }

  _createLLM() {
    if (!ChatOpenAI) {
      return null;
    }

    const apiKey = process.env.LEXDOCGEN_OPENAI_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.warn('LexDocGen: OPENAI_API_KEY missing, falling back to deterministic prompts.');
      return null;
    }

    return new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: this.modelName,
      temperature: this.temperature,
      maxTokens: 256,
    });
  }

  getMissingFields(session) {
    const answered = new Set(Object.keys(session.responses ?? {}));
    return (session.template?.schema ?? []).filter((field) => !answered.has(field.key));
  }

  async getNextStep(session) {
    const missing = this.getMissingFields(session);
    if (!missing.length) {
      return {
        done: true,
        prompt:
          'All template fields are captured. Please confirm if you would like to generate the final document.',
        pendingField: null,
      };
    }

    const nextField = missing[0];
    const context = {
      schema: JSON.stringify(session.template.schema, null, 2),
      field: JSON.stringify(nextField, null, 2),
      answers: JSON.stringify(session.responses ?? {}, null, 2),
    };

    let question;
    if (this.llmChain) {
      try {
        const raw = await this.llmChain.invoke(context);
        question = this._parseQuestion(raw);
      } catch (error) {
        logger.warn(
          'LexDocGenAgent: LLM invocation failed, using deterministic question.',
          error.message,
        );
        question = await this._ruleBasedQuestion({
          field: nextField,
          responses: session.responses ?? {},
        });
      }
    } else {
      question = await this.ruleChain.invoke({
        field: nextField,
        responses: session.responses ?? {},
      });
    }

    return {
      done: false,
      prompt: question,
      pendingField: nextField,
    };
  }

  _parseQuestion(raw) {
    if (!raw) {
      return '';
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed.question) {
        return parsed.question;
      }
    } catch (_error) {
      // fall through to text handling
    }
    return typeof raw === 'string' ? raw : JSON.stringify(raw);
  }

  _ruleBasedQuestion({ field, responses }) {
    const answeredCount = Object.keys(responses || {}).length;
    const qualifier = answeredCount === 0 ? 'To get started' : 'Next';
    const description = field.description ? ` (${field.description})` : '';
    const hint = field.required ? 'This field is required.' : 'This field is optional.';
    return `${qualifier}, please provide **${field.label}**${description}. ${hint}`;
  }
}

module.exports = LexDocGenAgent;
