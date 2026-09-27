import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Inject,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResendConfirmationDto } from './dto/resend-confirmation.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from '../config/jwt.config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResult, JwtPayload, RequestWithRefreshToken } from './auth.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { City } from '../cities/entities/city.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Role } from '../shared/enums/role.enum';
import { OAuthUser } from './oauth/oauth.types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @Optional()
    private readonly mailService?: MailService,
  ) {}

  private generateTokens(user: { id: string; email: string; role: Role }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.accessSecret,
      expiresIn: this.jwtConfiguration.accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.refreshSecret,
      expiresIn: this.jwtConfiguration.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: ['id', 'email', 'password', 'role', 'refreshToken', 'name'],
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return this.issueTokens(user);
  }

  async issueTokens(user: User): Promise<AuthResult> {
    const { accessToken, refreshToken } = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    user.refreshToken = refreshToken;
    await this.userRepository.save(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      accessToken,
      refreshToken,
    };
  }

  async loginWithOAuth(oauthUser: OAuthUser): Promise<AuthResult> {
    let user = await this.userRepository.findOne({
      where: { email: oauthUser.email },
      select: ['id', 'email', 'role', 'refreshToken', 'name'],
    });

    if (!user) {
      const randomPassword = randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = this.userRepository.create({
        email: oauthUser.email,
        password: hashedPassword,
        name: oauthUser.name,
        role: Role.USER,
      });

      user = await this.userRepository.save(user);
    } else if (!user.name && oauthUser.name) {
      user.name = oauthUser.name;
      user = await this.userRepository.save(user);
    }

    return this.issueTokens(user);
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      let city: City | null = null;
      if (dto.cityId) {
        city = await this.cityRepository.findOne({
          where: { id: dto.cityId },
        });
        if (!city) {
          throw new BadRequestException('Город с таким id не найден');
        }
      }

      const birthdate = dto.birthdate ? new Date(dto.birthdate) : undefined;
      const newUserData: Partial<User> = {
        email: dto.email,
        password: hashedPassword,
        city,
        about: dto.about,
        birthdate,
        role: Role.USER,
      };
      const newUser = this.userRepository.create(newUserData);
      const user = await this.userRepository.save(newUser);
      if (!user) {
        throw new UnauthorizedException('Не удалось создать пользователя');
      }
      const { accessToken, refreshToken } = this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      user.refreshToken = refreshToken;
      await this.userRepository.save(user);

      // Письмо с подтверждением отправляем без блокировки регистрации:
      // если SMTP недоступен, пользователь всё равно сможет войти.
      void this.sendConfirmationLetter(user).catch((err: unknown) => {
        console.error('Confirmation email was not sent:', err);
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          city: user.city
            ? {
                id: user.city.id,
                name: user.city.name,
                region: user.city.region,
              }
            : null,
          about: user.about,
          birthdate: user.birthdate
            ? user.birthdate.toISOString().split('T')[0]
            : null,
          role: user.role,
          name: user.name,
        },
        accessToken,
        refreshToken,
      };
    } catch (err: unknown) {
      if (err instanceof QueryFailedError) {
        const dbError = err as unknown as { code?: string; errno?: number };
        const code = dbError.code;
        if (code === '23505' || code === 'ER_DUP_ENTRY') {
          throw new ConflictException(
            'Пользователь с таким email уже существует',
          );
        }
      }
      if (err instanceof BadRequestException) {
        throw err;
      }
      console.error(
        'AuthService.register error:',
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('Ошибка регистрации');
    }
  }

  async checkUser(loginDto: LoginDto): Promise<{ exists: boolean }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: ['id', 'email', 'password'],
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return { exists: true };
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.refreshToken = null;
      await this.userRepository.save(user);
    }
  }

  /**
   * Отправка письма с подтверждением email. Ошибки почты не должны
   * блокировать регистрацию, поэтому вызов всегда оборачивается в try/catch.
   */
  private async sendConfirmationLetter(user: User): Promise<void> {
    if (!this.mailService) {
      return;
    }

    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'email_confirmation' },
      {
        secret: this.jwtConfiguration.accessSecret,
        expiresIn: '24h',
      },
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const confirmationLink = `${frontendUrl}/confirm-email?token=${token}`;

    await this.mailService.sendEmailConfirmation(user.email, confirmationLink);
  }

  /** Подтверждение email по одноразовому токену из письма. */
  async confirmEmail(dto: ConfirmEmailDto): Promise<{ message: string }> {
    let payload: { sub: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        type?: string;
      }>(dto.token, {
        secret: this.jwtConfiguration.accessSecret,
      });
    } catch {
      throw new BadRequestException('Ссылка недействительна или истекла');
    }

    if (payload.type !== 'email_confirmation') {
      throw new BadRequestException('Ссылка недействительна или истекла');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    user.isEmailConfirmed = true;
    await this.userRepository.save(user);

    return { message: 'Email подтверждён' };
  }

  /** Повторная отправка письма с подтверждением. */
  async resendConfirmation(
    dto: ResendConfirmationDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'Письмо отправлено' };
    }

    if (user.isEmailConfirmed) {
      return { message: 'Email уже подтверждён' };
    }

    await this.sendConfirmationLetter(user);

    return { message: 'Письмо отправлено' };
  }

  /**
   * Запрос на восстановление пароля. Письмо отправляется всегда одинаковым
   * текстом, чтобы нельзя было определить, зарегистрирован ли email.
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const message = 'Если аккаунт с таким email существует, письмо отправлено';

    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      return { message };
    }

    if (!this.mailService) {
      throw new InternalServerErrorException('Почтовый сервис не настроен');
    }

    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'password_reset' },
      {
        secret: this.jwtConfiguration.accessSecret,
        expiresIn: '1h',
      },
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.mailService.sendEmail({
      to: user.email,
      subject: 'Восстановление пароля SkillSwap',
      html: [
        '<div style="font-family: Arial, sans-serif; line-height: 1.5">',
        '<h2>Восстановление пароля</h2>',
        `<p>Для смены пароля перейдите по ссылке:</p>`,
        `<p><a href="${resetLink}">Сменить пароль</a></p>`,
        '<p>Ссылка действительна в течение 1 часа.</p>',
        '<p>Если вы не запрашивали смену пароля, просто проигнорируйте это письмо.</p>',
        '</div>',
      ].join(''),
    });

    return { message };
  }

  /** Сброс пароля по одноразовому токену из письма. */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    let payload: { sub: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        type?: string;
      }>(dto.token, {
        secret: this.jwtConfiguration.accessSecret,
      });
    } catch {
      throw new BadRequestException('Ссылка недействительна или истекла');
    }

    if (payload.type !== 'password_reset') {
      throw new BadRequestException('Ссылка недействительна или истекла');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    // После смены пароля завершаем все активные сессии
    user.refreshToken = null;

    await this.userRepository.save(user);

    return { message: 'Пароль успешно изменён' };
  }

  async refreshFromPayload(
    userPayload: RequestWithRefreshToken,
  ): Promise<AuthResult> {
    const user = await this.userRepository.findOne({
      where: { id: userPayload.user.sub },
      select: ['id', 'email', 'role', 'refreshToken'],
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (userPayload.user.refreshToken !== user.refreshToken) {
      throw new UnauthorizedException('Неверный refreshToken');
    }

    return this.issueTokens(user);
  }
}
