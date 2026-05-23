import { IsString, Length } from 'class-validator';

export class AskLedgerQuestionDto {
  @IsString()
  @Length(1, 500)
  question!: string;
}
