import { USE_MOCKS } from "../config/apiConfig";
import type {
  IMyRequests,
  ISkillExchange,
  ISkillExchangeData,
  TId,
  TRequestStatus,
} from "../utils/types";
import { request } from "./client";

interface ApiResponse<T> {
  status: boolean;
  data: T;
}

// формат, который реально принимает бэк (CreateRequestDto)
interface ICreateRequestPayload {
  offeredSkillId: TId;
  requestedSkillId: TId;
}

// маппинг фронтового ISkillExchangeData -> CreateRequestDto бэка.
// requestedSkillId обязателен: requiredSkillUserId бэку не подходит,
// т.к. requestedSkillId ищется бэком как навык (skillRepo.findOne),
// а не как пользователь.
const formatCreateRequestPayload = (
  data: ISkillExchangeData,
): ICreateRequestPayload => {
  if (!data.requestedSkillId) {
    throw new Error(
      "createRequest: не передан requestedSkillId (id запрашиваемого навыка)",
    );
  }

  return {
    offeredSkillId: data.userSkill,
    requestedSkillId: data.requestedSkillId,
  };
};

// реальная форма ответа бэка (entities/request.entity.ts) — без {status, data}
// обёртки и без плоских полей fromUserId/toUserId/userSkill, которые ждёт фронт.
interface IBackendRequestEntity {
  id: TId;
  status: TRequestStatus;
  isRead: boolean;
  createdAt: string;
  sender: { id: TId };
  receiver: { id: TId };
  offeredSkill: { id: TId };
  requestedSkill: { id: TId };
}

const mapBackendRequest = (raw: IBackendRequestEntity): ISkillExchange => ({
  id: raw.id,
  userSkill: raw.offeredSkill.id,
  requiredSkillUserId: raw.receiver.id,
  requestedSkillId: raw.requestedSkill.id,
  status: raw.status,
  fromUserId: raw.sender.id,
  toUserId: raw.receiver.id,
  createdAt: raw.createdAt,
});

//POST create
export const createRequest = (
  data: ISkillExchangeData,
): Promise<ISkillExchange> => {
  if (USE_MOCKS) {
    return fetch("/request-single.json")
      .then((r) => r.json())
      .then((res) => ({
        ...res.data,
        ...data,
        status: "pending",
        fromUserId: "user-1",
        toUserId: data.requiredSkillUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
  }

  return request<IBackendRequestEntity>("/requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatCreateRequestPayload(data)),
  }).then(mapBackendRequest);
};

//GET my
// бэк не отдаёт единый /requests/my — только раздельные /requests/incoming
// (входящие = received) и /requests/outgoing (исходящие = sent).
export const getMyRequests = (): Promise<IMyRequests> => {
  if (USE_MOCKS) {
    return fetch("/requests.json")
      .then((r) => r.json())
      .then((res) => res.data);
  }

  return Promise.all([
    request<IBackendRequestEntity[]>("/requests/incoming"),
    request<IBackendRequestEntity[]>("/requests/outgoing"),
  ]).then(([incoming, outgoing]) => ({
    received: incoming.map(mapBackendRequest),
    sent: outgoing.map(mapBackendRequest),
  }));
};

//GET by id
export const getRequestById = (id: TId): Promise<ISkillExchange> => {
  if (USE_MOCKS) {
    return fetch("/request-single.json")
      .then((r) => r.json())
      .then((res) => res.data);
  }
  return request<ApiResponse<ISkillExchange>>(`/requests/${id}`).then(
    (res: { status: boolean; data: ISkillExchange }) => res.data,
  );
};

// сырой ответ бэка на accept/reject: там грузятся relations только
// ['receiver', 'sender'] (requests.service.ts updateStatus), offeredSkill/
// requestedSkill в ответе нет — в отличие от IBackendRequestEntity.
interface IBackendRequestStatusEntity {
  id: TId;
  status: TRequestStatus;
  isRead: boolean;
  createdAt: string;
  sender: { id: TId };
  receiver: { id: TId };
}

export type IRequestStatusUpdate = Pick<ISkillExchange, "id" | "status"> &
  Partial<Pick<ISkillExchange, "fromUserId" | "toUserId">>;

//PATCH status
// бэк не принимает generic {status}, у него отдельные роуты accept/reject
// без тела — другого способа поменять статус заявки нет.
export const updateRequestStatus = (
  id: TId,
  status: TRequestStatus,
): Promise<IRequestStatusUpdate> => {
  if (USE_MOCKS) {
    return fetch("/request-single.json")
      .then((r) => r.json())
      .then((res) => ({
        ...res.data,
        status,
        updatedAt: new Date().toISOString(),
      }));
  }

  if (status !== "accepted" && status !== "rejected") {
    return Promise.reject(
      new Error(
        `updateRequestStatus: бэк поддерживает только "accepted"/"rejected", получено "${status}"`,
      ),
    );
  }

  const endpoint = status === "accepted" ? "accept" : "reject";

  return request<IBackendRequestStatusEntity>(`/requests/${id}/${endpoint}`, {
    method: "PATCH",
  }).then((raw) => ({
    id: raw.id,
    status: raw.status,
    fromUserId: raw.sender.id,
    toUserId: raw.receiver.id,
  }));
};

//PATCH complete
export const completeRequest = (id: TId): Promise<ISkillExchange> => {
  if (USE_MOCKS) {
    return fetch("/request-single.json")
      .then((r) => r.json())
      .then((res) => ({
        ...res.data,
        status: "done",
        updatedAt: new Date().toISOString(),
      }));
  }

  return request<ApiResponse<ISkillExchange>>(`/requests/${id}/complete`, {
    method: "PATCH",
  }).then((res: { status: boolean; data: ISkillExchange }) => res.data);
};