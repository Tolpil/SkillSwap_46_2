import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { MailService } from '../mail/mail.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Request } from './entities/request.entity';
import { Skill } from '../skills/entities/skill.entity';
import { RequestStatus } from './request-status.enums';

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
    save: jest.fn(),
  };

  const requestsRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
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
  
    describe('updateStatus', () => {
      const receiver = { id: 'receiver-id', email: 'receiver@test.com' };
      const sender = { id: 'sender-id', email: 'sender@test.com' };
  
      const buildRequest = (status = 'pending') => ({
        id: 'request-id',
        status,
        isRead: false,
        receiver,
        sender,
        offeredSkill: { id: 'offered-skill-id', title: 'Йога', user: sender },
        requestedSkill: {
          id: 'requested-skill-id',
          title: 'Гитара',
          user: receiver,
        },
      });
  
      beforeEach(() => {
        manager.save.mockImplementation(async (value: unknown) => value);
      });
  
      it('передаёт навыки владельцам при принятии заявки', async () => {
        requestsRepository.findOne.mockResolvedValue(buildRequest());
        manager.save.mockClear();
  
        await service.updateStatus(
          'request-id',
          'receiver-id',
          RequestStatus.ACCEPTED,
        );
  
        // Оба навыка сохраняются со сменёнными владельцами в одной транзакции
        expect(manager.save).toHaveBeenCalledWith([
          { id: 'offered-skill-id', title: 'Йога', user: receiver },
          { id: 'requested-skill-id', title: 'Гитара', user: sender },
        ]);
  
        // Статус заявки тоже обновляется внутри транзакции
        expect(manager.save).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'request-id', status: 'accepted' }),
        );
      });
  
      it('не меняет владельцев при отклонении заявки', async () => {
        requestsRepository.findOne.mockResolvedValue(buildRequest());
        manager.save.mockClear();
  
        await service.updateStatus(
          'request-id',
          'receiver-id',
          RequestStatus.REJECTED,
        );
  
        expect(manager.save).toHaveBeenCalledTimes(1);
        expect(manager.save).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'request-id', status: 'rejected' }),
        );
      });
    });
  });
});
