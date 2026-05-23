import { validate } from 'class-validator';
import { AskLedgerQuestionDto } from './ask-ledger-question.dto';

describe('AskLedgerQuestionDto', () => {
  it('accepts a useful report question', async () => {
    const dto = new AskLedgerQuestionDto();
    dto.question = 'What was income in Q1?';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an empty or too-long question', async () => {
    const emptyDto = new AskLedgerQuestionDto();
    emptyDto.question = '';

    const longDto = new AskLedgerQuestionDto();
    longDto.question = 'x'.repeat(501);

    expect(await validate(emptyDto)).not.toHaveLength(0);
    expect(await validate(longDto)).not.toHaveLength(0);
  });
});
