import { IsString, Length } from 'class-validator';

// Phase 1 预留：登录用 name + password，但 Phase 1 实际用注册替代登录
export class LoginDto {
  @IsString()
  @Length(1, 20)
  name: string;
}
