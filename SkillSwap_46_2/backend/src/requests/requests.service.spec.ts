import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { MailService } from '../mail/mail.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Request } from './entities/request.entity';
import { Skill } from '../skills/entities/skill.entity';

describe('RequestsService', () => {
  let service: RequestsService;

  const notificationsGateway = {
    notifyNewRequest: jest.fn(),
    notifyRequestAccepted: jest.fn(),
    notifyRequestRejected: jest.fn(),
  };

  const skillRepo = { findOne: jest.fn() };
  const requestRepoInTransaction = { create: jest.fn(), save: jest.fn() };

  const manager = {
    getRepository: jest.fn((entity: unknown) =>
      entity === Skill ? skillRepo : requestRepoInTransaction,
    ),
  };

  const requestsRepository = {
    manager: {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb(manager)),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: MailService,
          useValue: { sendUserNotification: jest.fn() },
        },
        {
          provide: NotificationsGateway,
          useValue: notificationsGateway,
        },
        {
          provide: getRepositoryToken(Request),
          useValue: requestsRepository,
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const requestedSkill = {
      id: 'requested-skill-id',
      title: 'Гитара',
      user: { id: 'receiver-id', email: 'receiver@test.com' },
    };

    const offeredSkill = {
      id: 'offered-skill-id',
      title: 'Йога',
      user: { id: 'sender-id', name: 'Отправитель' },
    };

    beforeEach(() => {
      skillRepo.findOne
        .mockResolvedValueOnce(requestedSkill)
        .mockResolvedValueOnce(offeredSkill);

      requestRepoInTransaction.create.mockReturnValue({ id: 'request-id' });
      requestRepoInTransaction.save.mockResolvedValue({ id: 'request-id' });
    });

    it('уведомляет получателя навыком, который предлагает отправитель, а не его собственным', async () => {
      await service.create(
        {
          offeredSkillId: 'offered-skill-id',
          requestedSkillId: 'requested-skill-id',
        },
        'sender-id',
      );

      expect(notificationsGateway.notifyNewRequest).toHaveBeenCalledWith(
        'receiver-id',
        'Отправитель',
        'Йога',
        'offered-skill-id',
      );
    });
  });
});
