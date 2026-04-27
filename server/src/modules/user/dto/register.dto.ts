import { IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(1, 20)
  name: string;
}
